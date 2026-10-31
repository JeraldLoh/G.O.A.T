"use client";

import { BadgeCheck, GraduationCap, LayoutGrid, Pause, Volume2, VolumeX } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { SourceSheet } from "@/components/feed/SourceSheet";
import { markSeen } from "@/lib/local";
import type { BankSummary, Card, Chapter, Scene } from "@/lib/schemas";
import { cn } from "@/lib/utils";

const WORDS_PER_MINUTE = 165;
const MIN_SCENE_MS = 3000;
const SPEECH_RATE = 1.05;
// How long to wait past the estimate for speech to finish before moving on anyway.
const SPEECH_GRACE = 1.8;
// Chrome can drop speech queued right after a cancel, and fast swipes would pile up
// cancels, so speech only starts once a scene has stayed on screen this long.
const SPEECH_DELAY_MS = 150;

const BACKGROUNDS = [
  "from-olive-deep to-ink",
  "from-brick to-ink",
  "from-olive to-ink",
  "from-terracotta to-ink",
];

function sceneMs(scene: Scene): number {
  const words = scene.narration.trim().split(/\s+/).length;
  return Math.max(MIN_SCENE_MS, (words / WORDS_PER_MINUTE) * 60_000);
}

/** Speaks the scene with the device's voice, falling back to a timer so captions always advance. */
function useScenePlayback(
  scene: Scene,
  playing: boolean,
  muted: boolean,
  onDone: () => void,
  onWord: (charIndex: number) => void,
) {
  useEffect(() => {
    if (!playing) return;
    const ms = sceneMs(scene);
    let finished = false;
    let timer: ReturnType<typeof setTimeout>;
    let speakTimer: ReturnType<typeof setTimeout> | undefined;
    const finish = () => {
      if (finished) return;
      finished = true;
      onDone();
    };

    const speech = typeof window !== "undefined" ? window.speechSynthesis : undefined;
    if (muted || !speech) {
      timer = setTimeout(finish, ms);
    } else {
      const utterance = new SpeechSynthesisUtterance(scene.narration);
      utterance.rate = SPEECH_RATE;
      // The voice can take seconds to load, so the safety timer restarts when it begins.
      utterance.onstart = () => {
        clearTimeout(timer);
        timer = setTimeout(finish, ms * SPEECH_GRACE);
      };
      utterance.onend = finish;
      // Not every voice reports word positions; the line just stays unhighlighted then.
      utterance.onboundary = (event) => {
        if (event.name === "word") onWord(event.charIndex);
      };
      utterance.onerror = () => {
        clearTimeout(timer);
        timer = setTimeout(finish, ms);
      };
      speech.cancel();
      speakTimer = setTimeout(() => speech.speak(utterance), SPEECH_DELAY_MS);
      timer = setTimeout(finish, ms * SPEECH_GRACE);
    }

    return () => {
      finished = true;
      clearTimeout(timer);
      clearTimeout(speakTimer);
      speech?.cancel();
    };
  }, [scene, playing, muted, onDone, onWord]);
}

/** The narration, with the word being spoken highlighted, like short-video captions. */
function SpokenLine({ text, charIndex }: { text: string; charIndex: number | null }) {
  return (
    <span className="animate-in fade-in-0 text-lg leading-relaxed font-medium duration-700">
      {[...text.matchAll(/\s+|\S+/g)].map(({ 0: part, index: start }) => {
        const spoken =
          charIndex !== null &&
          part.trim() &&
          charIndex >= start &&
          charIndex < start + part.length;
        return spoken ? (
          <mark key={start} className="rounded bg-sunflower px-0.5 text-ink">
            {part}
          </mark>
        ) : (
          part
        );
      })}
    </span>
  );
}

/** The scene's stock clip behind a dark layer that keeps the text readable. */
function SceneBackground({ scene, running }: { scene: Scene; running: boolean }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [failed, setFailed] = useState(false);
  const video = scene.video;

  useEffect(() => {
    if (!ref.current) return;
    if (running) ref.current.play().catch(() => {});
    else ref.current.pause();
  }, [running, video]);

  if (!video || failed) return null;
  return (
    <>
      {/* muted + playsInline is what lets phones autoplay it. */}
      <video
        key={video.url}
        ref={ref}
        src={video.url}
        poster={video.poster}
        muted
        loop
        playsInline
        preload="auto"
        onError={() => setFailed(true)}
        aria-hidden
        className="animate-in fade-in-0 absolute inset-0 size-full object-cover duration-500"
      />
      <div className="absolute inset-0 bg-ink/60" aria-hidden />
    </>
  );
}

function SceneBars({ count, index, ms, playing }: { count: number; index: number; ms: number; playing: boolean }) {
  const fill = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const animation = fill.current?.animate([{ width: "0%" }, { width: "100%" }], {
      duration: ms,
      fill: "forwards",
    });
    return () => animation?.cancel();
  }, [index, ms]);

  useEffect(() => {
    for (const animation of fill.current?.getAnimations() ?? []) {
      if (playing) animation.play();
      else animation.pause();
    }
  }, [playing, index]);

  return (
    <div className="flex gap-1" aria-hidden>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="h-1 flex-1 overflow-hidden rounded-full bg-cream/30">
          {i < index && <div className="h-full bg-cream" />}
          {i === index && <div ref={fill} className="h-full bg-cream" />}
        </div>
      ))}
    </div>
  );
}

