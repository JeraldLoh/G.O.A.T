"use client";

import { percentDone, useBankTally } from "@/lib/course";
import type { BankSummary } from "@/lib/schemas";

// Lane B2. Thin bar + "3 / 8" for the bank, shown at the top of every feed slot.
export function BankProgress({ bank }: { bank: BankSummary }) {
  const tally = useBankTally(bank.id);
  const value = tally ? percentDone(tally) : 0;
  return (
    <div className="flex items-center gap-2">
      <div
        role="progressbar"
        aria-label={`${bank.title} progress`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={value}
        className="h-1.5 flex-1 overflow-hidden rounded-full bg-khaki/40"
      >
        <div className="h-full rounded-full bg-olive transition-[width] duration-500" style={{ width: `${value}%` }} />
      </div>
      <span className="min-w-10 text-right text-xs tabular-nums text-muted-foreground">
        {tally ? `${tally.done} / ${tally.total}` : "…"}
      </span>
    </div>
  );
}
