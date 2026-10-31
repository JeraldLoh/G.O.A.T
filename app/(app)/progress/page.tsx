"use client";

import { Check } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { feedContent, percentDone, tally, tallyByTopic, useBank } from "@/lib/course";
import { resetProgress, useProgress } from "@/lib/local";
import type { BankSummary } from "@/lib/schemas";

// Lane B2. Per-bank and per-topic progress, quiz score, reset. All from kb:progress.
export default function ProgressPage() {
  const progress = useProgress();
  const [banks, setBanks] = useState<BankSummary[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    fetch("/api/banks")
      .then((response) => {
        if (!response.ok) throw new Error(`Banks request failed: ${response.status}`);
        return response.json();
      })
      .then(setBanks)
      .catch(() => setFailed(true));
  }, []);

  const started = progress.seen.length > 0 || Object.keys(progress.quiz).length > 0;
  const answered = Object.values(progress.quiz);

  return (
    <div className="h-full overflow-y-auto p-5">
      <h1 className="text-2xl font-semibold">Your progress</h1>
      <p className="mt-1 text-sm text-muted-foreground">Saved on this device. No account needed.</p>

      <dl className="mt-4 grid grid-cols-2 gap-2">
        <div className="rounded-xl bg-card p-3">
          <dt className="text-xs text-muted-foreground">Cards read</dt>
          <dd className="text-2xl font-semibold tabular-nums">{progress.seen.length}</dd>
        </div>
        <div className="rounded-xl bg-card p-3">
          <dt className="text-xs text-muted-foreground">Quiz score</dt>
          <dd className="text-2xl font-semibold tabular-nums">
            {answered.filter(Boolean).length} / {answered.length}
          </dd>
        </div>
      </dl>

      {!started && (
        <div className="mt-6 rounded-xl border border-dashed p-6 text-center">
          <p className="font-medium">Start swiping to track progress</p>
          <Link href="/" className="mt-2 inline-block text-sm font-medium text-olive-deep underline underline-offset-4">
            Go to the feed
          </Link>
        </div>
      )}

      <h2 className="mt-6 text-sm font-semibold tracking-wide text-muted-foreground uppercase">Banks</h2>
      {failed && <p className="mt-2 text-sm text-brick">Could not load banks.</p>}
      {!failed && banks === null && <p className="mt-2 text-sm">Loading…</p>}
      {banks?.length === 0 && <p className="mt-2 text-sm">No banks yet.</p>}
      <ul className="mt-2 flex flex-col gap-3">
        {banks?.map((bank) => <BankRow key={bank.id} bank={bank} />)}
      </ul>

      {started && (
        <button
          type="button"
          onClick={() => {
            if (window.confirm("Reset all progress on this device?")) resetProgress();
          }}
          className="mt-6 mb-2 text-sm font-medium text-brick underline underline-offset-4"
        >
          Reset progress
        </button>
      )}
    </div>
  );
}

function BankRow({ bank }: { bank: BankSummary }) {
  const progress = useProgress();
  const { detail, failed } = useBank(bank.id);
  const content = detail ? feedContent(detail) : null;
  const total = content ? tally(content.cards, content.quizzes, progress) : null;
  const topics = content ? tallyByTopic(content.cards, content.quizzes, progress) : [];
  const value = total ? percentDone(total) : 0;

  return (
    <li className="rounded-xl bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold">{bank.title}</p>
          <p className="text-xs text-muted-foreground capitalize">
            {bank.subject} · {bank.level}
          </p>
        </div>
        {total?.complete ? (
          <span className="flex shrink-0 items-center gap-1 rounded-full bg-sunflower px-2 py-0.5 text-xs font-semibold text-ink">
            <Check className="size-3" aria-hidden /> Complete
          </span>
        ) : (
          <span className="shrink-0 text-sm tabular-nums">{total ? `${value}%` : "…"}</span>
        )}
      </div>
      <div
        role="progressbar"
        aria-label={`${bank.title} progress`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={value}
        className="mt-3 h-2 overflow-hidden rounded-full bg-khaki/40"
      >
        <div className="h-full rounded-full bg-olive transition-[width] duration-500" style={{ width: `${value}%` }} />
      </div>
      {failed && <p className="mt-2 text-xs text-brick">Could not load this bank.</p>}
      {total && (
        <p className="mt-2 text-xs text-muted-foreground">
          {total.cardsSeen}/{total.cardsTotal} cards · {total.quizzesCorrect}/{total.quizzesTotal} quiz correct
        </p>
      )}
      {topics.length > 1 && (
        <ul className="mt-3 flex flex-col gap-1 border-t pt-3">
          {topics.map((topic) => (
            <li key={topic.topic} className="flex items-center justify-between gap-2 text-sm">
              <span className="flex min-w-0 items-center gap-1.5">
                {topic.complete && <Check className="size-3.5 shrink-0 text-olive-deep" aria-label="Topic complete" />}
                <span className="truncate">{topic.topic}</span>
              </span>
              <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                {topic.done} / {topic.total}
              </span>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}
