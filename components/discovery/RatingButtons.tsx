"use client";

import { ThumbsDown, ThumbsUp } from "lucide-react";
import { useState } from "react";
import { setMyRating, useMyRating } from "@/components/discovery/storage";
import { Button } from "@/components/ui/button";
import { getDeviceId } from "@/lib/local";
import { cn } from "@/lib/utils";

/**
 * Thumbs up/down on a bank's accuracy. The same bank appears on many cards,
 * so every instance re-reads the vote when any of them changes it.
 */
export function RatingButtons({
  bankId,
  accuracyScore = null,
}: {
  bankId: string;
  /** BankSummary.accuracyScore, shown until this device votes. */
  accuracyScore?: number | null;
}) {
  const saved = useMyRating(bankId);
  const [pending, setPending] = useState<1 | -1 | null>(null); // optimistic, until saved
  const mine = pending ?? saved;
  const [score, setScore] = useState(accuracyScore);
  const [error, setError] = useState(false);

  async function rate(value: 1 | -1) {
    if (value === mine) return;
    setPending(value);
    setError(false);
    try {
      const response = await fetch("/api/rate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bankId, deviceId: getDeviceId(), value }),
      });
      if (!response.ok) throw new Error(`Rate failed: ${response.status}`);
      const result = (await response.json()) as { accuracyScore: number | null };
      setScore(result.accuracyScore);
      setMyRating(bankId, value);
    } catch {
      setError(true);
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="flex items-center gap-1 text-xs text-muted-foreground">
      <span className="mr-1">Accurate?</span>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="Yes, accurate"
        aria-pressed={mine === 1}
        onClick={() => rate(1)}
        className={cn(mine === 1 && "bg-accent text-accent-foreground")}
      >
        <ThumbsUp aria-hidden />
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="No, not accurate"
        aria-pressed={mine === -1}
        onClick={() => rate(-1)}
        className={cn(mine === -1 && "bg-accent text-accent-foreground")}
      >
        <ThumbsDown aria-hidden />
      </Button>
      {error ? (
        <span role="alert" className="text-destructive">
          Couldn&apos;t save
        </span>
      ) : (
        score !== null && <span>{Math.round(score)}% say accurate</span>
      )}
    </div>
  );
}
