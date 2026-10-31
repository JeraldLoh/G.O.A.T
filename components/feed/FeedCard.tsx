"use client";

import { ArrowRight, BadgeCheck } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { CardActions } from "@/components/discovery/CardActions";
import { BankProgress } from "@/components/feed/BankProgress";
import { SourceSheet } from "@/components/feed/SourceSheet";
import { markSeen } from "@/lib/local";
import type { BankSummary, Card } from "@/lib/schemas";

/** Share of the card that must be on screen before it counts as read. */
const SEEN_RATIO = 0.6;

// Lane B1. One content card in the swipe feed.
export function FeedCard({
  card,
  bank,
  showProgress = true,
}: {
  card: Card;
  bank: BankSummary;
  /** Per-bank progress bar. Off in the shuffled Fun facts feed, where banks are mixed. */
  showProgress?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          markSeen(card.id);
          observer.disconnect();
        }
      },
      { threshold: SEEN_RATIO },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [card.id]);

  return (
    <div ref={ref} className="flex h-full flex-col gap-4 p-5">
      {showProgress && <BankProgress bank={bank} />}

      <article className="flex min-h-0 flex-1 flex-col justify-center gap-3 overflow-y-auto">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-sage/50 px-2.5 py-0.5 text-xs font-semibold">
            {card.topic}
          </span>
          {card.verified && (
            <span className="inline-flex items-center gap-1 rounded-full bg-sunflower px-2.5 py-0.5 text-xs font-semibold text-ink">
              <BadgeCheck className="size-3.5" aria-hidden />
              Quote verified
            </span>
          )}
        </div>
        <h2 className="text-2xl leading-tight font-semibold text-balance break-words">
          {card.title}
        </h2>
        <p className="text-base leading-relaxed">{card.body}</p>
        <blockquote className="rounded-r-lg border-l-4 border-terracotta bg-peach/40 p-3 text-sm leading-relaxed italic">
          “{card.quote}”
        </blockquote>
      </article>

      <footer className="flex flex-col gap-3">
        {/* The video (and its quiz) for this fact: the same bank, opened at this card topic. */}
        <Link
          href={`/learn/${encodeURIComponent(bank.id)}?topic=${encodeURIComponent(card.topic)}`}
          className="press flex min-h-12 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-base font-semibold text-primary-foreground"
        >
          Learn more
          <ArrowRight className="size-5" aria-hidden />
        </Link>
        <div className="flex items-center gap-2">
          <SourceSheet card={card} bank={bank} />
          <div className="ml-auto">
            <CardActions card={card} bank={bank} />
          </div>
        </div>
        <p className="text-xs leading-snug text-muted-foreground">
          <span className="font-medium">{bank.title}</span>
          {" · "}
          <span className="rounded bg-brown/25 px-1 py-px font-medium">
            {bank.license}
          </span>
          {bank.attribution && ` · ${bank.attribution}`}
          {bank.origin === "ai-seeded" && " · AI-seeded"}
        </p>
      </footer>
    </div>
  );
}
