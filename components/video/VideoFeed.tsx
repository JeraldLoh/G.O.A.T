"use client";

import { RotateCcw, X } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { BottomSheet } from "@/components/discovery/BottomSheet";
import { ChapterGrid } from "@/components/video/ChapterGrid";
import { ChapterQuiz } from "@/components/video/ChapterQuiz";
import { ChapterSlide } from "@/components/video/ChapterSlide";
import type { VideoItem } from "@/lib/schemas";

type Sheet = "chapters" | "quiz" | null;

/**
 * The vertical video player: one chapter per screen, playing the one in view and
 * moving on when it ends. Used by Learn more and by the Videos tab.
 */
export function VideoFeed({
  items,
  startIndex = 0,
  onClose,
  endTitle,
  endBody,
}: {
  items: VideoItem[];
  startIndex?: number;
  /** Shows a close button when set. */
  onClose?: () => void;
  endTitle: string;
  endBody?: string;
}) {
  const [active, setActive] = useState(startIndex);
  const [sheet, setSheet] = useState<Sheet>(null);
  const [sourceOpen, setSourceOpen] = useState(false);
  const [muted, setMuted] = useState(false);
  // Browsers only allow speech after a tap. Arriving from a button counts as one.
  const [started, setStarted] = useState(
    () => typeof navigator !== "undefined" && navigator.userActivation?.hasBeenActive === true,
  );
  const scroller = useRef<HTMLDivElement>(null);

  const goTo = useCallback((index: number, behavior: ScrollBehavior = "smooth") => {
    scroller.current?.children[index]?.scrollIntoView({ behavior });
  }, []);

  // Open at the requested chapter, then let scrolling decide which one plays.
  useEffect(() => {
    if (startIndex > 0) goTo(startIndex, "instant");

    const element = scroller.current;
    if (!element) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive([...element.children].indexOf(entry.target));
        }
      },
      { root: element, threshold: 0.6 },
    );
    for (const child of element.children) observer.observe(child);
    return () => observer.disconnect();
  }, [startIndex, goTo]);

  const current: VideoItem | undefined = items[active];
  const bankItems = items.filter((item) => item.bank.id === current?.bank.id);

  return (
    <div className="relative h-full bg-ink">
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Close video"
          className="absolute top-[max(1.1rem,env(safe-area-inset-top))] left-3 z-20 rounded-full bg-ink/40 p-2 text-cream"
        >
          <X className="size-5" aria-hidden />
        </button>
      )}

      <div ref={scroller} className="h-full snap-y snap-mandatory overflow-y-scroll overscroll-contain">
        {items.map((item, index) => (
          <ChapterSlide
            key={item.chapter.id}
            chapter={item.chapter}
            total={items.filter(({ bank }) => bank.id === item.bank.id).length}
            bank={item.bank}
            cards={new Map(item.cards.map((card) => [card.id, card]))}
            active={index === active}
            playing={started && sheet === null && !sourceOpen}
            muted={muted}
            hasQuiz={item.quizzes.length > 0}
            closable={onClose !== undefined}
            onToggleMute={() => setMuted((value) => !value)}
            onOpenChapters={() => setSheet("chapters")}
            onOpenQuiz={() => setSheet("quiz")}
            onSourceOpenChange={setSourceOpen}
            onEnded={() => goTo(index + 1)}
          />
        ))}
        <section className="flex h-full snap-start flex-col items-center justify-center gap-4 bg-olive-deep p-8 text-center text-cream">
          <p className="text-5xl" aria-hidden>
            🎉
          </p>
          <h2 className="text-2xl font-semibold">{endTitle}</h2>
          {endBody && <p className="text-sm">{endBody}</p>}
          <button
            type="button"
            onClick={() => goTo(0)}
            className="flex items-center gap-2 rounded-full bg-cream px-5 py-2.5 font-semibold text-ink"
          >
            <RotateCcw className="size-4" aria-hidden />
            Watch again
          </button>
          <Link href="/progress" className="text-sm underline underline-offset-4">
            See your progress
          </Link>
        </section>
      </div>

      {!started && (
        <button
          type="button"
          onClick={() => setStarted(true)}
          className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-3 bg-ink/60 text-cream"
        >
          <span className="rounded-full bg-cream px-6 py-3 text-lg font-semibold text-ink">▶ Play</span>
          <span className="text-sm">Tap to start with sound</span>
        </button>
      )}

      <BottomSheet
        open={sheet === "chapters"}
        onOpenChange={(open) => setSheet(open ? "chapters" : null)}
        title={current?.bank.title ?? ""}
        description={`${bankItems.length} ${bankItems.length === 1 ? "chapter" : "chapters"}`}
      >
        <ChapterGrid
          chapters={bankItems.map((item) => item.chapter)}
          activeId={current?.chapter.id}
          onPick={(chapterId) => {
            setSheet(null);
            goTo(items.findIndex((item) => item.chapter.id === chapterId));
          }}
        />
      </BottomSheet>

      <BottomSheet
        open={sheet === "quiz"}
        onOpenChange={(open) => setSheet(open ? "quiz" : null)}
        title="Test your knowledge"
        description={current?.chapter.topic}
      >
        {/* Keyed by chapter so each chapter quiz starts at question 1. */}
        {current && (
          <ChapterQuiz
            key={current.chapter.id}
            quizzes={current.quizzes}
            bank={current.bank}
            onDone={() => setSheet(null)}
          />
        )}
      </BottomSheet>
    </div>
  );
}
