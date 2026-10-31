"use client";

import { PartyPopper } from "lucide-react";
import Link from "next/link";
import { BankProgress } from "@/components/feed/BankProgress";
import { useBankTally } from "@/lib/course";
import type { BankSummary } from "@/lib/schemas";

// Lane B2. The slot after a bank's last entry: "Bank complete" or "x of y done".
export function CompletionScreen({ bank }: { bank: BankSummary }) {
  const tally = useBankTally(bank.id);
  if (!tally) return <div className="flex h-full items-center justify-center text-sm">Loading…</div>;

  const left = tally.total - tally.done;
  return (
    <div className="flex h-full flex-col gap-4 p-5">
      <BankProgress bank={bank} />
      <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
        {tally.complete ? (
          <div className="animate-in zoom-in-75 flex size-20 items-center justify-center rounded-full bg-sunflower duration-500">
            <PartyPopper className="size-10 text-ink" aria-hidden />
          </div>
        ) : null}
        <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{bank.title}</p>
        <h2 className="text-2xl font-semibold">{tally.complete ? "Bank complete!" : `${tally.done} of ${tally.total} done`}</h2>
        <dl className="grid w-full max-w-xs grid-cols-2 gap-2">
          <div className="rounded-xl bg-card p-3">
            <dt className="text-xs text-muted-foreground">Cards read</dt>
            <dd className="text-lg font-semibold tabular-nums">
              {tally.cardsSeen} / {tally.cardsTotal}
            </dd>
          </div>
          <div className="rounded-xl bg-card p-3">
            <dt className="text-xs text-muted-foreground">Quiz score</dt>
            <dd className="text-lg font-semibold tabular-nums">
              {tally.quizzesCorrect} / {tally.quizzesTotal}
            </dd>
          </div>
        </dl>
        <p className="text-sm text-muted-foreground">
          {tally.complete
            ? "Swipe up for the next bank."
            : `${left} ${left === 1 ? "item" : "items"} left. Scroll back up to finish, or keep going.`}
        </p>
        <Link href="/progress" className="text-sm font-medium text-olive-deep underline underline-offset-4">
          See all progress
        </Link>
      </div>
    </div>
  );
}
