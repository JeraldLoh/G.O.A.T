"use client";

import { ChevronLeft, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { BottomSheet } from "@/components/discovery/BottomSheet";
import { QuizCard } from "@/components/feed/QuizCard";
import { ChapterGrid } from "@/components/video/ChapterGrid";
import { ChapterSlide } from "@/components/video/ChapterSlide";
import { useBank } from "@/lib/course";
import type { Chapter } from "@/lib/schemas";

type Sheet = "chapters" | "quiz" | null;

/** Vertical video feed for one bank: one chapter per screen, playing the one in view. */
export function ChapterFeed({ bankId, topic }: { bankId: string; topic?: string }) {
  const router = useRouter();
  const { detail, failed: bankFailed } = useBank(bankId);
  const [chapters, setChapters] = useState<Chapter[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [active, setActive] = useState(0);
  const [sheet, setSheet] = useState<Sheet>(null);
  const [sourceOpen, setSourceOpen] = useState(false);
  const [muted, setMuted] = useState(false);
  // Browsers only allow speech after a tap. Arriving from a button counts as one.
  const [started, setStarted] = useState(
    () => typeof navigator !== "undefined" && navigator.userActivation?.hasBeenActive === true,
  );
  const scroller = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let live = true;
    fetch(`/api/banks/${encodeURIComponent(bankId)}/chapters`)
      .then((response) => {
        if (!response.ok) throw new Error(`Chapters request failed: ${response.status}`);
        return response.json();
      })
      .then((data: Chapter[]) => live && setChapters(data))
      .catch(() => live && setFailed(true));
    return () => {
      live = false;
    };
  }, [bankId]);

  const goTo = useCallback((index: number, behavior: ScrollBehavior = "smooth") => {
    scroller.current?.children[index]?.scrollIntoView({ behavior });
  }, []);

  // Open at the chapter for ?topic=, then let scrolling decide which one plays.
  useEffect(() => {
    if (!chapters) return;
    const start = chapters.findIndex((chapter) => chapter.topic === topic);
    if (start > 0) goTo(start, "instant");

    const element = scroller.current;
    if (!element) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActive([...element.children].indexOf(entry.target));
          }
        }
      },
      { root: element, threshold: 0.6 },
    );
    for (const child of element.children) observer.observe(child);
    return () => observer.disconnect();
  }, [chapters, topic, goTo]);

  if (failed || bankFailed) {
    return <Centered title="Couldn't load this video" href="/" />;
  }
  if (!chapters || !detail) {
    return <Centered title="Writing your chapters…" />;
  }
  if (chapters.length === 0) {
    return <Centered title="No chapters here yet" href="/" />;
  }

  const current = chapters[active];
  const cards = new Map(detail.cards.map((card) => [card.id, card]));
  const quizzes = detail.quizzes.filter((quiz) => quiz.topic === current?.topic);
  const close = () => (window.history.length > 1 ? router.back() : router.push("/"));

  return (
    <div className="relative h-full bg-ink">
      <button
        type="button"
        onClick={close}
        aria-label="Close video"
        className="absolute top-[max(1.1rem,env(safe-area-inset-top))] left-3 z-20 rounded-full bg-ink/40 p-2 text-cream"
      >
        <X className="size-5" aria-hidden />
      </button>

      <div ref={scroller} className="h-full snap-y snap-mandatory overflow-y-scroll overscroll-contain">
        {chapters.map((chapter, index) => (
          <ChapterSlide
            key={chapter.id}
            chapter={chapter}
            total={chapters.length}
            bank={detail.summary}
            cards={cards}
            active={index === active}
            playing={started && sheet === null && !sourceOpen}
            muted={muted}
            hasQuiz={quizzes.length > 0}
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
          <h2 className="text-2xl font-semibold">You finished every chapter</h2>
          <p className="text-sm">{detail.bank.title}</p>
          <button
            type="button"
            onClick={() => goTo(0)}
            className="flex items-center gap-1 rounded-full bg-cream px-5 py-2.5 font-semibold text-ink"
          >
            <ChevronLeft className="size-4" aria-hidden />
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
        title={detail.bank.title}
        description={`${chapters.length} ${chapters.length === 1 ? "chapter" : "chapters"}`}
      >
        <ChapterGrid
          chapters={chapters}
          active={active}
          onPick={(index) => {
            setSheet(null);
            goTo(index);
          }}
        />
      </BottomSheet>

      <BottomSheet
        open={sheet === "quiz"}
        onOpenChange={(open) => setSheet(open ? "quiz" : null)}
        title="Test your knowledge"
        description={current?.topic}
      >
        <div className="flex flex-col gap-2">
          {quizzes.map((quiz) => (
            <div key={quiz.id} className="min-h-[24rem]">
              <QuizCard quiz={quiz} bank={detail.summary} />
            </div>
          ))}
        </div>
      </BottomSheet>
    </div>
  );
}

function Centered({ title, href }: { title: string; href?: string }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 bg-ink p-6 text-center text-cream">
      <h1 className="text-xl font-semibold">{title}</h1>
      {href && (
        <Link href={href} className="text-sm underline underline-offset-4">
          Back to the feed
        </Link>
      )}
    </div>
  );
}
