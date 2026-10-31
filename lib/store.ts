// The ONE data access module. In-memory, loaded from /seed. A Supabase adapter
// can replace the internals later (Lane A) as long as these functions stay.
// Functions are async so that swap doesn't change any caller.
import {
  FLAG_HIDE_THRESHOLD,
  MOCK_MODEL,
  SeedFileSchema,
  type Bank,
  type BankFilter,
  type BankSummary,
  type Card,
  type FeedEntry,
  type Flag,
  type Generation,
  type Quiz,
  type Stats,
} from "@/lib/schemas";
import compoundInterest from "@/seed/compound-interest.json";
import hashTables from "@/seed/hash-tables.json";
import photosynthesis from "@/seed/photosynthesis.json";

type Db = {
  banks: Map<string, Bank>;
  cards: Card[];
  quizzes: Quiz[];
  generations: Generation[];
  flags: Flag[];
  ratings: Map<string, 1 | -1>; // key: `${bankId}:${deviceId}`
};

function loadSeeds(): Db {
  const db: Db = {
    banks: new Map(),
    cards: [],
    quizzes: [],
    generations: [],
    flags: [],
    ratings: new Map(),
  };
  for (const raw of [photosynthesis, hashTables, compoundInterest]) {
    const seed = SeedFileSchema.parse(raw);
    db.banks.set(seed.bank.id, seed.bank);
    db.cards.push(...seed.cards);
    db.quizzes.push(...seed.quizzes);
    if (seed.generation) db.generations.push(seed.generation);
  }
  return db;
}

// On globalThis because Next can bundle each route separately, and dev reloads
// modules; a plain module variable would give routes different copies.
const holder = globalThis as typeof globalThis & { __kbDb?: Db };
const db = (holder.__kbDb ??= loadSeeds());

function percent(part: number, whole: number): number | null {
  return whole === 0 ? null : (part / whole) * 100;
}

function isVisible(card: Card): boolean {
  return card.verified && card.flags < FLAG_HIDE_THRESHOLD;
}

function summarize(bank: Bank): BankSummary {
  const { sourceText: _sourceText, ...rest } = bank;
  const generations = db.generations.filter((g) => g.bankId === bank.id);
  return {
    ...rest,
    cardCount: db.cards.filter((c) => c.bankId === bank.id && isVisible(c)).length,
    quizCount: db.quizzes.filter((q) => q.bankId === bank.id).length,
    verifiedPct: percent(
      generations.reduce((sum, g) => sum + g.cardsVerified, 0),
      generations.reduce((sum, g) => sum + g.cardsTotal, 0),
    ),
    accuracyScore: percent(bank.ratingsUp, bank.ratingsUp + bank.ratingsDown),
  };
}

function matchesFilter(bank: Bank, filter: BankFilter): boolean {
  if (filter.subjects && !filter.subjects.includes(bank.subject)) return false;
  if (filter.level && bank.level !== filter.level) return false;
  if (filter.tags && !filter.tags.some((tag) => bank.tags.includes(tag))) return false;
  return true;
}

function newestBanks(filter: BankFilter): Bank[] {
  return [...db.banks.values()]
    .filter((bank) => matchesFilter(bank, filter))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function listBanks(filter: BankFilter = {}): Promise<BankSummary[]> {
  return newestBanks(filter).map(summarize);
}

export async function getBank(id: string) {
  const bank = db.banks.get(id);
  if (!bank) return null;
  return {
    bank,
    cards: db.cards.filter((c) => c.bankId === id).sort((a, b) => a.order - b.order),
    quizzes: db.quizzes.filter((q) => q.bankId === id),
    summary: summarize(bank),
  };
}

export async function getFeed(filter: BankFilter = {}): Promise<FeedEntry[]> {
  const entries: FeedEntry[] = [];
  for (const bank of newestBanks(filter)) {
    const summary = summarize(bank);
    const cards = db.cards
      .filter((c) => c.bankId === bank.id && isVisible(c))
      .sort((a, b) => a.order - b.order);
    // Topics run in order of their first card; a topic with no visible card is skipped.
    for (const topic of new Set(cards.map((c) => c.topic))) {
      for (const card of cards.filter((c) => c.topic === topic)) {
        entries.push({ kind: "card", card, bank: summary });
      }
      for (const quiz of db.quizzes.filter((q) => q.bankId === bank.id && q.topic === topic)) {
        entries.push({ kind: "quiz", quiz, bank: summary });
      }
    }
  }
  return entries;
}

export async function saveBank(bank: Bank): Promise<void> {
  db.banks.set(bank.id, bank);
}

export async function saveCard(card: Card): Promise<void> {
  db.cards.push(card);
}

export async function saveQuiz(quiz: Quiz): Promise<void> {
  db.quizzes.push(quiz);
}

export async function saveGeneration(generation: Generation): Promise<void> {
  db.generations.push(generation);
}

/** Counts generations since UTC midnight, for DAILY_GENERATION_LIMIT. */
export async function countGenerationsToday(): Promise<number> {
  const today = new Date().toISOString().slice(0, 10);
  return db.generations.filter((g) => g.createdAt.startsWith(today)).length;
}

/** One flag per device per card. Returns the card's flag count, or null if the card is unknown. */
export async function addFlag(
  input: Pick<Flag, "cardId" | "deviceId" | "reason">,
): Promise<number | null> {
  const card = db.cards.find((c) => c.id === input.cardId);
  if (!card) return null;
  const repeat = db.flags.some(
    (f) => f.cardId === input.cardId && f.deviceId === input.deviceId,
  );
  if (!repeat) {
    db.flags.push({ ...input, id: crypto.randomUUID(), createdAt: new Date().toISOString() });
    card.flags += 1;
  }
  return card.flags;
}

/** One rating per device per bank; rating again replaces it. Returns null if the bank is unknown. */
export async function addRating(
  bankId: string,
  deviceId: string,
  value: 1 | -1,
): Promise<{ accuracyScore: number | null } | null> {
  const bank = db.banks.get(bankId);
  if (!bank) return null;
  const key = `${bankId}:${deviceId}`;
  const previous = db.ratings.get(key);
  if (previous === 1) bank.ratingsUp -= 1;
  if (previous === -1) bank.ratingsDown -= 1;
  if (value === 1) bank.ratingsUp += 1;
  else bank.ratingsDown += 1;
  db.ratings.set(key, value);
  return { accuracyScore: percent(bank.ratingsUp, bank.ratingsUp + bank.ratingsDown) };
}

export async function getStats(): Promise<Stats> {
  // Mock runs have no real cost or timing, so they stay out of the evidence numbers.
  const measured = db.generations.filter((g) => g.model !== MOCK_MODEL);
  const sum = (pick: (g: Generation) => number) =>
    measured.reduce((total, g) => total + pick(g), 0);
  const average = (pick: (g: Generation) => number) =>
    measured.length === 0 ? null : sum(pick) / measured.length;

  return {
    banks: db.banks.size,
    cards: db.cards.filter(isVisible).length,
    quizzes: db.quizzes.length,
    verifiedPct: percent(sum((g) => g.cardsVerified), sum((g) => g.cardsTotal)),
    generations: measured.length,
    totalCostUsd: sum((g) => g.costUsd),
    avgCostUsd: average((g) => g.costUsd),
    avgDurationMs: average((g) => g.durationMs),
    flags: db.flags.length,
  };
}
