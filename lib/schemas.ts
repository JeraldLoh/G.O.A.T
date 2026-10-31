// Source of truth for the shared contract (see CLAUDE.md "Shared contracts").
// Changes must be additive and announced in the team chat.
import { z } from "zod";

export const FLAG_HIDE_THRESHOLD = 3;
export const MIN_QUOTE_CHARS = 20;
export const DEFAULT_MAX_WORDS = 3000;
/** Generation.model for the no-LLM mock generator. Excluded from Stats: its cost is not real. */
export const MOCK_MODEL = "mock";

export const SUBJECTS = [
  "science",
  "technology",
  "business",
  "humanities",
  "math",
  "language",
  "health",
  "other",
] as const;
export const LEVELS = ["beginner", "intermediate", "advanced"] as const;
export const LICENSES = [
  "CC0-1.0",
  "CC-BY-4.0",
  "CC-BY-SA-4.0",
  "CC-BY-NC-SA-4.0",
  "PUBLIC-DOMAIN",
  "OWN-WORK",
] as const;
export const ORIGINS = ["community", "ai-seeded"] as const;

export const SubjectSchema = z.enum(SUBJECTS);
export const LevelSchema = z.enum(LEVELS);
export const LicenseSchema = z.enum(LICENSES);
export const OriginSchema = z.enum(ORIGINS);

export const BankSchema = z.object({
  id: z.string(),
  title: z.string().min(1),
  subject: SubjectSchema,
  level: LevelSchema,
  tags: z.array(z.string()),
  license: LicenseSchema,
  attribution: z.string(),
  sourceUrl: z.string().url().optional(),
  origin: OriginSchema,
  /** NFKC-normalized. Card sourceStart/sourceEnd are offsets into this string. */
  sourceText: z.string().min(1),
  ratingsUp: z.number().int().nonnegative(),
  ratingsDown: z.number().int().nonnegative(),
  createdAt: z.string().datetime(),
});

export const BankSummarySchema = BankSchema.omit({ sourceText: true }).extend({
  cardCount: z.number().int().nonnegative(),
  quizCount: z.number().int().nonnegative(),
  /** null when the bank has no generation row (hand-written seeds). */
  verifiedPct: z.number().nullable(),
  /** Thumbs-up share 0–100; null until someone has rated. */
  accuracyScore: z.number().nullable(),
});

export const CardSchema = z.object({
  id: z.string(),
  bankId: z.string(),
  topic: z.string().min(1),
  title: z.string().min(1),
  body: z.string().min(1),
  quote: z.string().min(1),
  sourceStart: z.number().int().nonnegative().nullable(),
  sourceEnd: z.number().int().nonnegative().nullable(),
  verified: z.boolean(),
  flags: z.number().int().nonnegative(),
  order: z.number().int().nonnegative(),
});

export const QuizSchema = z
  .object({
    id: z.string(),
    bankId: z.string(),
    topic: z.string().min(1),
    question: z.string().min(1),
    options: z.array(z.string().min(1)).min(2).max(4),
    answerIndex: z.number().int().nonnegative(),
    explanation: z.string().min(1),
  })
  .refine((q) => q.answerIndex < q.options.length, {
    message: "answerIndex is out of range",
    path: ["answerIndex"],
  });

export const GenerationSchema = z.object({
  id: z.string(),
  bankId: z.string(),
  model: z.string(),
  inputTokens: z.number().int().nonnegative(),
  outputTokens: z.number().int().nonnegative(),
  costUsd: z.number().nonnegative(),
  durationMs: z.number().nonnegative(),
  /** Every card the model returned, INCLUDING ones later dropped. Otherwise verified % is always 100. */
  cardsTotal: z.number().int().nonnegative(),
  cardsVerified: z.number().int().nonnegative(),
  createdAt: z.string().datetime(),
});

export const FlagSchema = z.object({
  id: z.string(),
  cardId: z.string(),
  deviceId: z.string(),
  reason: z.string(),
  createdAt: z.string().datetime(),
});

/** A stock background clip. Decoration only: facts stay in the caption and narration. */
export const StockVideoSchema = z.object({
  url: z.string().url(),
  poster: z.string(),
  credit: z.string(),
  pageUrl: z.string(),
});

/** One narrated screen of a video chapter. Grounded through cardId: it inherits that card's verified quote. */
export const SceneSchema = z.object({
  cardId: z.string(),
  caption: z.string().min(1),
  narration: z.string().min(1),
  emoji: z.string().max(16),
  /** Search term for a background clip. Absent on card-based chapters and older scripts. */
  videoQuery: z.string().optional(),
  /** null: searched, nothing usable. Absent: not searched yet. */
  video: StockVideoSchema.nullable().optional(),
});

/** A video chapter: one topic of a bank, played as a sequence of scenes. */
export const ChapterSchema = z.object({
  id: z.string(),
  bankId: z.string(),
  topic: z.string().min(1),
  title: z.string().min(1),
  order: z.number().int().nonnegative(),
  scenes: z.array(SceneSchema).min(1),
});

/** One screen of a video feed: a chapter with what its player needs. */
export const VideoItemSchema = z.object({
  chapter: ChapterSchema,
  bank: BankSummarySchema,
  cards: z.array(CardSchema),
  quizzes: z.array(QuizSchema),
});

