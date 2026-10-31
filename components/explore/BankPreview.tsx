"use client";

import { ArrowDown, ArrowUpRight, BookOpen, Check, Layers, ListChecks } from "lucide-react";
import Link from "next/link";
import { SUBJECT_META, LEVEL_LABEL } from "@/components/discovery/subjects";
import { isEntryDone, type BankGroup } from "@/components/explore/content";
import { useProgress } from "@/lib/local";
import { cn } from "@/lib/utils";

export function BankPreview({ group, index, total }: { group: BankGroup; index: number; total: number }) {
  const { bank, entries } = group;
  const progress = useProgress();
  const done = entries.filter((entry) => isEntryDone(entry, progress)).length;
  const complete = done === entries.length;
  const cards = entries.flatMap((entry) => entry.kind === "card" ? [entry.card] : []);
  const topics = [...new Set(cards.map((card) => card.topic))];
  const quizCount = entries.length - cards.length;
  const { icon: Icon, label } = SUBJECT_META[bank.subject];

  return (
    <article className="flex min-h-full flex-col gap-3 p-4">
      <div className={cn("relative flex h-[clamp(96px,16dvh,150px)] shrink-0 items-center justify-center overflow-hidden rounded-3xl bg-cream", index % 3 === 1 && "bg-peach/60", index % 3 === 2 && "bg-sage/40")}>
        <div aria-hidden className="absolute -top-16 -right-8 size-56 rounded-full border-[30px] border-paper/40" />
        <div aria-hidden className="absolute -bottom-16 -left-10 size-48 rounded-full bg-sunflower/60" />
        <span className="absolute top-3 left-3 rounded-full bg-paper/90 px-3 py-1 text-[11px] font-semibold text-olive-deep">{label}</span>
        <span className="relative flex size-24 -rotate-12 items-center justify-center rounded-3xl border border-paper/60 bg-paper/70 shadow-sm"><Icon className="size-12 text-olive-deep" strokeWidth={1.4} aria-hidden /></span>
        <span className="absolute right-3 bottom-3 text-[10px] font-medium text-olive-deep">Subject illustration</span>
      </div>
      <div className="flex items-center justify-between gap-3 text-[11px] font-semibold text-olive-deep">
        <span className="capitalize">{LEVEL_LABEL[bank.level]} · {topics.length} {topics.length === 1 ? "topic" : "topics"}</span>
        <span className="tabular-nums">{String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}</span>
      </div>
      <div>
        <h2 className="text-[clamp(23px,3.5dvh,30px)] leading-[1.1] font-semibold tracking-tight text-balance break-words">{bank.title}</h2>
        <p className="mt-3 text-[10px] font-bold tracking-widest text-olive-deep uppercase">Lesson excerpt</p>
        <p className="mt-1 line-clamp-2 text-sm leading-relaxed">{cards[0]?.body}</p>
      </div>
      <div className="rounded-2xl border border-khaki/50 bg-linen/50 p-3">
        <p className="flex items-center gap-1.5 text-xs font-semibold"><BookOpen className="size-3.5" aria-hidden />What’s inside</p>
        <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">{topics.join(" · ")}</p>
        <div className="mt-2 flex flex-wrap gap-3 text-[11px] text-olive-deep">
          <span className="inline-flex items-center gap-1"><Layers className="size-3" aria-hidden />{cards.length} cards</span>
          <span className="inline-flex items-center gap-1"><ListChecks className="size-3" aria-hidden />{quizCount} {quizCount === 1 ? "quiz" : "quizzes"}</span>
          {done > 0 && <span className="inline-flex items-center gap-1 font-semibold"><Check className="size-3" aria-hidden />{complete ? "Completed" : `${done}/${entries.length} done`}</span>}
        </div>
      </div>
      <div className="mt-auto flex flex-col gap-2.5">
        <Link href={`/learn/${encodeURIComponent(bank.id)}`} scroll={false} className="press flex min-h-12 items-center justify-between rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
          {complete ? "Review this bank" : done > 0 ? "Continue learning" : "Learn more"}<ArrowUpRight className="size-5" aria-hidden />
        </Link>
        <p className="truncate text-[10px] text-muted-foreground" title={`${bank.license} · ${bank.attribution}`}>{bank.license} · {bank.attribution || "Community contributed"}</p>
        <p className="flex items-center justify-center gap-1 text-[10px] text-olive-deep"><ArrowDown className="size-3" aria-hidden />Swipe up to discover more</p>
      </div>
    </article>
  );
}
