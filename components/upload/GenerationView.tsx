"use client";

import { CircleAlert, CircleCheck, LoaderCircle, ShieldCheck, Sparkles } from "lucide-react";
import Link from "next/link";
import { formatPct, formatSeconds, formatUsd } from "@/components/discovery/format";
import { Button, buttonVariants } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  MOCK_MODEL,
  type BankSummary,
  type Card,
  type Generation,
  type Quiz,
} from "@/lib/schemas";
import { cn } from "@/lib/utils";

export type GenerationState = {
  title: string;
  status: "streaming" | "done" | "error";
  bank: BankSummary | null;
  progress: { message: string; done: number; total: number } | null;
  cards: Card[];
  quizzes: Quiz[];
  generation: Generation | null;
  error: string | null;
};

/** Live view of POST /api/banks: progress, cards as they arrive, then the measured cost. */
export function GenerationView({
  state,
  onReset,
}: {
  state: GenerationState;
  onReset: () => void;
}) {
  const { status, progress, cards, quizzes, generation, error } = state;
  const percent = progress && progress.total > 0 ? (progress.done / progress.total) * 100 : null;

  return (
    <div className="grid gap-4">
      <header className="grid gap-1">
        <p className="flex items-center gap-1.5 text-sm font-medium text-olive-deep">
          {status === "streaming" && <LoaderCircle aria-hidden className="size-4 animate-spin" />}
          {status === "done" && <CircleCheck aria-hidden className="size-4" />}
          {status === "error" && <CircleAlert aria-hidden className="size-4 text-destructive" />}
          {status === "streaming" ? "Generating" : status === "done" ? "Ready" : "Stopped"}
        </p>
        <h1 className="text-xl font-semibold">{state.bank?.title ?? state.title}</h1>
      </header>

      {status === "streaming" && (
        <div className="grid gap-1.5" aria-live="polite">
          <Progress value={percent} aria-label="Generation progress" />
          <p className="text-xs text-muted-foreground">
            {progress?.message ?? "Reading your text…"}
            {progress && progress.total > 0 && ` (${progress.done}/${progress.total})`}
          </p>
        </div>
      )}

      {error && (
        <div role="alert" className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {generation && <GenerationSummary generation={generation} />}

      {status !== "streaming" && (
        <div className="flex gap-2">
          {status === "done" && (
            <Link href="/" className={cn(buttonVariants({ size: "lg" }), "h-11 flex-1")}>
              Open in feed
            </Link>
          )}
          <Button variant="outline" size="lg" className="h-11 flex-1" onClick={onReset}>
            {status === "done" ? "Upload another" : "Back to the form"}
          </Button>
        </div>
      )}

      {(cards.length > 0 || quizzes.length > 0) && (
        <section className="grid gap-2">
          <h2 className="text-sm font-medium">
            {cards.length} card{cards.length === 1 ? "" : "s"} · {quizzes.length} quiz question
            {quizzes.length === 1 ? "" : "s"}
          </h2>
          <ol className="grid gap-2">
            {cards.map((card) => (
              <li
                key={card.id}
                className="animate-in fade-in-0 slide-in-from-bottom-2 rounded-xl bg-card p-3 text-card-foreground duration-300"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-xs text-muted-foreground">{card.topic}</span>
                  {card.verified && (
                    <span className="flex shrink-0 items-center gap-1 rounded-full bg-sunflower px-2 py-0.5 text-[11px] font-medium text-ink">
                      <ShieldCheck aria-hidden className="size-3" />
                      Quote verified
                    </span>
                  )}
                </div>
                <p className="mt-1 font-medium">{card.title}</p>
                <p className="mt-0.5 line-clamp-2 text-sm">{card.body}</p>
              </li>
            ))}
          </ol>
        </section>
      )}
    </div>
  );
}

function GenerationSummary({ generation }: { generation: Generation }) {
  const mock = generation.model === MOCK_MODEL;
  const verifiedPct =
    generation.cardsTotal === 0 ? null : (generation.cardsVerified / generation.cardsTotal) * 100;

  return (
    <section className="grid gap-3 rounded-xl border-2 border-sunflower bg-background p-4">
      <p className="flex items-center gap-1.5 text-sm font-medium">
        <Sparkles aria-hidden className="size-4 text-olive-deep" />
        {mock ? (
          "Made with the offline mock generator, so there's no cost to report."
        ) : (
          <span>
            Generation cost: <strong>{formatUsd(generation.costUsd)}</strong>, served to unlimited
            learners for $0.
          </span>
        )}
      </p>
      <dl className="grid grid-cols-3 gap-2 text-center">
        <Metric label="Time" value={formatSeconds(generation.durationMs)} />
        <Metric
          label="Quotes verified"
          value={verifiedPct === null ? "—" : formatPct(verifiedPct)}
          detail={`${generation.cardsVerified}/${generation.cardsTotal}`}
        />
        <Metric
          label="Tokens"
          value={(generation.inputTokens + generation.outputTokens).toLocaleString()}
        />
      </dl>
    </section>
  );
}

function Metric({ label, value, detail }: { label: string; value: string; detail?: string }) {
  return (
    <div className="rounded-lg bg-muted p-2">
      <dt className="text-[11px] text-muted-foreground">{label}</dt>
      <dd className="text-base font-semibold tabular-nums">{value}</dd>
      {detail && <dd className="text-[11px] text-muted-foreground tabular-nums">{detail}</dd>}
    </div>
  );
}
