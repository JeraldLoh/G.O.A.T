"use client";

import { useState } from "react";
import { addFlagged, setMyRating, useFlagged, useMyRating } from "@/components/discovery/storage";
import { getDeviceId } from "@/lib/local";

export const REPORT_REASONS = [
  "Incorrect or misleading",
  "Quote doesn't match the source",
  "Unclear or low quality",
  "Inappropriate content",
];

/** Report a card via /api/flag. One report per device; the server dedupes too. */
export function useReport(cardId: string, onFlagged?: (flags: number) => void) {
  const reported = useFlagged(cardId);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function report(reason: string): Promise<boolean> {
    setSending(true);
    setError(null);
    try {
      const response = await fetch("/api/flag", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cardId, deviceId: getDeviceId(), reason }),
      });
      if (!response.ok) throw new Error(`Flag failed: ${response.status}`);
      const { flags } = (await response.json()) as { flags: number };
      addFlagged(cardId);
      onFlagged?.(flags);
      return true;
    } catch {
      setError("Couldn't send the report. Try again.");
      return false;
    } finally {
      setSending(false);
    }
  }

  return { reported, sending, error, report };
}

/**
 * Thumbs up/down on a bank via /api/rate. The vote is stored per device, so
 * every place showing the same bank stays in sync.
 */
export function useRating(bankId: string, initialScore: number | null = null) {
  const saved = useMyRating(bankId);
  const [pending, setPending] = useState<1 | -1 | null>(null); // optimistic, until saved
  const [score, setScore] = useState(initialScore);
  const [error, setError] = useState(false);
  const mine = pending ?? saved;

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

  return { mine, score, error, rate };
}
