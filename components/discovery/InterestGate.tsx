"use client";

import { Check } from "lucide-react";
import { useEffect, useState } from "react";
import {
  FILTERS_EVENT,
  notifyFiltersChanged,
  useBrowserValue,
} from "@/components/discovery/storage";
import { SUBJECT_META } from "@/components/discovery/subjects";
import { Button } from "@/components/ui/button";
import { getInterests, setInterests } from "@/lib/local";
import { SUBJECTS, type BankSummary, type Subject } from "@/lib/schemas";
import { cn } from "@/lib/utils";

/** Shows the interest picker until kb:interests is set, then renders the feed. */
export function InterestGate({ children }: { children: React.ReactNode }) {
  // undefined = not read yet (server render / hydration), so nothing flashes.
  const interests = useBrowserValue(getInterests, [FILTERS_EVENT]);

  if (interests === undefined) return null;
  if (interests === null) {
    return (
      <InterestPicker
        onDone={(picked) => {
          setInterests(picked);
          notifyFiltersChanged();
        }}
      />
    );
  }
  return <>{children}</>;
}

/** Bank count per subject from /api/banks. */
export function useSubjectCounts(): Partial<Record<Subject, number>> | undefined {
  const [counts, setCounts] = useState<Partial<Record<Subject, number>>>();
  useEffect(() => {
    fetch("/api/banks")
      .then((response) => (response.ok ? response.json() : []))
      .then((banks: BankSummary[]) => {
        const next: Partial<Record<Subject, number>> = {};
        for (const bank of banks) next[bank.subject] = (next[bank.subject] ?? 0) + 1;
        setCounts(next);
      })
      .catch(() => setCounts(undefined));
  }, []);
  return counts;
}

function InterestPicker({ onDone }: { onDone: (subjects: Subject[]) => void }) {
  const [picked, setPicked] = useState<Subject[]>([]);
  const counts = useSubjectCounts();

  const toggle = (subject: Subject) =>
    setPicked((current) =>
      current.includes(subject) ? current.filter((s) => s !== subject) : [...current, subject],
    );

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-y-auto p-5 pb-2">
        <h1 className="text-2xl font-semibold">What do you want to learn?</h1>
        <p className="mt-1 text-sm text-muted-foreground">Pick topics you like. You can change them later.</p>

        <div className="mt-5 grid grid-cols-2 gap-2.5">
          {SUBJECTS.map((subject) => {
            const { label, icon: Icon } = SUBJECT_META[subject];
            const on = picked.includes(subject);
            const count = counts?.[subject] ?? 0;
            return (
              <button
                key={subject}
                type="button"
                aria-pressed={on}
                onClick={() => toggle(subject)}
                className={cn(
                  "relative flex min-h-16 flex-row items-center gap-2 rounded-xl border-2 p-3 text-left transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                  on ? "border-olive-deep bg-cream" : "border-border bg-background hover:bg-muted",
                  counts && count === 0 && !on && "border-dashed opacity-70",
                )}
              >
                <Icon aria-hidden className="size-6 text-olive-deep" />
                <span className="font-medium">{label}</span>
                {on ? (
                  <Check
                    aria-hidden
                    className="absolute top-3 right-3 size-6 rounded-full bg-olive-deep p-1 text-paper"
                  />
                ) : (
                  count > 0 && (
                    <span className="absolute top-3 right-3 rounded-full bg-sunflower px-2 py-0.5 text-xs font-semibold text-ink">
                      {count}
                      <span className="sr-only"> {count === 1 ? "bank" : "banks"}</span>
                    </span>
                  )
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Actions stay in the thumb zone at the bottom. */}
      <div className="grid gap-1 border-t bg-background p-4">
        {picked.length === 0 ? (
          <p className="flex h-11 items-center justify-center text-sm text-muted-foreground">
            Pick at least one topic to start
          </p>
        ) : (
          <Button size="lg" className="h-11 text-base" onClick={() => onDone(picked)}>
            Start learning
          </Button>
        )}
        <Button variant="ghost" className="h-11" onClick={() => onDone([...SUBJECTS])}>
          Skip, show me everything
        </Button>
      </div>
    </div>
  );
}
