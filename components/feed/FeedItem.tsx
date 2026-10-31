import { FeedCard } from "@/components/feed/FeedCard";
import { QuizCard } from "@/components/feed/QuizCard";
import type { FeedEntry } from "@/lib/schemas";

// Lane B1. Dispatcher only: cards are B1's FeedCard, quizzes are B2's QuizCard.
export function FeedItem({ entry }: { entry: FeedEntry }) {
  return entry.kind === "card" ? (
    <FeedCard card={entry.card} bank={entry.bank} />
  ) : (
    <QuizCard quiz={entry.quiz} bank={entry.bank} />
  );
}
