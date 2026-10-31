// In-memory backend, loaded from /seed. Used when DEMO_MODE=1, so the demo runs
// with no database. Data resets on restart and isn't shared between serverless
// instances, so it can't back a public deployment.
import {
  SeedFileSchema,
  type Bank,
  type Card,
  type Chapter,
  type Flag,
  type Generation,
  type Quiz,
} from "@/lib/schemas";
import type { Backend } from "@/lib/store-types";
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
  chapters: Map<string, Chapter[]>;
};

function loadSeeds(): Db {
  const db: Db = {
    banks: new Map(),
    cards: [],
    quizzes: [],
    generations: [],
    flags: [],
    ratings: new Map(),
    chapters: new Map(),
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
const getDb = () => (holder.__kbDb ??= loadSeeds());

export const memoryBackend: Backend = {
  async read() {
    const db = getDb();
    return {
      banks: [...db.banks.values()].map(({ sourceText: _sourceText, ...meta }) => meta),
      cards: db.cards,
      quizzes: db.quizzes,
      generations: db.generations,
      flagCount: db.flags.length,
    };
  },

  async readSourceText(bankId) {
    return getDb().banks.get(bankId)?.sourceText ?? null;
  },

  async saveBank(bank) {
    getDb().banks.set(bank.id, bank);
  },

  async saveCard(card) {
    getDb().cards.push(card);
  },

  async saveQuiz(quiz) {
    getDb().quizzes.push(quiz);
  },

  async saveGeneration(generation) {
    getDb().generations.push(generation);
  },

  async readChapters(bankId) {
    return getDb().chapters.get(bankId) ?? null;
  },

  async saveChapters(bankId, chapters) {
    getDb().chapters.set(bankId, chapters);
  },

  async addFlag(input) {
    const db = getDb();
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
  },

  async addRating(bankId, deviceId, value) {
    const db = getDb();
    const bank = db.banks.get(bankId);
    if (!bank) return null;
    const key = `${bankId}:${deviceId}`;
    const previous = db.ratings.get(key);
    if (previous === 1) bank.ratingsUp -= 1;
    if (previous === -1) bank.ratingsDown -= 1;
    if (value === 1) bank.ratingsUp += 1;
    else bank.ratingsDown += 1;
    db.ratings.set(key, value);
    return { ratingsUp: bank.ratingsUp, ratingsDown: bank.ratingsDown };
  },
};
