// Supabase backend. Used unless DEMO_MODE=1. Translates between the snake_case
// columns in supabase/migrations and the camelCase types in lib/schemas.ts.
import {
  BankSchema,
  CardSchema,
  FlagSchema,
  GenerationSchema,
  QuizSchema,
  type Bank,
  type Card,
  type Generation,
  type Quiz,
} from "@/lib/schemas";
import { getSupabase } from "@/lib/supabase";
import type { Backend, BankMeta } from "@/lib/store-types";

type Row = Record<string, unknown>;

const BANK_META_COLUMNS =
  "id, title, subject, level, tags, license, attribution, source_url, origin, ratings_up, ratings_down, created_at";

const BankMetaSchema = BankSchema.omit({ sourceText: true });

// Postgres returns "...+00:00", which the schemas reject; they need ISO "...Z".
const toIso = (value: unknown) => new Date(value as string).toISOString();

function toBankMeta(row: Row): BankMeta {
  return BankMetaSchema.parse({
    id: row.id,
    title: row.title,
    subject: row.subject,
    level: row.level,
    tags: row.tags,
    license: row.license,
    attribution: row.attribution,
    sourceUrl: row.source_url ?? undefined,
    origin: row.origin,
    ratingsUp: row.ratings_up,
    ratingsDown: row.ratings_down,
    createdAt: toIso(row.created_at),
  });
}

function toCard(row: Row): Card {
  return CardSchema.parse({
    id: row.id,
    bankId: row.bank_id,
    topic: row.topic,
    title: row.title,
    body: row.body,
    quote: row.quote,
    sourceStart: row.source_start,
    sourceEnd: row.source_end,
    verified: row.verified,
    flags: row.flags,
    order: row.order,
  });
}

function toQuiz(row: Row): Quiz {
  return QuizSchema.parse({
    id: row.id,
    bankId: row.bank_id,
    topic: row.topic,
    question: row.question,
    options: row.options,
    answerIndex: row.answer_index,
    explanation: row.explanation,
  });
}

function toGeneration(row: Row): Generation {
  return GenerationSchema.parse({
    id: row.id,
    bankId: row.bank_id,
    model: row.model,
    inputTokens: row.input_tokens,
    outputTokens: row.output_tokens,
    costUsd: Number(row.cost_usd),
    durationMs: row.duration_ms,
    cardsTotal: row.cards_total,
    cardsVerified: row.cards_verified,
    createdAt: toIso(row.created_at),
  });
}

/** Returns a query's data, or throws its error. */
function unwrap<T>({ data, error }: { data: T | null; error: { message: string } | null }): T {
  if (error) throw new Error(`Supabase: ${error.message}`);
  return data as T;
}

function check({ error }: { error: { message: string } | null }): void {
  if (error) throw new Error(`Supabase: ${error.message}`);
}

function checkedCount({
  count,
  error,
}: {
  count: number | null;
  error: { message: string } | null;
}): number {
  check({ error });
  return count ?? 0;
}

async function rowExists(table: string, id: string): Promise<boolean> {
  const result = await getSupabase().from(table).select("id").eq("id", id).maybeSingle();
  return unwrap(result) !== null;
}

