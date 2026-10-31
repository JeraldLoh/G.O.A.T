import type { Bank, Card, Chapter, Flag, Generation, Quiz } from "@/lib/schemas";

/** Bank without sourceText, which is large and only needed for a single bank. */
export type BankMeta = Omit<Bank, "sourceText">;

/** Everything the feed, summaries and stats are calculated from. */
export type Snapshot = {
  banks: BankMeta[];
  cards: Card[];
  quizzes: Quiz[];
  generations: Generation[];
  flagCount: number;
};

/**
 * Storage only: reads and writes rows, with no feed or stats rules. Those live
 * in lib/store.ts, so every backend behaves the same.
 */
export type Backend = {
  read(): Promise<Snapshot>;
  readSourceText(bankId: string): Promise<string | null>;
  saveBank(bank: Bank): Promise<void>;
  saveCard(card: Card): Promise<void>;
  saveQuiz(quiz: Quiz): Promise<void>;
  saveGeneration(generation: Generation): Promise<void>;
  /** The saved script for a bank, or null if none has been generated. */
  readChapters(bankId: string): Promise<Chapter[] | null>;
  saveChapters(bankId: string, chapters: Chapter[]): Promise<void>;
  /** One flag per device per card. Returns the flag count, or null if the card is unknown. */
  addFlag(input: Pick<Flag, "cardId" | "deviceId" | "reason">): Promise<number | null>;
  /** One rating per device per bank; rating again replaces it. Returns null if the bank is unknown. */
  addRating(
    bankId: string,
    deviceId: string,
    value: 1 | -1,
  ): Promise<{ ratingsUp: number; ratingsDown: number } | null>;
};
