import { chunkText } from "@/lib/chunk";
import { hasPrice } from "@/lib/cost";
import {
  createGeminiGenerator,
  DEFAULT_MODEL,
  type GeneratedCard,
  type Generator,
  type Usage,
} from "@/lib/llm";
import { mockGenerator } from "@/lib/mock";
import type { Emit } from "@/lib/ndjson";
import {
  DEFAULT_MAX_WORDS,
  type Bank,
  type Card,
  type CreateBankRequest,
  type Generation,
  type Quiz,
} from "@/lib/schemas";
import { countGenerationsToday, saveBank, saveCard, saveGeneration, saveQuiz } from "@/lib/store";
import { locateQuote } from "@/lib/verify";

const MAX_PARALLEL_CHUNKS = 3; // Free-tier keys have low per-minute limits.
const MAX_QUIZZES_PER_TOPIC = 3;
const DEFAULT_DAILY_LIMIT = 50;
// Room for many cards per chunk without letting topics collide across chunks.
const ORDER_STEP = 1000;

export const maxWords = () => Number(process.env.MAX_WORDS) || DEFAULT_MAX_WORDS;

export async function isOverDailyLimit(): Promise<boolean> {
  const limit = Number(process.env.DAILY_GENERATION_LIMIT) || DEFAULT_DAILY_LIMIT;
  return (await countGenerationsToday()) >= limit;
}

export function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

/** Gemini when LLM_API_KEY is set, otherwise the mock, so teammates can test without a key. */
export function getGenerator(): Generator {
  if (!process.env.LLM_API_KEY) return mockGenerator;
  return createGeminiGenerator(process.env.LLM_MODEL || DEFAULT_MODEL);
}

async function forEachLimited<T>(
  items: T[],
  limit: number,
  run: (item: T, index: number) => Promise<void>,
): Promise<void> {
  let next = 0;
  const worker = async () => {
    while (next < items.length) {
      const index = next++;
      await run(items[index], index);
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
}

export type PipelineResult = {
  bank: Bank;
  generation: Generation;
  cardsVerifiedFirstPass: number;
};

/**
 * Upload -> chunks -> cards and quizzes -> verified quotes -> saved, emitting
 * events as it goes. The bank is saved with its first verified card, so a failed
 * run leaves nothing behind. Throws if no card survives.
 */
export async function runPipeline(
  input: CreateBankRequest,
  emit: Emit,
  generator: Generator = getGenerator(),
): Promise<PipelineResult> {
  if (!hasPrice(generator.model)) {
    throw new Error(`No price for ${generator.model}: add it to MODEL_PRICES in lib/cost.ts`);
  }

  const startedAt = Date.now();
  const { text, ...fields } = input;
  const bank: Bank = {
    ...fields,
    id: crypto.randomUUID(),
    origin: "community",
    sourceText: text.normalize("NFKC"),
    ratingsUp: 0,
    ratingsDown: 0,
    createdAt: new Date().toISOString(),
  };
  const { sourceText: _sourceText, ...meta } = bank;
  emit({
    type: "bank",
    bank: { ...meta, cardCount: 0, quizCount: 0, verifiedPct: null, accuracyScore: null },
  });

  const chunks = chunkText(bank.sourceText);
  const usage: Usage = { inputTokens: 0, outputTokens: 0, costUsd: 0 };
  const failures: unknown[] = [];
  let bankSaved: Promise<void> | undefined;
  let cardsTotal = 0;
  let cardsVerified = 0;
  let cardsVerifiedFirstPass = 0;
  let chunksDone = 0;

  emit({ type: "progress", message: "Reading your text", done: 0, total: chunks.length });

  await forEachLimited(chunks, MAX_PARALLEL_CHUNKS, async (chunk, chunkIndex) => {
    try {
      const { cards, quizzes } = await generator.generate(bank.title, chunk, usage);
      cardsTotal += cards.length;

      const located = cards.map((card) => locateQuote(bank.sourceText, card.quote));
      cardsVerifiedFirstPass += located.filter(Boolean).length;

      // One retry for all of this chunk's failed quotes; whatever still fails is dropped.
      const failed = cards.flatMap((card, index) => (located[index] ? [] : [{ card, index }]));
      if (failed.length > 0) {
        const repairs = await generator
          .repairQuotes(chunk, failed.map(({ card }) => card as GeneratedCard), usage)
          .catch((error) => {
            console.error("Quote repair failed", error);
            return new Map<number, string>();
          });
        failed.forEach(({ index }, failedIndex) => {
          const quote = repairs.get(failedIndex);
          if (quote) located[index] = locateQuote(bank.sourceText, quote);
        });
      }

      const verified: Card[] = cards.flatMap((card, index) => {
        const position = located[index];
        if (!position) return [];
        return [
          {
            id: crypto.randomUUID(),
            bankId: bank.id,
            topic: card.topic,
            title: card.title,
            body: card.body,
            // The exact source text, so the displayed quote can't drift from the passage.
            quote: bank.sourceText.slice(position.start, position.end),
            sourceStart: position.start,
            sourceEnd: position.end,
            verified: true,
            flags: 0,
            order: chunkIndex * ORDER_STEP + index,
          },
        ];
      });
      cardsVerified += verified.length;

      if (verified.length > 0) {
        await (bankSaved ??= saveBank(bank));
        for (const card of verified) {
          await saveCard(card);
          emit({ type: "card", card });
        }
      }

      // A quiz on a topic with no surviving card would have nothing to test.
      const topics = new Set(verified.map((card) => card.topic));
      const perTopic = new Map<string, number>();
      for (const quiz of quizzes) {
        const count = perTopic.get(quiz.topic) ?? 0;
        if (!topics.has(quiz.topic) || count >= MAX_QUIZZES_PER_TOPIC) continue;
        perTopic.set(quiz.topic, count + 1);
        const saved: Quiz = { ...quiz, id: crypto.randomUUID(), bankId: bank.id };
        await saveQuiz(saved);
        emit({ type: "quiz", quiz: saved });
      }
    } catch (error) {
      // Other chunks can still succeed, so one failure doesn't end the run.
      console.error(`Chunk ${chunkIndex + 1} of ${chunks.length} failed`, error);
      failures.push(error);
    }
    chunksDone += 1;
    emit({
      type: "progress",
      message: `Finished part ${chunksDone} of ${chunks.length}`,
      done: chunksDone,
      total: chunks.length,
    });
  });

  if (!bankSaved) {
    const reason = failures[0] instanceof Error ? failures[0].message : null;
    throw new Error(reason ?? "No cards could be verified against this text.");
  }

  const generation: Generation = {
    id: crypto.randomUUID(),
    bankId: bank.id,
    model: generator.model,
    inputTokens: usage.inputTokens,
    outputTokens: usage.outputTokens,
    costUsd: usage.costUsd,
    durationMs: Date.now() - startedAt,
    cardsTotal,
    cardsVerified,
    createdAt: new Date().toISOString(),
  };
  await saveGeneration(generation);
  emit({ type: "done", generation });
  return { bank, generation, cardsVerifiedFirstPass };
}