export const supabaseBackend: Backend = {
  async read() {
    const db = getSupabase();
    const [banks, cards, quizzes, generations, flags] = await Promise.all([
      db.from("banks").select(BANK_META_COLUMNS),
      db.from("cards").select("*"),
      db.from("quizzes").select("*"),
      db.from("generations").select("*"),
      db.from("flags").select("*", { count: "exact", head: true }),
    ]);
    return {
      banks: unwrap<Row[]>(banks).map(toBankMeta),
      cards: unwrap<Row[]>(cards).map(toCard),
      quizzes: unwrap<Row[]>(quizzes).map(toQuiz),
      generations: unwrap<Row[]>(generations).map(toGeneration),
      flagCount: checkedCount(flags),
    };
  },

  async readSourceText(bankId) {
    const result = await getSupabase()
      .from("banks")
      .select("source_text")
      .eq("id", bankId)
      .maybeSingle();
    return unwrap<{ source_text: string } | null>(result)?.source_text ?? null;
  },

  async saveBank(bank: Bank) {
    check(
      await getSupabase()
        .from("banks")
        .insert({
          id: bank.id,
          title: bank.title,
          subject: bank.subject,
          level: bank.level,
          tags: bank.tags,
          license: bank.license,
          attribution: bank.attribution,
          source_url: bank.sourceUrl ?? null,
          origin: bank.origin,
          source_text: bank.sourceText,
          ratings_up: bank.ratingsUp,
          ratings_down: bank.ratingsDown,
          created_at: bank.createdAt,
        }),
    );
  },

  async saveCard(card) {
    check(
      await getSupabase()
        .from("cards")
        .insert({
          id: card.id,
          bank_id: card.bankId,
          topic: card.topic,
          title: card.title,
          body: card.body,
          quote: card.quote,
          source_start: card.sourceStart,
          source_end: card.sourceEnd,
          verified: card.verified,
          flags: card.flags,
          order: card.order,
        }),
    );
  },

  async saveQuiz(quiz) {
    check(
      await getSupabase()
        .from("quizzes")
        .insert({
          id: quiz.id,
          bank_id: quiz.bankId,
          topic: quiz.topic,
          question: quiz.question,
          options: quiz.options,
          answer_index: quiz.answerIndex,
          explanation: quiz.explanation,
        }),
    );
  },

  async saveGeneration(generation) {
    check(
      await getSupabase()
        .from("generations")
        .insert({
          id: generation.id,
          bank_id: generation.bankId,
          model: generation.model,
          input_tokens: generation.inputTokens,
          output_tokens: generation.outputTokens,
          cost_usd: generation.costUsd,
          duration_ms: generation.durationMs,
          cards_total: generation.cardsTotal,
          cards_verified: generation.cardsVerified,
          created_at: generation.createdAt,
        }),
    );
  },

  async addFlag(input) {
    if (!(await rowExists("cards", input.cardId))) return null;
    const db = getSupabase();
    const flag = FlagSchema.parse({
      ...input,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    });

    // The unique constraint turns a repeat flag from the same device into a no-op.
    check(
      await db.from("flags").upsert(
        {
          id: flag.id,
          card_id: flag.cardId,
          device_id: flag.deviceId,
          reason: flag.reason,
          created_at: flag.createdAt,
        },
        { onConflict: "card_id,device_id", ignoreDuplicates: true },
      ),
    );

    // Recount rather than add 1, so two devices flagging at once can't lose a flag.
    const flags = checkedCount(
      await db
        .from("flags")
        .select("*", { count: "exact", head: true })
        .eq("card_id", input.cardId),
    );
    check(await db.from("cards").update({ flags }).eq("id", input.cardId));
    return flags;
  },

  async addRating(bankId, deviceId, value) {
    if (!(await rowExists("banks", bankId))) return null;
    const db = getSupabase();

    check(
      await db
        .from("ratings")
        .upsert({ bank_id: bankId, device_id: deviceId, value }, { onConflict: "bank_id,device_id" }),
    );

    // Recount for the same reason as addFlag.
    const count = async (rating: 1 | -1) =>
      checkedCount(
        await db
          .from("ratings")
          .select("*", { count: "exact", head: true })
          .eq("bank_id", bankId)
          .eq("value", rating),
      );
    const [ratingsUp, ratingsDown] = await Promise.all([count(1), count(-1)]);
    check(
      await db
        .from("banks")
        .update({ ratings_up: ratingsUp, ratings_down: ratingsDown })
        .eq("id", bankId),
    );
    return { ratingsUp, ratingsDown };
  },
};
