"use client";

import { ArrowUp } from "lucide-react";
import Link from "next/link";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { FilterBar } from "@/components/discovery/FilterBar";
import { InterestGate } from "@/components/discovery/InterestGate";
import { useFeedQuery } from "@/components/discovery/useFeedQuery";
import { BankPreview } from "@/components/explore/BankPreview";
import { groupBanks } from "@/components/explore/content";
import { FeedCard } from "@/components/feed/FeedCard";
import { FeedStates } from "@/components/feed/FeedStates";
import { VideosTab } from "@/components/video/VideosTab";
import type { BankSummary, Card, FeedEntry } from "@/lib/schemas";
import { shuffle } from "@/lib/shuffle";
import { cn } from "@/lib/utils";

type Tab = "banks" | "facts" | "video";
type FactItem = { card: Card; bank: BankSummary };

export default function ExplorePage() {
  const query = useFeedQuery();
  const [tab, setTab] = useState<Tab>("banks");
  const [attempt, setAttempt] = useState(0);
  const request = query === null ? null : `${query}#${attempt}`;
  const [result, setResult] = useState<{
    request: string;
    entries: FeedEntry[] | null;
    seed: number;
  } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const scrollKey = `kb:explore-scroll:${query ?? ""}`;

  useEffect(() => {
    if (query === null || request === null) return;
    let active = true;
    fetch(`/api/feed${query ? `?${query}` : ""}`)
      .then((response) => {
        if (!response.ok) throw new Error(`Feed request failed: ${response.status}`);
        return response.json() as Promise<FeedEntry[]>;
      })
      .then((data) => active && setResult({ request, entries: data, seed: Date.now() }))
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
  const banks = entries ? groupBanks(entries) : [];
  const facts = useMemo<FactItem[]>(
    () => (entries ?? []).flatMap((entry) => (entry.kind === "card" ? [{ card: entry.card, bank: entry.bank }] : [])),
    [entries],
  );

  useLayoutEffect(() => {
    if (!entries || !scrollRef.current) return;
    try {
      scrollRef.current.scrollTop = Number(sessionStorage.getItem(scrollKey)) || 0;
    } catch {
      // Explore still works when browser storage is unavailable.
    }
  }, [entries, scrollKey]);

  return (
    <InterestGate>
      <div className="flex h-full flex-col">
        <header className="grid shrink-0 grid-cols-[2.75rem_1fr_2.75rem] items-center px-2">
          <span aria-hidden />
          <div role="tablist" aria-label="Explore" className="flex justify-center gap-4">
            <TabButton id="banks" active={tab === "banks"} onSelect={setTab}>
              Banks
            </TabButton>
            <TabButton id="facts" active={tab === "facts"} onSelect={setTab}>
              Fun facts
            </TabButton>
            <TabButton id="video" active={tab === "video"} onSelect={setTab}>
              Video
            </TabButton>
          </div>
          <FilterBar variant="icon" />
        </header>

        <div role="tabpanel" id="panel-banks" aria-labelledby="tab-banks" hidden={tab !== "banks"} className="min-h-0 flex-1">
          <div
            ref={scrollRef}
            aria-label="Explore learning banks"
            tabIndex={0}
            onScroll={(event) => {
              try {
                sessionStorage.setItem(scrollKey, String(event.currentTarget.scrollTop));
              } catch {
                /* Optional convenience. */
              }
            }}
            className="h-full snap-y snap-mandatory overflow-y-auto overscroll-contain focus-visible:outline-2 focus-visible:outline-ring"
          >
            {failed ? (
              <Message title="Could not load Explore" body="Check your connection and try again.">
                <button type="button" onClick={retry} className="rounded-xl bg-primary px-5 py-3 font-semibold text-primary-foreground">
                  Retry
                </button>
              </Message>
            ) : loading ? (
              <Message title="Finding your next discovery…" />
            ) : banks.length === 0 ? (
              <Message title="A little room for curiosity" body="No learning banks match these filters. Try another topic or share something worth learning.">
                <Link href="/upload" className="rounded-xl bg-primary px-5 py-3 font-semibold text-primary-foreground">
                  Upload a bank
                </Link>
              </Message>
            ) : (
              <>
                {banks.map((group, index) => (
                  <section key={group.bank.id} className="h-full snap-start snap-always overflow-y-auto" aria-label={group.bank.title}>
                    <BankPreview group={group} index={index} total={banks.length} />
                  </section>
                ))}
                <Message title="A little wiser already?" body="Your next discovery could be something you share.">
                  <Link href="/upload" className="rounded-xl bg-primary px-5 py-3 font-semibold text-primary-foreground">
                    Share a learning bank
                  </Link>
                  <button type="button" onClick={() => scrollRef.current?.scrollTo({ top: 0 })} className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-olive-deep">
                    <ArrowUp className="size-4" aria-hidden />
                    Back to top
                  </button>
                </Message>
              </>
            )}
          </div>
        </div>

        <div role="tabpanel" id="panel-facts" aria-labelledby="tab-facts" hidden={tab !== "facts"} className="min-h-0 flex-1">
          <FactsFeed key={seed} items={facts} seed={seed} loading={loading} failed={failed} onRetry={retry} />
        </div>
        <div role="tabpanel" id="panel-video" aria-labelledby="tab-video" hidden={tab !== "video"} className="min-h-0 flex-1">
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
        "relative flex h-12 items-center text-sm transition-colors sm:text-base",
        active ? "font-semibold text-foreground" : "font-medium text-muted-foreground",
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

function Message({ title, body, children }: { title: string; body?: string; children?: React.ReactNode }) {
  return (
    <section className="flex h-full snap-start flex-col items-center justify-center gap-4 p-6 text-center" role="status">
      <h2 className="text-xl font-semibold">{title}</h2>
      {body && <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">{body}</p>}
      {children}
    </section>
  );
}

const PRELOAD_FROM_END = 3;

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
      if (order.length > 1 && order[0].card.id === previous) order = [...order.slice(1), order[0]];
      order.forEach((item) => out.push({ key: `${round}-${item.card.id}`, item }));
    }
    return out;
  }, [items, seed, rounds]);

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
    <div ref={scroller} className="h-full snap-y snap-mandatory overflow-y-scroll overscroll-contain">
      <FeedStates loading={loading} failed={failed} empty={items.length === 0} onRetry={onRetry} emptyTitle="No facts here yet" />
      {slots.map(({ key, item }, index) => (
        <section key={key} className="h-full snap-start snap-always">
          <FeedCard card={item.card} bank={item.bank} showProgress={false} />
          {index === slots.length - PRELOAD_FROM_END && <div ref={sentinel} aria-hidden />}
        </section>
      ))}
      {slots.length > 0 && slots.length < PRELOAD_FROM_END && <div ref={sentinel} aria-hidden className="h-px" />}
    </div>
  );
}
