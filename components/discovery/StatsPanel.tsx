"use client";

import { ChevronDown, Coins, ExternalLink, ShieldCheck, Timer, type LucideIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { CHECKED_ON, COURSERA, PRICE_ROWS, SOURCES } from "@/components/discovery/comparison";
import { formatPct, formatSeconds, formatUsd } from "@/components/discovery/format";
import type { BankSummary, Stats } from "@/lib/schemas";
import { cn } from "@/lib/utils";

const BARS = [
  { label: "Coursera Plus, paid monthly", usd: COURSERA.plusMonthlyUsd * 12 },
  { label: "Coursera Plus, paid yearly", usd: COURSERA.plusAnnualUsd },
  { label: "Knowledge Bank", usd: 0, ours: true },
];
const MAX_USD = Math.max(...BARS.map((bar) => bar.usd));

/**
 * Rubric evidence. Leads with one picture (what a learner pays per year), then
 * three measured numbers from /api/stats; everything else sits under "Details
 * & sources". Never shows an invented number.
 */
export function StatsPanel() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [banks, setBanks] = useState<BankSummary[]>([]);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/stats").then((response) => (response.ok ? response.json() : Promise.reject())),
      fetch("/api/banks").then((response) => (response.ok ? response.json() : [])),
    ])
      .then(([nextStats, nextBanks]: [Stats, BankSummary[]]) => {
        setStats(nextStats);
        setBanks(nextBanks);
      })
      .catch(() => setFailed(true));
  }, []);

  const measured = stats !== null && stats.generations > 0;

  return (
    <div className="h-full overflow-y-auto">
      <div className="grid gap-7 p-5">
        <header>
          <h1 className="text-2xl font-semibold">What learning costs</h1>
          <p className="mt-1 text-sm text-muted-foreground">Per learner, per year</p>
        </header>

        {/* The one picture: price per learner per year. */}
        <section aria-label="Yearly cost per learner" className="grid gap-4">
          {BARS.map((bar) => (
            <div key={bar.label} className="grid gap-1.5">
              <div className="flex items-baseline justify-between gap-2">
                <span className={cn("text-sm", bar.ours && "font-semibold")}>{bar.label}</span>
                <span
                  className={cn(
                    "text-xl font-semibold tabular-nums",
                    bar.ours && "rounded-full bg-sunflower px-2.5 text-ink",
                  )}
                >
                  ${bar.usd}
                </span>
              </div>
              <div className="h-3 rounded-full bg-muted">
                <div
                  className={cn("h-full rounded-full", bar.ours ? "bg-sunflower" : "bg-terracotta")}
                  // A sliver for $0 so the bar still reads as a bar.
                  style={{ width: `${Math.max((bar.usd / MAX_USD) * 100, 2)}%` }}
                />
              </div>
            </div>
          ))}
          <p className="rounded-2xl bg-cream p-4 text-center text-base">
            Each learner saves <strong>${COURSERA.plusAnnualUsd}–${COURSERA.plusMonthlyUsd * 12}</strong> a
            year.
          </p>
          <p className="text-center text-sm text-muted-foreground">
            Coursera has {COURSERA.registeredLearners} registered learners and{" "}
            {COURSERA.paidSubscribers} paying subscribers.
          </p>
        </section>

        {/* Three measured numbers. */}
        <section className="grid gap-3">
          <h2 className="text-lg font-semibold">What it costs us</h2>
          {failed && <p className="text-sm text-destructive">Couldn&apos;t load stats.</p>}
          {!failed && !stats && (
            <div className="grid grid-cols-3 gap-2" aria-hidden>
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-24 animate-pulse rounded-2xl bg-muted" />
              ))}
            </div>
          )}
          {stats && !measured && (
            <p className="rounded-2xl border border-dashed p-4 text-sm text-muted-foreground">
              Numbers appear here after the first real generation.
            </p>
          )}
          {stats && measured && (
            <div className="grid grid-cols-3 gap-2">
              <KeyStat icon={Coins} label="cost per bank" value={formatUsd(stats.avgCostUsd ?? 0)} />
              <KeyStat
                icon={ShieldCheck}
                label="quotes verified"
                value={stats.verifiedPct === null ? "—" : formatPct(stats.verifiedPct)}
              />
              <KeyStat
                icon={Timer}
                label="time per bank"
                value={stats.avgDurationMs === null ? "—" : formatSeconds(stats.avgDurationMs)}
              />
            </div>
          )}
          {stats && measured && (
            <p className="text-sm text-muted-foreground">Paid once per bank, then free for every learner.</p>
          )}
        </section>

        <details className="group rounded-2xl border">
          <summary className="flex min-h-14 cursor-pointer list-none items-center gap-3 px-4 [&::-webkit-details-marker]:hidden">
            <span className="flex-1 text-base font-semibold">Details &amp; sources</span>
            <ChevronDown aria-hidden className="size-5 transition-transform group-open:rotate-180" />
          </summary>
          <div className="grid gap-6 border-t p-4">
            {stats && (
              <section className="grid gap-2">
                <h3 className="text-sm font-semibold">Platform</h3>
                <dl className="grid gap-1 text-sm">
                  <Row label="Knowledge banks" value={stats.banks} />
                  <Row label="Cards in the feed" value={stats.cards} />
                  <Row label="Quiz questions" value={stats.quizzes} />
                  <Row label="Measured generations" value={stats.generations} />
                  {measured && <Row label="Total spent on AI" value={formatUsd(stats.totalCostUsd)} />}
                  <Row label="Cards reported" value={stats.flags} />
                </dl>
                <p className="text-sm text-muted-foreground">
                  From real token counts. Seed banks and mock runs are left out.
                </p>
              </section>
            )}

            {banks.length > 0 && (
              <section className="grid gap-2">
                <h3 className="text-sm font-semibold">Banks</h3>
                <ul className="grid gap-1 text-sm">
                  {banks.map((bank) => (
                    <li key={bank.id} className="flex items-center justify-between gap-3 py-1">
                      <span className="min-w-0 truncate">{bank.title}</span>
                      <span className="flex shrink-0 items-center gap-2 text-muted-foreground tabular-nums">
                        {bank.cardCount} cards
                        {bank.verifiedPct !== null && (
                          <span className="flex items-center gap-0.5">
                            <ShieldCheck aria-label="verified" className="size-4" />
                            {formatPct(bank.verifiedPct)}
                          </span>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <section className="grid gap-2">
              <h3 className="text-sm font-semibold">Coursera prices</h3>
              <dl className="grid gap-1 text-sm">
                {PRICE_ROWS.map((row) => (
                  <Row key={row.label} label={row.label} value={`$${row.usd}`} />
                ))}
              </dl>
              <p className="text-sm text-muted-foreground">
                {COURSERA.registeredLearners} registered learners ({COURSERA.registeredAsOf}) are
                sign-ups, not active learners. About {COURSERA.combinedWithUdemy} with Udemy;{" "}
                {COURSERA.paidSubscribers} paying ({COURSERA.paidAsOf}).
              </p>
            </section>

            <section className="grid gap-1">
              <h3 className="text-sm font-semibold">Sources, checked {CHECKED_ON}</h3>
              <ul>
                {SOURCES.map((source) => (
                  <li key={source.url}>
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex min-h-11 items-center gap-1.5 text-sm text-olive-deep underline underline-offset-2"
                    >
                      <span className="flex-1">{source.label}</span>
                      <ExternalLink aria-hidden className="size-4 shrink-0" />
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </details>
      </div>
    </div>
  );
}

function KeyStat({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="grid justify-items-center gap-1 rounded-2xl bg-card p-3 text-center text-card-foreground">
      <Icon aria-hidden className="size-5 text-olive-deep" />
      <span className="text-xl font-semibold tabular-nums">{value}</span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex justify-between gap-3 border-b py-1.5 last:border-0">
      <dt>{label}</dt>
      <dd className="font-medium tabular-nums">{typeof value === "number" ? value.toLocaleString() : value}</dd>
    </div>
  );
}
