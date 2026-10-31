"use client";

import { ExternalLink, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import {
  CHECKED_ON,
  COURSERA,
  PRICE_ROWS,
  SOURCES,
} from "@/components/discovery/comparison";
import { formatPct, formatSeconds, formatUsd } from "@/components/discovery/format";
import type { BankSummary, Stats } from "@/lib/schemas";

const NOT_MEASURED = "Not measured yet";

/**
 * Rubric evidence: the status quo's price and reach (published figures, sourced)
 * next to our measured numbers from /api/stats. Never shows an invented number:
 * a null stat renders as "Not measured yet".
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

  return (
    <div className="h-full overflow-y-auto">
      <div className="grid gap-6 p-5">
        <header>
          <h1 className="text-2xl font-semibold">Learning shouldn&apos;t cost $399 a year</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            What learners pay for a course subscription today, and what this app costs to run.
          </p>
        </header>

        {/* Before / after */}
        <section className="grid grid-cols-2 gap-2" aria-label="Cost per learner">
          <div className="rounded-xl bg-muted p-4">
            <p className="text-xs text-muted-foreground">Coursera Plus</p>
            <p className="mt-1 text-3xl font-semibold tabular-nums">${COURSERA.plusAnnualUsd}</p>
            <p className="text-xs text-muted-foreground">per learner, per year</p>
          </div>
          <div className="rounded-xl bg-sunflower p-4 text-ink">
            <p className="text-xs">Knowledge Bank</p>
            <p className="mt-1 text-3xl font-semibold tabular-nums">$0</p>
            <p className="text-xs">per learner, forever</p>
          </div>
          <p className="col-span-2 rounded-xl border-2 border-olive-deep p-3 text-center text-sm">
            Saves each learner <strong>${COURSERA.plusAnnualUsd}/year</strong> (annual plan) or{" "}
            <strong>${COURSERA.plusMonthlyUsd * 12}/year</strong> paying monthly.
          </p>
        </section>

        {/* Our measured numbers */}
        <section className="grid gap-2">
          <h2 className="font-semibold">What it costs us (measured)</h2>
          {failed && <p className="text-sm text-destructive">Couldn&apos;t load stats.</p>}
          {!failed && !stats && <p className="text-sm text-muted-foreground">Loading…</p>}
          {stats && (
            <>
              <div className="rounded-xl bg-card p-4 text-card-foreground">
                <p className="text-xs text-muted-foreground">Average generation cost per bank</p>
                <p className="mt-1 text-2xl font-semibold tabular-nums">
                  {stats.avgCostUsd === null ? NOT_MEASURED : formatUsd(stats.avgCostUsd)}
                </p>
                <p className="text-xs text-muted-foreground">
                  paid once, then served to unlimited learners
                </p>
              </div>
              <dl className="grid grid-cols-2 gap-2">
                <Stat label="Knowledge banks" value={stats.banks.toLocaleString()} />
                <Stat label="Cards in the feed" value={stats.cards.toLocaleString()} />
                <Stat label="Quiz questions" value={stats.quizzes.toLocaleString()} />
                <Stat
                  label="Quotes verified in source"
                  value={stats.verifiedPct === null ? NOT_MEASURED : formatPct(stats.verifiedPct)}
                />
                <Stat
                  label="Avg generation time"
                  value={stats.avgDurationMs === null ? NOT_MEASURED : formatSeconds(stats.avgDurationMs)}
                />
                <Stat label="Measured generations" value={stats.generations.toLocaleString()} />
                <Stat
                  label="Total spent on AI"
                  value={stats.generations === 0 ? NOT_MEASURED : formatUsd(stats.totalCostUsd)}
                />
                <Stat label="Cards reported by learners" value={stats.flags.toLocaleString()} />
              </dl>
              <p className="text-xs text-muted-foreground">
                Costs come from real token counts of each generation. Hand-written seed banks and
                offline mock runs are left out.
              </p>
            </>
          )}
        </section>

        {banks.length > 0 && (
          <section className="grid gap-2">
            <h2 className="font-semibold">Banks</h2>
            <ul className="grid gap-2">
              {banks.map((bank) => (
                <li key={bank.id} className="rounded-xl border p-3">
                  <p className="font-medium">{bank.title}</p>
                  <p className="mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                    <span>
                      {bank.cardCount} cards · {bank.quizCount} quizzes
                    </span>
                    {bank.verifiedPct !== null && (
                      <span className="flex items-center gap-1">
                        <ShieldCheck aria-hidden className="size-3" />
                        {formatPct(bank.verifiedPct)} verified
                      </span>
                    )}
                    <span>
                      {bank.accuracyScore === null
                        ? "Not rated yet"
                        : `${formatPct(bank.accuracyScore)} rate it accurate`}
                    </span>
                    <span>{bank.license}</span>
                  </p>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* The status quo */}
        <section className="grid gap-2">
          <h2 className="font-semibold">The paid alternative</h2>
          <table className="w-full text-sm">
            <caption className="sr-only">Coursera prices per learner</caption>
            <tbody>
              {PRICE_ROWS.map((row) => (
                <tr key={row.label} className="border-b last:border-0">
                  <th scope="row" className="py-2 pr-2 text-left font-normal">
                    {row.label}
                    <span className="block text-xs text-muted-foreground">{row.detail}</span>
                  </th>
                  <td className="py-2 text-right font-medium tabular-nums">${row.usd}</td>
                </tr>
              ))}
              <tr>
                <th scope="row" className="py-2 pr-2 text-left font-semibold">
                  Knowledge Bank
                </th>
                <td className="py-2 text-right font-semibold tabular-nums">$0</td>
              </tr>
            </tbody>
          </table>
          <dl className="grid grid-cols-2 gap-2">
            <Stat
              label={`Registered Coursera learners (${COURSERA.registeredAsOf})`}
              value={COURSERA.registeredLearners}
            />
            <Stat
              label={`Paying subscribers (${COURSERA.paidAsOf})`}
              value={COURSERA.paidSubscribers}
            />
          </dl>
          <p className="text-xs text-muted-foreground">
            Registered learners are sign-ups, not active learners; Coursera says the figure is not a
            measure of engagement. About {COURSERA.combinedWithUdemy} combined with Udemy after
            the May 2026 merger.
          </p>
        </section>

        <section className="grid gap-1.5">
          <h2 className="text-sm font-semibold">Sources (checked {CHECKED_ON})</h2>
          <ul className="grid gap-1.5">
            {SOURCES.map((source) => (
              <li key={source.url}>
                <a
                  href={source.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-start gap-1 text-xs text-olive-deep underline underline-offset-2"
                >
                  {source.label}
                  <ExternalLink aria-hidden className="mt-0.5 size-3 shrink-0" />
                </a>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-muted p-3">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 text-lg font-semibold tabular-nums">{value}</dd>
    </div>
  );
}
