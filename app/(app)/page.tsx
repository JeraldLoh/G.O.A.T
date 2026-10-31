"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { FilterBar } from "@/components/discovery/FilterBar";
import { InterestGate } from "@/components/discovery/InterestGate";
import { FeedCard } from "@/components/feed/FeedCard";
import { FeedStates } from "@/components/feed/FeedStates";
import { VideosTab } from "@/components/video/VideosTab";
import { getFilters, getInterests, onLocalChange } from "@/lib/local";
import type { BankSummary, Card, FeedEntry } from "@/lib/schemas";
import { shuffle } from "@/lib/shuffle";
import { cn } from "@/lib/utils";

type Tab = "video" | "facts";
type FactItem = { card: Card; bank: BankSummary };

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

// The home feed, TikTok-style: "Fun facts" is the endless For-You feed of cards
// from every bank (uploads and seeds) in random order; "Video" is the narrated
// video chapters made from uploaded banks, each with its quiz (components/video/VideosTab.tsx).
export default function FeedPage() {
  // Re-queries when InterestGate or FilterBar write new choices. null during server render.
  const query = useSyncExternalStore(subscribeToChoices, feedQuery, () => null);
  const [tab, setTab] = useState<Tab>("facts");
  const [attempt, setAttempt] = useState(0);
  const request = query === null ? null : `${query}#${attempt}`;
  const [result, setResult] = useState<{
    request: string;
    entries: FeedEntry[] | null;
    seed: number;
  } | null>(null);

  useEffect(() => {
    if (query === null || request === null) return;
    let active = true;
    fetch(`/api/feed${query ? `?${query}` : ""}`)
      .then((response) => {
        if (!response.ok)
          throw new Error(`Feed request failed: ${response.status}`);
        return response.json();
      })
      // A fresh seed per load: every visit (and every filter change) gets a new order.
      .then(
        (data: FeedEntry[]) =>
          active && setResult({ request, entries: data, seed: Date.now() }),
      )
      .catch(() => active && setResult({ request, entries: null, seed: 0 }));
    return () => {
      active = false;
    };
  }, [query, request]);

  const current = result?.request === request ? result : null;
  const entries = current?.entries ?? null;
  const failed = current !== null && current.entries === null;
  const loading = !failed && entries === null;
  const seed = current?.seed ?? 0;
  const retry = () => setAttempt((n) => n + 1);

  const facts = useMemo<FactItem[]>(
    () =>
      (entries ?? []).flatMap((e) =>
        e.kind === "card" ? [{ card: e.card, bank: e.bank }] : [],
      ),
    [entries],
  );

  return (
    <InterestGate>
      <div className="flex h-full flex-col">
        <header className="grid shrink-0 grid-cols-[2.75rem_1fr_2.75rem] items-center px-2">
          <span aria-hidden />
          <div
            role="tablist"
            aria-label="Feed"
            className="flex justify-center gap-6"
          >
            <TabButton id="facts" active={tab === "facts"} onSelect={setTab}>
              Fun facts
            </TabButton>
            <TabButton id="video" active={tab === "video"} onSelect={setTab}>
              Video
            </TabButton>
          </div>
          <FilterBar variant="icon" />
        </header>

        {/* Both tabs stay mounted so each keeps its scroll position. Keyed by
            the load, so new data or filters start again from the top. */}
        <div
          role="tabpanel"
          id="panel-facts"
          aria-labelledby="tab-facts"
          hidden={tab !== "facts"}
          className="min-h-0 flex-1"
        >
          <FactsFeed
            key={seed}
            items={facts}
            seed={seed}
            loading={loading}
            failed={failed}
            onRetry={retry}
          />
        </div>
        <div
          role="tabpanel"
          id="panel-video"
          aria-labelledby="tab-video"
          hidden={tab !== "video"}
          className="min-h-0 flex-1"
        >
          {/* Mounted only while selected: the player narrates out loud, and
              unmounting stops it. Keyed by the load so new filters refetch. */}
          {tab === "video" && <VideosTab key={seed} />}
        </div>
      </div>
    </InterestGate>
  );
}

function TabButton({
  id,
  active,
  onSelect,
  children,
}: {
  id: Tab;
  active: boolean;
  onSelect: (tab: Tab) => void;
  children: string;
}) {
  return (
    <button
      type="button"
      role="tab"
      id={`tab-${id}`}
      aria-selected={active}
      aria-controls={`panel-${id}`}
      onClick={() => onSelect(id)}
      className={cn(
        "relative flex h-12 items-center text-base transition-colors",
        active
          ? "font-semibold text-foreground"
          : "font-medium text-muted-foreground",
      )}
    >
      {children}
      <span
        aria-hidden
        className={cn(
          "absolute inset-x-1/4 bottom-1.5 h-0.5 rounded-full bg-foreground transition-opacity",
          active ? "opacity-100" : "opacity-0",
        )}
      />
    </button>
  );
}

/** How many cards before the end to start adding the next shuffled round. */
const PRELOAD_FROM_END = 3;

/** Endless, shuffled cards. Each round is a new shuffle; a round never starts with the card that ended the last. */
function FactsFeed({
  items,
  seed,
  loading,
  failed,
  onRetry,
}: {
  items: FactItem[];
  seed: number;
  loading: boolean;
  failed: boolean;
  onRetry: () => void;
}) {
  const [rounds, setRounds] = useState(1);
  const scroller = useRef<HTMLDivElement>(null);
  const sentinel = useRef<HTMLDivElement>(null);

  const slots = useMemo(() => {
    const out: { key: string; item: FactItem }[] = [];
    for (let round = 0; round < rounds; round++) {
      let order = shuffle(items, seed + round);
      const previous = out.at(-1)?.item.card.id;
      if (order.length > 1 && order[0].card.id === previous)
        order = [...order.slice(1), order[0]];
      order.forEach((item) =>
        out.push({ key: `${round}-${item.card.id}`, item }),
      );
    }
    return out;
  }, [items, seed, rounds]);

  // Near the end, add another shuffled round so the feed never runs out.
  useEffect(() => {
    const target = sentinel.current;
    if (!target || items.length === 0) return;
    const observer = new IntersectionObserver(
      ([entry]) => entry.isIntersecting && setRounds((n) => n + 1),
      { root: scroller.current, rootMargin: "100% 0px" },
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [items.length, rounds]);

  return (
    <div
      ref={scroller}
      className="h-full snap-y snap-mandatory overflow-y-scroll overscroll-contain"
    >
      <FeedStates
        loading={loading}
        failed={failed}
        empty={items.length === 0}
        onRetry={onRetry}
        emptyTitle="No facts here yet"
      />
      {slots.map(({ key, item }, index) => (
        <section key={key} className="h-full snap-start snap-always">
          <FeedCard card={item.card} bank={item.bank} showProgress={false} />
          {index === slots.length - PRELOAD_FROM_END && (
            <div ref={sentinel} aria-hidden />
          )}
        </section>
      ))}
      {/* Short feeds (fewer cards than the preload distance) still need a trigger. */}
      {slots.length > 0 && slots.length < PRELOAD_FROM_END && (
        <div ref={sentinel} aria-hidden className="h-px" />
      )}
    </div>
  );
}
