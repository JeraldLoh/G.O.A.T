"use client";

import { SlidersHorizontal, X } from "lucide-react";
import { useEffect, useState } from "react";
import { SubjectGrid, useSubjectCounts } from "@/components/discovery/InterestGate";
import {
  FILTERS_EVENT,
  notifyFiltersChanged,
  useBrowserValue,
} from "@/components/discovery/storage";
import { LEVEL_LABEL, SUBJECT_META } from "@/components/discovery/subjects";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getFilters, getInterests, setFilters, setInterests } from "@/lib/local";
import {
  LEVELS,
  SUBJECTS,
  type BankSummary,
  type Level,
  type LocalFilters,
  type Subject,
} from "@/lib/schemas";
import { cn } from "@/lib/utils";

/** Filter row above the feed: topics (kb:interests), level and tags (kb:filters). Changes apply immediately. */
export function FilterBar() {
  const [open, setOpen] = useState(false);
  const subjects = useBrowserValue(getInterests, [FILTERS_EVENT]) ?? [...SUBJECTS];
  const filters = useBrowserValue(getFilters, [FILTERS_EVENT]) ?? { tags: [], level: null };
  const [banks, setBanks] = useState<BankSummary[]>([]);
  const counts = useSubjectCounts();

  // Refresh the tag list each time the dialog opens, so new uploads show up.
  useEffect(() => {
    if (!open) return;
    fetch("/api/banks")
      .then((response) => (response.ok ? response.json() : []))
      .then(setBanks)
      .catch(() => setBanks([]));
  }, [open]);

  const tagSet = new Set<string>(filters.tags); // selected tags stay visible
  for (const bank of banks) {
    if (subjects.includes(bank.subject)) bank.tags.forEach((tag) => tagSet.add(tag));
  }
  const tags = [...tagSet].sort();

  function updateSubjects(next: Subject[]) {
    if (next.length === 0) return; // at least one topic, or the feed is always empty
    setInterests(next);
    notifyFiltersChanged();
  }

  function updateFilters(next: LocalFilters) {
    setFilters(next);
    notifyFiltersChanged();
  }

  const toggleSubject = (subject: Subject) =>
    updateSubjects(
      subjects.includes(subject) ? subjects.filter((s) => s !== subject) : [...subjects, subject],
    );
  const toggleTag = (tag: string) =>
    updateFilters({
      ...filters,
      tags: filters.tags.includes(tag) ? filters.tags.filter((t) => t !== tag) : [...filters.tags, tag],
    });
  const setLevel = (level: Level | null) => updateFilters({ ...filters, level });

  const allSubjects = subjects.length === SUBJECTS.length;
  const subjectSummary = allSubjects
    ? "All topics"
    : subjects.length === 1
      ? SUBJECT_META[subjects[0]].label
      : `${SUBJECT_META[subjects[0]].label} +${subjects.length - 1}`;
  const active = !allSubjects || filters.level !== null || filters.tags.length > 0;

  return (
    <>
      <div className="flex items-center gap-2 overflow-x-auto border-b px-3 py-2 [scrollbar-width:none]">
        <Button
          variant={active ? "default" : "outline"}
          size="sm"
          onClick={() => setOpen(true)}
          aria-label="Open filters"
        >
          <SlidersHorizontal aria-hidden />
          Filters
        </Button>
        <Chip onClick={() => setOpen(true)}>{subjectSummary}</Chip>
        {filters.level && (
          <Chip onRemove={() => setLevel(null)}>{LEVEL_LABEL[filters.level]}</Chip>
        )}
        {filters.tags.map((tag) => (
          <Chip key={tag} onRemove={() => toggleTag(tag)}>
            {`#${tag}`}
          </Chip>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Filter your feed</DialogTitle>
            <DialogDescription>Changes apply right away.</DialogDescription>
          </DialogHeader>

          <section className="grid gap-2">
            <h3 className="text-sm font-medium">Topics</h3>
            <SubjectGrid selected={subjects} onToggle={toggleSubject} counts={counts} />
          </section>

          <section className="grid gap-2">
            <h3 className="text-sm font-medium">Level</h3>
            <div className="flex flex-wrap gap-2">
              <Toggle on={filters.level === null} onClick={() => setLevel(null)}>
                Any
              </Toggle>
              {LEVELS.map((level) => (
                <Toggle key={level} on={filters.level === level} onClick={() => setLevel(level)}>
                  {LEVEL_LABEL[level]}
                </Toggle>
              ))}
            </div>
          </section>

          <section className="grid gap-2">
            <h3 className="text-sm font-medium">Tags</h3>
            {tags.length === 0 ? (
              <p className="text-sm text-muted-foreground">No tags in these topics yet.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <Toggle key={tag} on={filters.tags.includes(tag)} onClick={() => toggleTag(tag)}>
                    #{tag}
                  </Toggle>
                ))}
              </div>
            )}
          </section>

          {active && (
            <Button
              variant="ghost"
              onClick={() => {
                updateSubjects([...SUBJECTS]);
                updateFilters({ tags: [], level: null });
              }}
            >
              Clear all filters
            </Button>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

function Chip({
  children,
  onClick,
  onRemove,
}: {
  children: string;
  onClick?: () => void;
  onRemove?: () => void;
}) {
  return (
    <span className="flex shrink-0 items-center rounded-full bg-muted text-xs font-medium">
      <button type="button" className="py-1 pl-3 pr-3 has-[+button]:pr-1" onClick={onClick}>
        {children}
      </button>
      {onRemove && (
        <button
          type="button"
          aria-label={`Remove ${children}`}
          onClick={onRemove}
          className="rounded-full py-1 pr-2 pl-1 hover:text-destructive"
        >
          <X aria-hidden className="size-3" />
        </button>
      )}
    </span>
  );
}

function Toggle({
  on,
  onClick,
  children,
}: {
  on: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1.5 text-sm transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
        on ? "border-olive-deep bg-olive-deep text-paper" : "border-border bg-background hover:bg-muted",
      )}
    >
      {children}
    </button>
  );
}
