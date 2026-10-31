// Course progress (Lane B2). kb:progress only stores ids, so a bank's card and
// quiz ids come from GET /api/banks/[id], fetched once per bank and shared.

import { useEffect, useState } from "react";
import { useProgress } from "@/lib/local";
import {
  FLAG_HIDE_THRESHOLD,
  type Bank,
  type BankSummary,
  type Card,
  type LocalProgress,
  type Quiz,
} from "@/lib/schemas";

export type BankDetail = { bank: Bank; cards: Card[]; quizzes: Quiz[]; summary: BankSummary };

const bankRequests = new Map<string, Promise<BankDetail>>();

/** GET /api/banks/[id], cached for the page session. A failed request is not cached. */
export function loadBank(bankId: string): Promise<BankDetail> {
  let request = bankRequests.get(bankId);
  if (!request) {
    request = fetch(`/api/banks/${encodeURIComponent(bankId)}`).then((response) => {
      if (!response.ok) throw new Error(`Bank request failed: ${response.status}`);
      return response.json() as Promise<BankDetail>;
    });
    request.catch(() => bankRequests.delete(bankId));
    bankRequests.set(bankId, request);
  }
  return request;
}

export function useBank(bankId: string): { detail: BankDetail | null; failed: boolean } {
  const [state, setState] = useState<{ id: string; detail: BankDetail | null; failed: boolean }>({
    id: bankId,
    detail: null,
    failed: false,
  });
  useEffect(() => {
    let active = true;
    loadBank(bankId).then(
      (detail) => active && setState({ id: bankId, detail, failed: false }),
      () => active && setState({ id: bankId, detail: null, failed: true }),
    );
    return () => {
      active = false;
    };
  }, [bankId]);
  // Ignore a result that belongs to the previous bankId.
  return state.id === bankId ? state : { detail: null, failed: false };
}

/**
 * What the feed shows for this bank (same rules as getFeed in lib/store.ts):
 * hidden cards are dropped, and so are quizzes whose topic has no visible card.
 */
export function feedContent(detail: BankDetail): { cards: Card[]; quizzes: Quiz[] } {
  const cards = detail.cards
    .filter((card) => card.verified && card.flags < FLAG_HIDE_THRESHOLD)
    .sort((a, b) => a.order - b.order);
  const topics = new Set(cards.map((card) => card.topic));
  return { cards, quizzes: detail.quizzes.filter((quiz) => topics.has(quiz.topic)) };
}

export type Tally = {
  cardsSeen: number;
  cardsTotal: number;
  quizzesAnswered: number;
  quizzesCorrect: number;
  quizzesTotal: number;
  /** Cards seen + quizzes answered. */
  done: number;
  total: number;
  complete: boolean;
};

export function tally(cards: Card[], quizzes: Quiz[], progress: LocalProgress): Tally {
  const seen = new Set(progress.seen);
  const cardsSeen = cards.filter((card) => seen.has(card.id)).length;
  const answered = quizzes.filter((quiz) => quiz.id in progress.quiz);
  const done = cardsSeen + answered.length;
  const total = cards.length + quizzes.length;
  return {
    cardsSeen,
    cardsTotal: cards.length,
    quizzesAnswered: answered.length,
    quizzesCorrect: answered.filter((quiz) => progress.quiz[quiz.id]).length,
    quizzesTotal: quizzes.length,
    done,
    total,
    complete: total > 0 && done === total,
  };
}

/** One tally per topic, in feed order. Expects feedContent() output (cards sorted). */
export function tallyByTopic(cards: Card[], quizzes: Quiz[], progress: LocalProgress) {
  return [...new Set(cards.map((card) => card.topic))].map((topic) => ({
    topic,
    ...tally(
      cards.filter((card) => card.topic === topic),
      quizzes.filter((quiz) => quiz.topic === topic),
      progress,
    ),
  }));
}

export function percentDone(t: Pick<Tally, "done" | "total">): number {
  return t.total === 0 ? 0 : Math.round((t.done / t.total) * 100);
}

/** Live progress for one bank; null while the bank is loading or if it failed. */
export function useBankTally(bankId: string): Tally | null {
  const progress = useProgress();
  const { detail } = useBank(bankId);
  if (!detail) return null;
  const { cards, quizzes } = feedContent(detail);
  return tally(cards, quizzes, progress);
}
