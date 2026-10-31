"use client";

import { Dialog } from "@base-ui/react/dialog";
import { BookOpen, ExternalLink, X } from "lucide-react";
import { useBank } from "@/lib/course";
import type { BankSummary, Card } from "@/lib/schemas";

/** Characters of source text shown on each side of the quote. */
const CONTEXT_CHARS = 450;

// Lane B1. "Source" button + bottom sheet with the quote highlighted in the original text.
export function SourceSheet({
  card,
  bank,
  onOpenChange,
}: {
  card: Card;
  bank?: BankSummary;
  onOpenChange?: (open: boolean) => void;
}) {
  return (
    <Dialog.Root onOpenChange={onOpenChange}>
      <Dialog.Trigger className="inline-flex items-center gap-1.5 rounded-full border border-khaki bg-background px-3 py-1.5 text-sm font-medium text-olive-deep focus-visible:ring-3 focus-visible:ring-ring focus-visible:outline-none active:bg-muted">
        <BookOpen className="size-4" aria-hidden />
        Source
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-ink/30 transition-opacity duration-200 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0" />
        <Dialog.Popup className="fixed inset-x-0 bottom-0 z-50 mx-auto flex max-h-[80dvh] max-w-[430px] flex-col rounded-t-2xl bg-background shadow-xl transition-transform duration-300 outline-none data-[ending-style]:translate-y-full data-[starting-style]:translate-y-full">
          <div className="flex items-start justify-between gap-3 border-b p-4">
            <div className="min-w-0">
              <Dialog.Title className="font-semibold">Source passage</Dialog.Title>
              <Dialog.Description className="truncate text-xs text-muted-foreground">
                {bank ? `${bank.title} · ${bank.license}` : card.title}
              </Dialog.Description>
            </div>
            <Dialog.Close className="rounded-full p-1 focus-visible:ring-3 focus-visible:ring-ring focus-visible:outline-none" aria-label="Close">
              <X className="size-5" aria-hidden />
            </Dialog.Close>
          </div>
          <div className="overflow-y-auto p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
            <Passage card={card} />
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

// Rendered only while the sheet is open, so the bank is fetched on first open.
function Passage({ card }: { card: Card }) {
  const { detail, failed } = useBank(card.bankId);
  if (failed) return <p className="text-sm text-brick">Could not load the source text.</p>;
  if (!detail) return <p className="text-sm">Loading source…</p>;

  const { sourceText, sourceUrl, attribution } = detail.bank;
  const { sourceStart: start, sourceEnd: end } = card;
  const located = start !== null && end !== null && end <= sourceText.length && start < end;

  return (
    <div className="flex flex-col gap-3">
      {located ? (
        <p className="text-sm leading-relaxed whitespace-pre-wrap">
          {start > CONTEXT_CHARS && "… "}
          {sourceText.slice(Math.max(0, start - CONTEXT_CHARS), start)}
          <mark className="rounded bg-sunflower px-0.5 text-ink">{sourceText.slice(start, end)}</mark>
          {sourceText.slice(end, end + CONTEXT_CHARS)}
          {end + CONTEXT_CHARS < sourceText.length && " …"}
        </p>
      ) : (
        <>
          <p className="text-xs text-muted-foreground">The exact position of this quote in the source is not recorded.</p>
          <blockquote className="rounded-lg bg-peach/40 p-3 text-sm italic">“{card.quote}”</blockquote>
        </>
      )}
      <p className="text-xs text-muted-foreground">
        {attribution || "No attribution given"} · {detail.bank.license}
      </p>
      {sourceUrl && (
        <a
          href={sourceUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-sm font-medium text-olive-deep underline underline-offset-4"
        >
          Open original <ExternalLink className="size-3.5" aria-hidden />
        </a>
      )}
    </div>
  );
}
