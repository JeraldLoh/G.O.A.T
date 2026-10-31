// The ONE data access module. Feed, summary and stats rules live here; storage
// lives in a backend (lib/store-types.ts). DEMO_MODE=1 uses the in-memory seeds,
// anything else uses Supabase. Callers don't know which one is running.
import {
  FLAG_HIDE_THRESHOLD,
  MOCK_MODEL,
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
import { memoryBackend } from "@/lib/store-memory";
import { supabaseBackend } from "@/lib/store-supabase";
import type { BankMeta, Snapshot } from "@/lib/store-types";

const backend = process.env.DEMO_MODE === "1" ? memoryBackend : supabaseBackend;

function percent(part: number, whole: number): number | null {
  return whole === 0 ? null : (part / whole) * 100;
}

function isVisible(card: Card): boolean {
  return card.verified && card.flags < FLAG_HIDE_THRESHOLD;
}

function summarize(bank: BankMeta, data: Snapshot): BankSummary {
  const generations = data.generations.filter((g) => g.bankId === bank.id);
  return {
    ...bank,
    cardCount: data.cards.filter((c) => c.bankId === bank.id && isVisible(c)).length,
    quizCount: data.quizzes.filter((q) => q.bankId === bank.id).length,
    verifiedPct: percent(
      generations.reduce((sum, g) => sum + g.cardsVerified, 0),
      generations.reduce((sum, g) => sum + g.cardsTotal, 0),
    ),
    accuracyScore: percent(bank.ratingsUp, bank.ratingsUp + bank.ratingsDown),
  };
}

function matchesFilter(bank: BankMeta, filter: BankFilter): boolean {
  if (filter.subjects && !filter.subjects.includes(bank.subject)) return false;
  if (filter.level && bank.level !== filter.level) return false;
  if (filter.tags && !filter.tags.some((tag) => bank.tags.includes(tag))) return false;
  return true;
}

function newestBanks(data: Snapshot, filter: BankFilter): BankMeta[] {
  return data.banks
    .filter((bank) => matchesFilter(bank, filter))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function listBanks(filter: BankFilter = {}): Promise<BankSummary[]> {
  const data = await backend.read();
  return newestBanks(data, filter).map((bank) => summarize(bank, data));
}

export async function getBank(id: string) {
  const [data, sourceText] = await Promise.all([backend.read(), backend.readSourceText(id)]);
  const meta = data.banks.find((bank) => bank.id === id);
  if (!meta || sourceText === null) return null;
  return {
    bank: { ...meta, sourceText },
    cards: data.cards.filter((c) => c.bankId === id).sort((a, b) => a.order - b.order),
    quizzes: data.quizzes.filter((q) => q.bankId === id),
    summary: summarize(meta, data),
  };
}

export async function getFeed(filter: BankFilter = {}): Promise<FeedEntry[]> {
  const data = await backend.read();
  const entries: FeedEntry[] = [];
  for (const bank of newestBanks(data, filter)) {
    const summary = summarize(bank, data);
    const cards = data.cards
      .filter((c) => c.bankId === bank.id && isVisible(c))
      .sort((a, b) => a.order - b.order);
    // Topics run in order of their first card; a topic with no visible card is skipped.
    for (const topic of new Set(cards.map((c) => c.topic))) {
      for (const card of cards.filter((c) => c.topic === topic)) {
        entries.push({ kind: "card", card, bank: summary });
      }
      for (const quiz of data.quizzes.filter((q) => q.bankId === bank.id && q.topic === topic)) {
        entries.push({ kind: "quiz", quiz, bank: summary });
      }
    }
  }
  return entries;
}

export async function saveBank(bank: Bank): Promise<void> {
  await backend.saveBank(bank);
}

export async function saveCard(card: Card): Promise<void> {
  await backend.saveCard(card);
}

export async function saveQuiz(quiz: Quiz): Promise<void> {
  await backend.saveQuiz(quiz);
}

export async function saveGeneration(generation: Generation): Promise<void> {
  await backend.saveGeneration(generation);
}

/** Counts generations since UTC midnight, for DAILY_GENERATION_LIMIT. */
export async function countGenerationsToday(): Promise<number> {
  const today = new Date().toISOString().slice(0, 10);
  const { generations } = await backend.read();
  return generations.filter((g) => g.createdAt.startsWith(today)).length;
}

/** Returns the card's flag count, or null if the card is unknown. */
export async function addFlag(
  input: Pick<Flag, "cardId" | "deviceId" | "reason">,
): Promise<number | null> {
  return backend.addFlag(input);
}

/** Returns the bank's new score, or null if the bank is unknown. */
export async function addRating(
  bankId: string,
  deviceId: string,
  value: 1 | -1,
): Promise<{ accuracyScore: number | null } | null> {
  const ratings = await backend.addRating(bankId, deviceId, value);
  if (!ratings) return null;
  const { ratingsUp, ratingsDown } = ratings;
  return { accuracyScore: percent(ratingsUp, ratingsUp + ratingsDown) };
}

export async function getStats(): Promise<Stats> {
  const data = await backend.read();
  // Mock runs have no real cost or timing, so they stay out of the evidence numbers.
  const measured = data.generations.filter((g) => g.model !== MOCK_MODEL);
  const sum = (pick: (g: Generation) => number) =>
    measured.reduce((total, g) => total + pick(g), 0);
  const average = (pick: (g: Generation) => number) =>
    measured.length === 0 ? null : sum(pick) / measured.length;

  return {
    banks: data.banks.length,
    cards: data.cards.filter(isVisible).length,
    quizzes: data.quizzes.length,
    verifiedPct: percent(sum((g) => g.cardsVerified), sum((g) => g.cardsTotal)),
    generations: measured.length,
    totalCostUsd: sum((g) => g.costUsd),
    avgCostUsd: average((g) => g.costUsd),
    avgDurationMs: average((g) => g.durationMs),
    flags: data.flagCount,
  };
}
