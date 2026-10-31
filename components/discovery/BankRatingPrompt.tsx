"use client";

import { ThumbButton } from "@/components/discovery/RatingButtons";
import { useRating } from "@/components/discovery/useTrust";
import type { BankSummary } from "@/lib/schemas";

/**
 * "Was this bank accurate?" for the end of a bank (B2's CompletionScreen),
 * where the learner has seen every card and the answer means the most.
 */
export function BankRatingPrompt({ bank }: { bank: BankSummary }) {
  const { mine, score, error, rate } = useRating(bank.id, bank.accuracyScore);

  return (
    <section className="grid justify-items-center gap-3 text-center">
      <h3 className="text-base font-semibold">
        {mine === null ? "Was this bank accurate?" : "Thanks for rating!"}
      </h3>
      <div className="flex gap-2">
        <ThumbButton up selected={mine === 1} onClick={() => rate(1)} />
        <ThumbButton up={false} selected={mine === -1} onClick={() => rate(-1)} />
      </div>
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          Couldn&apos;t save your rating. Try again.
        </p>
      ) : (
        score !== null && (
          <p className="text-sm text-muted-foreground">{Math.round(score)}% of learners say yes</p>
        )
      )}
    </section>
  );
}
