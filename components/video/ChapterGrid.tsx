"use client";

import { Check, ChartNoAxesColumn } from "lucide-react";
import { useProgress } from "@/lib/local";
import type { Chapter } from "@/lib/schemas";
import { cn } from "@/lib/utils";

/** "View all chapters": numbered tiles, with the playing one marked. */
export function ChapterGrid({
  chapters,
  active,
  onPick,
}: {
  chapters: Chapter[];
  active: number;
  onPick: (index: number) => void;
}) {
  const progress = useProgress();
  const seen = new Set(progress.seen);

  return (
    <ul className="grid grid-cols-5 gap-2 pb-4">
      {chapters.map((chapter, index) => {
        const watched = chapter.scenes.every((scene) => seen.has(scene.cardId));
        const current = index === active;
        return (
          <li key={chapter.id}>
            <button
              type="button"
              onClick={() => onPick(index)}
              aria-label={`Chapter ${index + 1}: ${chapter.title}${watched ? ", watched" : ""}`}
              aria-current={current ? "true" : undefined}
              className={cn(
                "relative flex aspect-square w-full items-center justify-center gap-1 rounded-xl bg-muted text-lg font-semibold tabular-nums",
                current && "bg-peach/50 text-brick",
              )}
            >
              {current && <ChartNoAxesColumn className="size-4" aria-hidden />}
              {index + 1}
              {watched && !current && (
                <Check className="absolute top-1 right-1 size-3.5 text-olive-deep" aria-hidden />
              )}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
