"use client";

import { ThumbsDown, ThumbsUp } from "lucide-react";
import { useRating } from "@/components/discovery/useTrust";
import { cn } from "@/lib/utils";

/**
 * Thumbs up/down on a bank's accuracy. Prefer CardActions on feed cards and
 * BankRatingPrompt on the completion screen; this inline version stays for
 * places that want the buttons visible.
 */
export function RatingButtons({
  bankId,
  accuracyScore = null,
  className,
}: {
  bankId: string;
  /** BankSummary.accuracyScore, shown until this device votes. */
  accuracyScore?: number | null;
  className?: string;
}) {
  const { mine, score, error, rate } = useRating(bankId, accuracyScore);

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <ThumbButton up selected={mine === 1} onClick={() => rate(1)} />
      <ThumbButton up={false} selected={mine === -1} onClick={() => rate(-1)} />
      {error ? (
        <span role="alert" className="text-sm text-destructive">
          Couldn&apos;t save
        </span>
      ) : (
        score !== null && (
          <span className="text-sm text-muted-foreground">{Math.round(score)}% say accurate</span>
        )
      )}
    </div>
  );
}

export function ThumbButton({
  up,
  selected,
  onClick,
}: {
  up: boolean;
  selected: boolean;
  onClick: () => void;
}) {
  const Icon = up ? ThumbsUp : ThumbsDown;
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={cn(
        "inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-sm font-medium transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
        selected ? "border-olive-deep bg-olive-deep text-paper" : "border-border bg-background hover:bg-muted",
      )}
    >
      <Icon aria-hidden className={cn("size-4", selected && "fill-current")} />
      {up ? "Yes" : "No"}
    </button>
  );
}
