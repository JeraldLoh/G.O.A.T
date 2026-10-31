"use client";

import Link from "next/link";
import { History, Sprout, TreePine, Trophy } from "lucide-react";
import { StatsPanel } from "@/components/discovery/StatsPanel";
import { useBrowserValue } from "@/components/discovery/storage";
import { percentDone, useBankTally } from "@/lib/course";
import { useProgress } from "@/lib/local";
import { readHistory, type HistoryItem } from "@/components/explore/history";
import { formatUploadDate } from "@/components/upload/workspace";

export default function LearningPage() {
  const progress = useProgress();
  const history = useBrowserValue(readHistory, ["kb:history"]) ?? [];
  const count = progress.seen.length;
  const tier =
    count >= 25
      ? { title: "Knowledge explorer", icon: Trophy, goal: 50, color: "bg-sunflower" }
      : count >= 10
        ? { title: "Growing stronger", icon: TreePine, goal: 25, color: "bg-sage/40" }
        : { title: "Curiosity takes root", icon: Sprout, goal: 10, color: "bg-cream" };
  const Icon = tier.icon;

  return (
    <div className="h-full overflow-y-auto p-5">
      <h1 className="text-2xl font-semibold">My Learning</h1>
      <p className="mt-1 text-sm text-muted-foreground">Small discoveries. A growing you.</p>
      <section className={`relative mt-5 overflow-hidden rounded-3xl p-5 ${tier.color}`}>
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold tracking-wide uppercase">Your learning card</span>
          <Icon className="size-10 text-olive-deep" aria-hidden />
        </div>
        <h2 className="mt-3 text-xl font-semibold">{tier.title}</h2>
        <p className="mt-1 text-sm">
          {count === 0 ? "Your first discovery is waiting." : `${count} cards explored. Look how far you’ve come.`}
        </p>
        <p className="mt-5 text-xs font-medium">
          {count >= 50 ? "You’ve earned your explorer card. Keep discovering!" : `${tier.goal - count} more cards until your next milestone`}
        </p>
        <progress
          aria-label="Cards read toward next milestone"
          value={Math.min(count, tier.goal)}
          max={tier.goal}
          className="mt-2 h-2 w-full accent-olive-deep"
        />
        <p className="mt-2 text-[11px] text-olive-deep">Seedling 0 · Growing 10 · Explorer 25 · 50-card milestone</p>
      </section>

      <section className="mt-6">
        <h2 className="flex items-center gap-2 font-semibold">
          <History className="size-4" aria-hidden />
          Recently viewed
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">Your learning trail, newest first. Tap to pick up where you left off.</p>
        {history.length === 0 && (
          <div className="mt-3 rounded-2xl border border-dashed p-4">
            <p className="text-sm text-muted-foreground">Every discovery starts somewhere. Open a learning bank and it will appear here.</p>
            <Link href="/" className="mt-3 inline-flex min-h-11 items-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground">
              Find something to learn →
            </Link>
          </div>
        )}
        {history.map((item) => (
          <HistoryCard key={item.bankId} item={item} />
        ))}
      </section>

      <details className="mt-6 rounded-2xl border">
        <summary className="cursor-pointer p-4 text-sm font-semibold">Community stats & learning costs</summary>
        <div className="h-[560px] max-h-[70dvh]">
          <StatsPanel />
        </div>
      </details>
      <p className="mt-4 text-xs text-muted-foreground">Your reading progress stays on this device.</p>
    </div>
  );
}

function HistoryCard({ item }: { item: HistoryItem }) {
  const tallyForBank = useBankTally(item.bankId);
  const percent = tallyForBank ? percentDone(tallyForBank) : null;
  const unfinished = tallyForBank ? !tallyForBank.complete : true;
  return (
    <Link href={`/learn/${encodeURIComponent(item.bankId)}`} className="mt-3 block rounded-2xl border p-4">
      <p className="font-semibold">{item.title}</p>
      <p className="mt-1 text-xs capitalize text-muted-foreground">{item.subject}</p>
      {percent !== null && (
        <div className="mt-3">
          <div className="h-1.5 overflow-hidden rounded-full bg-khaki/40" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}>
            <div className="h-full rounded-full bg-olive" style={{ width: `${percent}%` }} />
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">
            {tallyForBank?.complete ? "Completed" : `${percent}% · ${tallyForBank?.done}/${tallyForBank?.total} items`}
          </p>
        </div>
      )}
      <p className="mt-2 text-xs text-muted-foreground">
        Last viewed {formatUploadDate(item.viewedAt)}
        {item.visits && item.visits > 1 ? ` · opened ${item.visits} times` : ""}
      </p>
      <span className="mt-3 inline-block text-sm font-semibold text-olive-deep">
        {unfinished ? "Continue learning →" : "Review again →"}
      </span>
    </Link>
  );
}
