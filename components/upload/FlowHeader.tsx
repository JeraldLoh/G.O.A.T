"use client";

import { ArrowLeft, X } from "lucide-react";
import Link from "next/link";

/**
 * Top bar for the full-screen upload flow (the tab bar is hidden there):
 * back on the left when there is a previous step, ✕ on the right to leave,
 * and a thin progress bar underneath.
 */
export function FlowHeader({
  label,
  progress,
  onBack,
}: {
  label: string;
  /** 0–1 */
  progress: number;
  onBack?: () => void;
}) {
  return (
    <header className="shrink-0 bg-background">
      <div className="flex h-14 items-center gap-1 px-2">
        {onBack ? (
          <button
            type="button"
            aria-label="Back"
            onClick={onBack}
            className="flex size-11 shrink-0 items-center justify-center rounded-full hover:bg-muted"
          >
            <ArrowLeft aria-hidden className="size-5" />
          </button>
        ) : (
          <span aria-hidden className="size-11 shrink-0" />
        )}
        <p className="min-w-0 flex-1 truncate text-center text-sm font-semibold whitespace-nowrap">{label}</p>
        <Link
          href="/"
          aria-label="Close upload"
          className="press flex size-11 shrink-0 items-center justify-center rounded-full hover:bg-muted"
        >
          <X aria-hidden className="size-5" />
        </Link>
      </div>
      <div
        role="progressbar"
        aria-label="Upload progress"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(progress * 100)}
        className="h-1 bg-muted"
      >
        <div className="h-full bg-olive-deep transition-[width] duration-300" style={{ width: `${progress * 100}%` }} />
      </div>
    </header>
  );
}
