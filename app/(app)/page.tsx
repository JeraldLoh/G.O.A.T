"use client";

import { useEffect, useState } from "react";
import { FilterBar } from "@/components/discovery/FilterBar";
import { InterestGate } from "@/components/discovery/InterestGate";
import { FeedItem } from "@/components/feed/FeedItem";
import type { FeedEntry } from "@/lib/schemas";

export default function FeedPage() {
  const [entries, setEntries] = useState<FeedEntry[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    fetch("/api/feed")
      .then((response) => {
        if (!response.ok) throw new Error(`Feed request failed: ${response.status}`);
        return response.json();
      })
      .then(setEntries)
      .catch(() => setFailed(true));
  }, []);

  return (
    <InterestGate>
      <div className="flex h-full flex-col">
        <FilterBar />
        <div className="min-h-0 flex-1 snap-y snap-mandatory overflow-y-scroll">
          {failed && <p className="p-6 text-center">Could not load the feed.</p>}
          {!failed && entries === null && <p className="p-6 text-center">Loading…</p>}
          {entries?.map((entry) => (
            <FeedItem
              key={entry.kind === "card" ? entry.card.id : entry.quiz.id}
              entry={entry}
            />
          ))}
        </div>
      </div>
    </InterestGate>
  );
}
