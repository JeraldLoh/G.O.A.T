// Lane C's own browser state, plus the change signal for interests/filters.
// kb:interests and kb:filters themselves are read/written through lib/local.ts.
import { useCallback, useMemo, useSyncExternalStore } from "react";
import { z } from "zod";

/** Fired on window after kb:interests or kb:filters change, so the feed can refetch. */
export const FILTERS_EVENT = "kb:filters";
const FLAGGED_EVENT = "kb:flagged";
const RATINGS_EVENT = "kb:ratings";

export function notifyFiltersChanged(): void {
  window.dispatchEvent(new Event(FILTERS_EVENT));
}

const SERVER = "\u0000server";

/**
 * Reads browser state with useSyncExternalStore, re-reading when any of the
 * window events (or another tab's storage write) fire. undefined during server
 * render and hydration, so nothing flashes or mismatches.
 */
export function useBrowserValue<T>(read: () => T, events: string[]): T | undefined {
  const key = events.join("|");
  const subscribe = useCallback(
    (onChange: () => void) => {
      const names = [...key.split("|"), "storage"];
      names.forEach((name) => window.addEventListener(name, onChange));
      return () => names.forEach((name) => window.removeEventListener(name, onChange));
    },
    [key],
  );
  // A JSON string snapshot compares by value, so fresh arrays don't loop.
  const raw = useSyncExternalStore(subscribe, () => JSON.stringify(read()) ?? "null", () => SERVER);
  return useMemo(() => (raw === SERVER ? undefined : (JSON.parse(raw) as T)), [raw]);
}

const FlaggedSchema = z.array(z.string());
const RatingsSchema = z.record(z.string(), z.union([z.literal(1), z.literal(-1)]));

function read<T>(key: string, schema: z.ZodType<T>, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const parsed = schema.safeParse(JSON.parse(localStorage.getItem(key) ?? "null"));
    return parsed.success ? parsed.data : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown, event: string): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage can be blocked (private mode); the server still dedupes per device.
  }
  window.dispatchEvent(new Event(event));
}

/** Card ids this device has reported. */
export function getFlagged(): string[] {
  return read("kb:flagged", FlaggedSchema, []);
}

export function addFlagged(cardId: string): void {
  const flagged = getFlagged();
  if (!flagged.includes(cardId)) write("kb:flagged", [...flagged, cardId], FLAGGED_EVENT);
}

export function useFlagged(cardId: string): boolean {
  return useBrowserValue(getFlagged, [FLAGGED_EVENT])?.includes(cardId) ?? false;
}

/** This device's vote per bank id. */
export function getMyRating(bankId: string): 1 | -1 | null {
  return read("kb:ratings", RatingsSchema, {})[bankId] ?? null;
}

export function setMyRating(bankId: string, value: 1 | -1): void {
  write("kb:ratings", { ...read("kb:ratings", RatingsSchema, {}), [bankId]: value }, RATINGS_EVENT);
}

export function useMyRating(bankId: string): 1 | -1 | null {
  return useBrowserValue(() => getMyRating(bankId), [RATINGS_EVENT]) ?? null;
}