type SlideProps = {
  chapter: Chapter;
  total: number;
  bank: BankSummary;
  cards: Map<string, Card>;
  active: boolean;
  playing: boolean;
  muted: boolean;
  hasQuiz: boolean;
  /** Leaves room for the close button, which the Videos tab doesn't have. */
  closable: boolean;
  onToggleMute: () => void;
  onOpenChapters: () => void;
  onOpenQuiz: () => void;
  onSourceOpenChange: (open: boolean) => void;
  onEnded: () => void;
};

export function ChapterSlide(props: SlideProps) {
  return (
    <section className="h-full snap-start snap-always">
      {/* Remounting when a chapter comes into view restarts it from the first scene. */}
      <Player key={String(props.active)} {...props} />
    </section>
  );
}

function Player({
  chapter,
  total,
  bank,
  cards,
  active,
  playing,
  muted,
  hasQuiz,
  closable,
  onToggleMute,
  onOpenChapters,
  onOpenQuiz,
  onSourceOpenChange,
  onEnded,
}: SlideProps) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const scene = chapter.scenes[index];
  const card = cards.get(scene.cardId);
  const running = active && playing && !paused;

  const onDone = useRef(() => {});
  useEffect(() => {
    onDone.current = () => {
      if (index + 1 < chapter.scenes.length) setIndex(index + 1);
      else onEnded();
    };
  });
  const [advance] = useState(() => () => onDone.current());
  const [spoken, setSpoken] = useState<{ narration: string; charIndex: number } | null>(null);
  const narration = useRef(scene.narration);
  useEffect(() => {
    narration.current = scene.narration;
  });
  const [onWord] = useState(() => (charIndex: number) => {
    setSpoken({ narration: narration.current, charIndex });
  });
  useScenePlayback(scene, running, muted, advance, onWord);

  // Watching a scene counts as reading its card, so progress carries over to the feed.
  useEffect(() => {
    if (running) markSeen(scene.cardId);
  }, [running, scene.cardId]);

  return (
    <div
      className={cn(
        "relative flex h-full flex-col overflow-hidden bg-gradient-to-b text-cream",
        BACKGROUNDS[chapter.order % BACKGROUNDS.length],
      )}
    >
      <SceneBackground scene={scene} running={running} />

      <div className={cn("relative px-3 pt-[max(0.75rem,env(safe-area-inset-top))]", closable && "pl-14")}>
        <SceneBars count={chapter.scenes.length} index={index} ms={sceneMs(scene)} playing={running} />
        <p className="mt-2 text-xs font-medium">
          Chapter {chapter.order + 1} of {total}
        </p>
      </div>

      <button
        type="button"
        onClick={() => setPaused((value) => !value)}
        aria-label={paused ? "Play" : "Pause"}
        className="relative flex min-h-0 flex-1 flex-col items-center justify-center gap-5 px-8 text-center"
      >
        {paused ? (
          <Pause className="size-16 opacity-80" aria-hidden />
        ) : (
          <span key={index} className="animate-in zoom-in-50 fade-in-0 text-7xl duration-500" aria-hidden>
            {scene.emoji}
          </span>
        )}
        <span
          key={`caption-${index}`}
          className="animate-in slide-in-from-bottom-3 fade-in-0 text-3xl leading-tight font-bold text-balance duration-500"
        >
          {scene.caption}
        </span>
        <SpokenLine
          key={`line-${index}`}
          text={scene.narration}
          charIndex={spoken?.narration === scene.narration ? spoken.charIndex : null}
        />
      </button>

      <div className="absolute right-3 bottom-36 flex flex-col items-end gap-3">
        <button
          type="button"
          onClick={onToggleMute}
          aria-label={muted ? "Turn sound on" : "Turn sound off"}
          className="rounded-full bg-ink/40 p-2.5"
        >
          {muted ? <VolumeX className="size-5" aria-hidden /> : <Volume2 className="size-5" aria-hidden />}
        </button>
        {card && <SourceSheet card={card} bank={bank} onOpenChange={onSourceOpenChange} />}
      </div>

      <div className="relative flex flex-col gap-2 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div className="min-w-0 pr-24">
          <p className="truncate font-semibold">{chapter.title}</p>
          <p className="flex items-center gap-1 text-xs">
            <BadgeCheck className="size-3.5 shrink-0" aria-hidden />
            <span className="truncate">
              From verified cards · {bank.title} · {bank.license}
              {bank.attribution && ` · ${bank.attribution}`}
            </span>
          </p>
          {scene.video && (
            <a href={scene.video.pageUrl} target="_blank" rel="noreferrer" className="block truncate text-xs underline">
              Video: {scene.video.credit} on Pixabay
            </a>
          )}
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onOpenChapters}
            className="flex h-11 flex-1 items-center justify-center gap-2 rounded-lg bg-cream/20 text-sm font-semibold"
          >
            <LayoutGrid className="size-4" aria-hidden />
            View all chapters
          </button>
          {hasQuiz && (
            <button
              type="button"
              onClick={onOpenQuiz}
              className="flex h-11 items-center justify-center gap-2 rounded-lg bg-sunflower px-3 text-sm font-semibold text-ink"
            >
              <GraduationCap className="size-4" aria-hidden />
              Test your knowledge
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
