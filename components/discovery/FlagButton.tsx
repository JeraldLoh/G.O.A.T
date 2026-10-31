"use client";

import { Flag } from "lucide-react";
import { useState } from "react";
import { BottomSheet } from "@/components/discovery/BottomSheet";
import { REPORT_REASONS, useReport } from "@/components/discovery/useTrust";
import { FLAG_HIDE_THRESHOLD } from "@/lib/schemas";
import { cn } from "@/lib/utils";

/**
 * Report a card. Prefer CardActions on feed cards (it combines report and
 * rating behind one ⋯ button); this standalone button stays for compatibility.
 */
export function FlagButton({
  cardId,
  onFlagged,
}: {
  cardId: string;
  onFlagged?: (flags: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const { reported, sending, error, report } = useReport(cardId, onFlagged);

  return (
    <>
      <button
        type="button"
        disabled={reported}
        onClick={() => setOpen(true)}
        className="inline-flex min-h-11 items-center gap-1.5 rounded-full px-3 text-sm text-muted-foreground hover:bg-muted disabled:hover:bg-transparent"
      >
        <Flag aria-hidden className={cn("size-4", reported && "fill-current")} />
        {reported ? "Reported" : "Report"}
      </button>
      <BottomSheet
        open={open}
        onOpenChange={setOpen}
        title="Report this card"
        description={`Cards reported by ${FLAG_HIDE_THRESHOLD} people leave the feed.`}
      >
        <ReasonList
          sending={sending}
          error={error}
          onPick={async (reason) => {
            if (await report(reason)) setOpen(false);
          }}
        />
      </BottomSheet>
    </>
  );
}

export function ReasonList({
  sending,
  error,
  onPick,
}: {
  sending: boolean;
  error: string | null;
  onPick: (reason: string) => void;
}) {
  return (
    <div className="grid gap-2">
      {REPORT_REASONS.map((reason) => (
        <button
          key={reason}
          type="button"
          disabled={sending}
          onClick={() => onPick(reason)}
          className="min-h-12 rounded-xl border bg-background px-4 text-left text-base hover:bg-muted disabled:opacity-60"
        >
          {reason}
        </button>
      ))}
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
