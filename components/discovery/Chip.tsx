"use client";

import { Check, SignalHigh, SignalLow, SignalMedium, X, type LucideIcon } from "lucide-react";
import type { Level } from "@/lib/schemas";
import { cn } from "@/lib/utils";

/** Level icons: 1, 2 or 3 bars. */
export const LEVEL_ICON: Record<Level, LucideIcon> = {
  beginner: SignalLow,
  intermediate: SignalMedium,
  advanced: SignalHigh,
};

/**
 * The one selectable option style (topics, levels, tags). 44px tall so it's
 * an easy touch target; selected chips get a check, not just a color change.
 */
export function OptionChip({
  selected,
  onClick,
  icon: Icon,
  muted = false,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  icon?: LucideIcon;
  /** Dimmed (e.g. a topic with no banks yet) but still selectable. */
  muted?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={cn(
        "inline-flex min-h-11 items-center gap-1.5 rounded-full border px-4 text-sm font-medium transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
        selected
          ? "border-olive-deep bg-olive-deep text-paper"
          : "border-border bg-background hover:bg-muted",
        muted && !selected && "border-dashed text-muted-foreground",
      )}
    >
      {selected ? (
        <Check aria-hidden className="size-4" />
      ) : (
        Icon && <Icon aria-hidden className="size-4" />
      )}
      {children}
    </button>
  );
}

/** Compact chip for the filter row. Its buttons reach 44px through an invisible hit area. */
export function SummaryChip({
  children,
  onClick,
  onRemove,
}: {
  children: string;
  onClick?: () => void;
  onRemove?: () => void;
}) {
  return (
    <span className="flex h-9 shrink-0 items-center rounded-full bg-muted text-sm font-medium">
      <button
        type="button"
        onClick={onClick}
        className={cn(
          "relative h-full rounded-full pl-3.5 after:absolute after:-inset-y-1 after:inset-x-0",
          onRemove ? "pr-1" : "pr-3.5",
        )}
      >
        {children}
      </button>
      {onRemove && (
        <button
          type="button"
          aria-label={`Remove ${children}`}
          onClick={onRemove}
          className="relative flex h-full w-8 items-center justify-center rounded-full after:absolute after:-inset-1.5 hover:text-destructive"
        >
          <X aria-hidden className="size-4" />
        </button>
      )}
    </span>
  );
}
