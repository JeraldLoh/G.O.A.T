"use client";

import { ArrowUp, Sparkles } from "lucide-react";
import Link from "next/link";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { FilterBar } from "@/components/discovery/FilterBar";
import { InterestGate } from "@/components/discovery/InterestGate";
import { useFeedQuery } from "@/components/discovery/useFeedQuery";
import { BankPreview } from "@/components/explore/BankPreview";
import { groupBanks } from "@/components/explore/content";
import type { FeedEntry } from "@/lib/schemas";

export default function ExplorePage() {
  const query = useFeedQuery();
  const [attempt, setAttempt] = useState(0);
  const request = query === null ? null : `${query}#${attempt}`;
  const [result, setResult] = useState<{ request: string; entries: FeedEntry[] | null } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const current = result?.request === request ? result : null;
  const entries = current?.entries;
  const failed = current !== null && entries === null;
  const banks = entries ? groupBanks(entries) : [];
  const scrollKey = `kb:explore-scroll:${query ?? ""}`;

  useEffect(() => {
    if (query === null || request === null) return;
    const controller = new AbortController();
    fetch(`/api/feed${query ? `?${query}` : ""}`, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error(`Feed request failed: ${response.status}`);
        return response.json() as Promise<FeedEntry[]>;
      })
      .then((data) => setResult({ request, entries: data }))
      .catch(() => {
        if (!controller.signal.aborted) setResult({ request, entries: null });
      });
    return () => controller.abort();
  }, [query, request]);

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
        <header className="flex items-center justify-between px-5 pt-4 pb-3">
          <div>
            <p className="text-[10px] font-bold tracking-[0.22em] text-olive-deep uppercase">G.O.A.T / Open learning</p>
            <h1 className="mt-0.5 text-2xl font-semibold tracking-tight">Explore</h1>
          </div>
          <span className="flex size-10 items-center justify-center rounded-full bg-sunflower"><Sparkles className="size-5" aria-hidden /></span>
        </header>
        <FilterBar />
        <div ref={scrollRef} aria-label="Explore learning banks" tabIndex={0}
          onScroll={(event) => {
            try { sessionStorage.setItem(scrollKey, String(event.currentTarget.scrollTop)); } catch { /* Optional convenience. */ }
          }}
          className="min-h-0 flex-1 snap-y snap-mandatory overflow-y-auto overscroll-contain focus-visible:outline-2 focus-visible:outline-ring">
          {failed ? (
            <Message title="Could not load Explore" body="Check your connection and try again.">
              <button type="button" onClick={() => setAttempt((n) => n + 1)} className="rounded-xl bg-primary px-5 py-3 font-semibold text-primary-foreground">Retry</button>
            </Message>
          ) : !entries ? (
            <Message title="Finding your next discovery…" />
          ) : banks.length === 0 ? (
            <Message title="A little room for curiosity" body="No learning banks match these filters. Try another topic or share something worth learning.">
              <Link href="/upload" className="rounded-xl bg-primary px-5 py-3 font-semibold text-primary-foreground">Upload a bank</Link>
            </Message>
          ) : (
            <>
              {banks.map((group, index) => (
                <section key={group.bank.id} className="h-full snap-start snap-always overflow-y-auto" aria-label={group.bank.title}>
                  <BankPreview group={group} index={index} total={banks.length} />
                </section>
              ))}
              <Message title="A little wiser already?" body="Your next discovery could be something you share.">
                <Link href="/upload" className="rounded-xl bg-primary px-5 py-3 font-semibold text-primary-foreground">Share a learning bank</Link>
                <button type="button" onClick={() => scrollRef.current?.scrollTo({ top: 0 })} className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-olive-deep"><ArrowUp className="size-4" aria-hidden />Back to top</button>
              </Message>
            </>
          )}
        </div>
      </div>
    </InterestGate>
  );
}

function Message({ title, body, children }: { title: string; body?: string; children?: React.ReactNode }) {
  return <section className="flex h-full snap-start flex-col items-center justify-center gap-4 p-6 text-center" role="status">
    <h2 className="text-xl font-semibold">{title}</h2>
    {body && <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">{body}</p>}
    {children}
  </section>;
}
