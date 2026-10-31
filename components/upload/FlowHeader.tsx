"use client";

import { BackLink } from "@/components/shell/BackLink";

/** Step bar for the upload form: one Back control, then the step label. */
export function FlowHeader({
  label,
  progress,
  onBack,
  onExit,
}: {
  label: string;
  /** 0–1 */
  progress: number;
  onBack?: () => void;
  onExit?: () => void;
}) {
  return (
    <header className="shrink-0 bg-background">
      <div className="flex min-h-14 items-center gap-3 px-4 py-2">
        <BackLink onClick={onBack ?? onExit} />
        <p className="min-w-0 flex-1 truncate text-sm font-semibold">{label}</p>
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
