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

/** Subject picker. Also used by FilterBar to change interests later. */
export function SubjectGrid({
  selected,
  onToggle,
  counts,
}: {
  selected: Subject[];
  onToggle: (subject: Subject) => void;
  counts?: Partial<Record<Subject, number>>;
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {SUBJECTS.map((subject) => {
        const { label, icon: Icon } = SUBJECT_META[subject];
        const on = selected.includes(subject);
        const count = counts?.[subject] ?? 0;
        return (
          <button
            key={subject}
            type="button"
            aria-pressed={on}
            onClick={() => onToggle(subject)}
            className={cn(
              "relative flex flex-col items-start gap-2 rounded-xl border-2 p-3 text-left transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
              on
                ? "border-olive-deep bg-cream"
                : "border-border bg-background hover:bg-muted",
            )}
          >
            <Icon aria-hidden className="size-5 text-olive-deep" />
            <span className="font-medium">{label}</span>
            {counts && (
              <span className="text-xs text-muted-foreground">
                {count === 0 ? "No banks yet" : `${count} bank${count === 1 ? "" : "s"}`}
              </span>
            )}
            {on && (
              <Check
                aria-hidden
                className="absolute top-2 right-2 size-5 rounded-full bg-olive-deep p-0.5 text-paper"
              />
            )}
          </button>
        );
      })}
    </div>
  );
}

/** Bank count per subject from /api/banks, for the picker hints. */
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
    <div className="flex h-full flex-col overflow-y-auto p-6">
      <p className="text-sm font-medium text-olive-deep">Welcome</p>
      <h1 className="mt-1 text-2xl font-semibold">What do you want to learn?</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Pick a few topics. Your feed shows short cards and quizzes from free, openly licensed
        material. You can change this any time.
      </p>
      <div className="mt-6">
        <SubjectGrid selected={picked} onToggle={toggle} counts={counts} />
      </div>
      <div className="mt-auto flex flex-col gap-2 pt-6">
        <Button size="lg" className="h-11" disabled={picked.length === 0} onClick={() => onDone(picked)}>
          {picked.length === 0 ? "Pick at least one topic" : `Start learning (${picked.length})`}
        </Button>
        <Button variant="ghost" onClick={() => onDone([...SUBJECTS])}>
          Skip, show me everything
        </Button>
      </div>
    </div>
  );
}
