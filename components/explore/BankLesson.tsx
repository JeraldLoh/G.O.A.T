"use client";

import { ArrowLeft, ArrowRight, PartyPopper } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { recordVisit } from "@/components/explore/history";
import { RatingButtons } from "@/components/discovery/RatingButtons";
import { entryId, isEntryDone, lessonEntries } from "@/components/explore/content";
import { BankProgress } from "@/components/feed/BankProgress";
import { FeedItem } from "@/components/feed/FeedItem";
import { BackLink } from "@/components/shell/BackLink";
import { useBank, type BankDetail } from "@/lib/course";
import { getProgress, useProgress } from "@/lib/local";

export function BankLesson({ bankId }: { bankId: string }) {
  const { detail, failed } = useBank(bankId);
  if (!detail) return (
    <div className="flex h-full flex-col">
      <div className="px-4 pt-3"><BackLink /></div>
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center" role="status">
        <h1 className="text-xl font-semibold">{failed ? "This learning bank is unavailable" : "Opening your learning bank…"}</h1>
        {failed && (
          <>
            <p className="text-sm text-muted-foreground">It may have been removed, or your connection was interrupted.</p>
            <button type="button" onClick={() => window.location.reload()} className="min-h-11 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground">Try again</button>
          </>
        )}
      </div>
    </div>
  );
  return <LessonReader key={bankId} detail={detail} />;
}

function LessonReader({ detail }: { detail: BankDetail }) {
  useEffect(() => { recordVisit(detail.summary); }, [detail.summary]);
  const entries = lessonEntries(detail);
  const [index, setIndex] = useState(() => {
    const firstUnfinished = entries.findIndex((entry) => !isEntryDone(entry, getProgress()));
    return firstUnfinished < 0 ? 0 : firstUnfinished;
  });
  const progress = useProgress();
  const done = entries.filter((entry) => isEntryDone(entry, progress)).length;
  const entry = entries[index];
  const complete = entries.length > 0 && done === entries.length;
  const quizEntries = entries.filter((item) => item.kind === "quiz");
  const correct = quizEntries.filter((item) => item.kind === "quiz" && progress.quiz[item.quiz.id]).length;

  return <div className="flex h-full flex-col">
    <header className="flex shrink-0 items-center gap-3 border-b px-4 py-3">
      <BackLink />
      <div className="min-w-0 flex-1"><p className="text-[10px] font-bold tracking-widest text-olive-deep uppercase">Focused learning</p><h1 className="truncate text-sm font-semibold">{detail.bank.title}</h1></div>
      <span className="shrink-0 text-xs tabular-nums text-muted-foreground">{entry ? `${index + 1} / ${entries.length}` : "Recap"}</span>
    </header>
    <div key={entry ? entryId(entry) : "recap"} className="min-h-0 flex-1 overflow-y-auto" aria-live="polite">
      {entry ? <FeedItem entry={entry} /> : <div className="flex min-h-full flex-col gap-5 p-5">
        <BankProgress bank={detail.summary} />
        <div className="flex flex-1 flex-col items-center justify-center gap-4 py-6 text-center">
          <span className="flex size-20 items-center justify-center rounded-full bg-sunflower"><PartyPopper className="size-9" aria-hidden /></span>
          <h2 className="text-2xl font-semibold">{complete ? "Bank complete!" : entries.length === 0 ? "No lessons available yet" : "Keep your curiosity going"}</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">{entries.length === 0 ? "This bank has no published, verified cards yet." : `${done} of ${entries.length} items completed · ${correct} of ${quizEntries.length} quiz answers correct.`}</p>
          {!complete && entries.length > 0 && <button type="button" onClick={() => setIndex(entries.findIndex((item) => !isEntryDone(item, progress)))} className="min-h-11 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground">Continue unfinished learning</button>}
          <Link href="/" scroll={false} className="inline-flex min-h-11 items-center gap-2 font-semibold text-olive-deep">Discover another bank<ArrowRight className="size-4" aria-hidden /></Link>
          {entries.length > 0 && <RatingButtons bankId={detail.bank.id} />}
        </div>
      </div>}
    </div>
    {entries.length > 0 && <footer className="flex shrink-0 gap-3 border-t px-5 py-3">
      <button type="button" disabled={index === 0} onClick={() => setIndex((value) => value - 1)} className="inline-flex min-h-11 items-center gap-2 rounded-xl border px-4 text-sm font-semibold disabled:opacity-40"><ArrowLeft className="size-4" aria-hidden />Previous</button>
      {entry ? <button type="button" onClick={() => setIndex((value) => value + 1)} className="ml-auto inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground">{index === entries.length - 1 ? "See recap" : entries[index + 1].kind === "quiz" ? "Try the quiz" : "Next card"}<ArrowRight className="size-4" aria-hidden /></button> : <button type="button" onClick={() => setIndex(0)} className="ml-auto min-h-11 rounded-xl border px-4 text-sm font-semibold">Review from start</button>}
    </footer>}
  </div>;
}
