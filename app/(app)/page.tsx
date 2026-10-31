"use client";

import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";
import { FilterBar } from "@/components/discovery/FilterBar";
import { InterestGate } from "@/components/discovery/InterestGate";
import { RatingButtons } from "@/components/discovery/RatingButtons";
import { CompletionScreen } from "@/components/feed/CompletionScreen";
import { FeedItem } from "@/components/feed/FeedItem";
import { getFilters, getInterests, onLocalChange } from "@/lib/local";
import type { BankSummary, FeedEntry } from "@/lib/schemas";

type Slot =
  | { key: string; kind: "entry"; entry: FeedEntry }
  | { key: string; kind: "complete"; bank: BankSummary };

/** Builds /api/feed?subjects=…&tags=…&level=… from kb:interests and kb:filters. */
function feedQuery(): string {
  const params = new URLSearchParams();
  const interests = getInterests();
  const { tags, level } = getFilters();
  if (interests?.length) params.set("subjects", interests.join(","));
  if (tags.length) params.set("tags", tags.join(","));
  if (level) params.set("level", level);
  return params.toString();
}

function subscribeToChoices(onChange: () => void): () => void {
  const offInterests = onLocalChange("kb:interests", onChange);
  const offFilters = onLocalChange("kb:filters", onChange);
  return () => {
    offInterests();
    offFilters();
  };
}

/** Feed entries plus one completion slot after each bank's last entry. */
function toSlots(entries: FeedEntry[]): Slot[] {
  const slots: Slot[] = [];
  entries.forEach((entry, index) => {
    const id = entry.kind === "card" ? entry.card.id : entry.quiz.id;
    slots.push({ key: `${entry.kind}-${id}`, kind: "entry", entry });
    if (entries[index + 1]?.bank.id !== entry.bank.id) {
      slots.push({ key: `complete-${entry.bank.id}`, kind: "complete", bank: entry.bank });
    }
  });
  return slots;
}

// Lane B1. The swipe feed: one full-height snap slot per card, quiz or completion screen.
export default function FeedPage() {
  // Re-queries when InterestGate or FilterBar (Lane C) write new choices. null during server render.
  const query = useSyncExternalStore(subscribeToChoices, feedQuery, () => null);
  const [attempt, setAttempt] = useState(0);
  // The result is tagged with the request it answers, so a new query shows "Loading" again.
  const request = query === null ? null : `${query}#${attempt}`;
  const [result, setResult] = useState<{ request: string; entries: FeedEntry[] | null } | null>(null);

  useEffect(() => {
    if (query === null || request === null) return;
    let active = true;
    fetch(`/api/feed${query ? `?${query}` : ""}`)
      .then((response) => {
        if (!response.ok) throw new Error(`Feed request failed: ${response.status}`);
        return response.json();
      })
      .then((data: FeedEntry[]) => active && setResult({ request, entries: data }))
      .catch(() => active && setResult({ request, entries: null }));
    return () => {
      active = false;
    };
  }, [query, request]);

  const current = result?.request === request ? result : null;
  const entries = current?.entries ?? null;
  const failed = current !== null && current.entries === null;
  const slots = entries ? toSlots(entries) : [];

  return (
    <InterestGate>
      <div className="flex h-full flex-col">
        <FilterBar />
        <div className="min-h-0 flex-1 snap-y snap-mandatory overflow-y-scroll overscroll-contain">
          {failed && (
            <Message title="Could not load the feed" body="Check your connection and try again.">
              <button
                type="button"
                onClick={() => setAttempt((n) => n + 1)}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
              >
                Retry
              </button>
            </Message>
          )}
          {!failed && entries === null && <Message title="Loading your feed…" />}
          {!failed && entries?.length === 0 && (
            <Message title="Nothing here yet" body="No banks match your interests and filters. Change them, or add the first bank.">
              <Link href="/upload" className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
                Upload a bank
              </Link>
            </Message>
          )}
          {!failed &&
            slots.map((slot) => (
              <section key={slot.key} className="h-full snap-start snap-always">
                {slot.kind === "entry" ? (
                  <FeedItem entry={slot.entry} />
                ) : (
                  <div className="flex h-full flex-col">
                    <div className="min-h-0 flex-1">
                      <CompletionScreen bank={slot.bank} />
                    </div>
                    <div className="flex justify-center pb-4">
                      <RatingButtons bankId={slot.bank.id} />
                    </div>
                  </div>
                )}
              </section>
            ))}
          {!failed && slots.length > 0 && (
            <Message title="You're all caught up" body="That's every bank for your interests.">
              <div className="flex gap-3">
                <Link href="/progress" className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
                  See progress
                </Link>
                <Link href="/upload" className="rounded-lg border border-khaki px-4 py-2 text-sm font-semibold text-olive-deep">
                  Add a bank
                </Link>
              </div>
            </Message>
          )}
        </div>
      </div>
    </InterestGate>
  );
}

function Message({ title, body, children }: { title: string; body?: string; children?: React.ReactNode }) {
  return (
    <section className="flex h-full snap-start flex-col items-center justify-center gap-3 p-6 text-center">
      <h2 className="text-xl font-semibold">{title}</h2>
      {body && <p className="max-w-xs text-sm text-muted-foreground">{body}</p>}
      {children}
    </section>
  );
}