export const FeedEntrySchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("card"), card: CardSchema, bank: BankSummarySchema }),
  z.object({ kind: z.literal("quiz"), quiz: QuizSchema, bank: BankSummarySchema }),
]);

export const StatsSchema = z.object({
  banks: z.number().int().nonnegative(),
  cards: z.number().int().nonnegative(),
  quizzes: z.number().int().nonnegative(),
  generations: z.number().int().nonnegative(),
  flags: z.number().int().nonnegative(),
  totalCostUsd: z.number().nonnegative(),
  // null, not 0, until a real generation exists: never show an unmeasured number.
  verifiedPct: z.number().nullable(),
  avgCostUsd: z.number().nullable(),
  avgDurationMs: z.number().nullable(),
});

/** One file in /seed. generation is null for hand-written banks. */
export const SeedFileSchema = z.object({
  bank: BankSchema,
  cards: z.array(CardSchema),
  quizzes: z.array(QuizSchema),
  generation: GenerationSchema.nullable(),
});

// --- API request shapes ---

export const CreateBankRequestSchema = z.object({
  title: z.string().trim().min(1),
  subject: SubjectSchema,
  level: LevelSchema,
  tags: z.array(z.string().trim().min(1)),
  license: LicenseSchema,
  attribution: z.string().trim(),
  sourceUrl: z.string().url().optional(),
  text: z.string().min(1),
});

export const FlagRequestSchema = z.object({
  cardId: z.string().min(1),
  deviceId: z.string().min(1),
  reason: z.string().trim().min(1).max(500),
});

export const RateRequestSchema = z.object({
  bankId: z.string().min(1),
  deviceId: z.string().min(1),
  value: z.union([z.literal(1), z.literal(-1)]),
});

/** Query for GET /api/banks and GET /api/feed. Comma lists are split in parseBankFilter. */
export const BankFilterSchema = z.object({
  subjects: z.array(SubjectSchema).optional(),
  tags: z.array(z.string()).optional(),
  level: LevelSchema.optional(),
});

// --- NDJSON events from POST /api/banks ---

export const BankStreamEventSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("bank"), bank: BankSummarySchema }),
  z.object({
    type: z.literal("progress"),
    message: z.string(),
    done: z.number(),
    total: z.number(),
  }),
  z.object({ type: z.literal("card"), card: CardSchema }),
  z.object({ type: z.literal("quiz"), quiz: QuizSchema }),
  z.object({ type: z.literal("done"), generation: GenerationSchema }),
  z.object({ type: z.literal("error"), message: z.string() }),
]);

// --- Browser storage (see lib/local.ts) ---

export const LocalFiltersSchema = z.object({
  tags: z.array(z.string()),
  level: LevelSchema.nullable(),
});

export const LocalProgressSchema = z.object({
  seen: z.array(z.string()),
  quiz: z.record(z.string(), z.boolean()),
  /** Video chapters played to the end. Reading a chapter's cards doesn't count. */
  watched: z.array(z.string()).default([]),
});

export type Subject = z.infer<typeof SubjectSchema>;
export type Level = z.infer<typeof LevelSchema>;
export type License = z.infer<typeof LicenseSchema>;
export type Origin = z.infer<typeof OriginSchema>;
export type Bank = z.infer<typeof BankSchema>;
export type BankSummary = z.infer<typeof BankSummarySchema>;
export type Card = z.infer<typeof CardSchema>;
export type Quiz = z.infer<typeof QuizSchema>;
export type Generation = z.infer<typeof GenerationSchema>;
export type Flag = z.infer<typeof FlagSchema>;
export type StockVideo = z.infer<typeof StockVideoSchema>;
export type Scene = z.infer<typeof SceneSchema>;
export type Chapter = z.infer<typeof ChapterSchema>;
export type VideoItem = z.infer<typeof VideoItemSchema>;
export type FeedEntry = z.infer<typeof FeedEntrySchema>;
export type Stats = z.infer<typeof StatsSchema>;
export type SeedFile = z.infer<typeof SeedFileSchema>;
export type BankFilter = z.infer<typeof BankFilterSchema>;
export type CreateBankRequest = z.infer<typeof CreateBankRequestSchema>;
export type FlagRequest = z.infer<typeof FlagRequestSchema>;
export type RateRequest = z.infer<typeof RateRequestSchema>;
export type BankStreamEvent = z.infer<typeof BankStreamEventSchema>;
export type LocalFilters = z.infer<typeof LocalFiltersSchema>;
export type LocalProgress = z.infer<typeof LocalProgressSchema>;

/** Parses ?subjects=a,b&tags=c&level=d, ignoring empty values. Throws ZodError on bad values. */
export function parseBankFilter(params: URLSearchParams): BankFilter {
  const list = (key: string) =>
    params
      .get(key)
      ?.split(",")
      .map((value) => value.trim())
      .filter(Boolean);
  const subjects = list("subjects");
  const tags = list("tags");
  return BankFilterSchema.parse({
    subjects: subjects?.length ? subjects : undefined,
    tags: tags?.length ? tags : undefined,
    level: params.get("level") || undefined,
  });
}
