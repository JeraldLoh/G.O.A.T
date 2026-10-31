"use client";

import { CircleCheck, Ellipsis, Flag } from "lucide-react";
import { useState } from "react";
import { BottomSheet } from "@/components/discovery/BottomSheet";
import { ReasonList } from "@/components/discovery/FlagButton";
import { ThumbButton } from "@/components/discovery/RatingButtons";
import { useRating, useReport } from "@/components/discovery/useTrust";
import { FLAG_HIDE_THRESHOLD, type BankSummary, type Card } from "@/lib/schemas";

/**
 * One ⋯ button for a feed card's secondary actions (report the card, rate the
 * bank), so the card itself shows only the content. Put it in the card's top
 * corner. onFlagged lets the feed hide the card for this user right away.
 */
export function CardActions({
  card,
  bank,
  onFlagged,
}: {
  card: Card;
  bank: BankSummary;
  onFlagged?: (flags: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const [reporting, setReporting] = useState(false);
  const { reported, sending, error, report } = useReport(card.id, onFlagged);
  const rating = useRating(bank.id, bank.accuracyScore);

  return (
    <>
      <button
        type="button"
        aria-label="More actions for this card"
        onClick={() => {
          setReporting(false);
          setOpen(true);
        }}
        className="flex size-11 items-center justify-center rounded-full text-muted-foreground hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
      >
        <Ellipsis aria-hidden className="size-5" />
      </button>

      <BottomSheet
        open={open}
        onOpenChange={setOpen}
        title={reporting ? "What's wrong with this card?" : card.title}
        description={
          reporting ? `Cards reported by ${FLAG_HIDE_THRESHOLD} people leave the feed.` : bank.title
        }
      >
        {reporting ? (
          <ReasonList
            sending={sending}
            error={error}
            onPick={async (reason) => {
              if (await report(reason)) setOpen(false);
            }}
          />
        ) : (
          <>
            <section className="grid gap-2">
              <h3 className="text-sm font-semibold">Is this bank accurate?</h3>
              <div className="flex flex-wrap items-center gap-2">
                <ThumbButton up selected={rating.mine === 1} onClick={() => rating.rate(1)} />
                <ThumbButton up={false} selected={rating.mine === -1} onClick={() => rating.rate(-1)} />
                {rating.error ? (
                  <span role="alert" className="text-sm text-destructive">
                    Couldn&apos;t save
                  </span>
                ) : (
                  rating.score !== null && (
                    <span className="text-sm text-muted-foreground">
                      {Math.round(rating.score)}% say yes
                    </span>
                  )
                )}
              </div>
            </section>

            {reported ? (
              <p className="flex min-h-12 items-center gap-2 text-sm text-muted-foreground">
                <CircleCheck aria-hidden className="size-5 text-olive-deep" />
                You reported this card. Thanks.
              </p>
            ) : (
              <button
                type="button"
                onClick={() => setReporting(true)}
                className="flex min-h-12 items-center gap-3 rounded-xl border bg-background px-4 text-left text-base hover:bg-muted"
              >
                <Flag aria-hidden className="size-5 text-destructive" />
                Report this card
              </button>
            )}
          </>
        )}
      </BottomSheet>
    </>
  );
}
