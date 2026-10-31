import { feedContent, type BankDetail } from "@/lib/course";
import type { BankSummary, FeedEntry, LocalProgress } from "@/lib/schemas";

export type BankGroup = { bank: BankSummary; entries: FeedEntry[] };

export function groupBanks(entries: FeedEntry[]): BankGroup[] {
  const banks = new Map<string, BankGroup>();
  for (const entry of entries) {
    if (!banks.has(entry.bank.id)) banks.set(entry.bank.id, { bank: entry.bank, entries: [] });
    banks.get(entry.bank.id)!.entries.push(entry);
  }
  return [...banks.values()];
}

/** Preserve the API feed's topic ordering and visibility rules in a focused bank. */
export function lessonEntries(detail: BankDetail): FeedEntry[] {
  const { cards, quizzes } = feedContent(detail);
  return [...new Set(cards.map((card) => card.topic))].flatMap((topic) => [
    ...cards.filter((card) => card.topic === topic).map((card): FeedEntry => ({ kind: "card", card, bank: detail.summary })),
    ...quizzes.filter((quiz) => quiz.topic === topic).map((quiz): FeedEntry => ({ kind: "quiz", quiz, bank: detail.summary })),
  ]);
}

export function isEntryDone(entry: FeedEntry, progress: LocalProgress): boolean {
  return entry.kind === "card" ? progress.seen.includes(entry.card.id) : entry.quiz.id in progress.quiz;
}

export function entryId(entry: FeedEntry): string {
  return entry.kind === "card" ? entry.card.id : entry.quiz.id;
}
