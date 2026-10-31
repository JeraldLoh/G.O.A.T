"use client";

import { SlidersHorizontal } from "lucide-react";
import { useEffect, useState } from "react";
import { BottomSheet } from "@/components/discovery/BottomSheet";
import { LEVEL_ICON, OptionChip, SummaryChip } from "@/components/discovery/Chip";
import { useSubjectCounts } from "@/components/discovery/InterestGate";
import {
  FILTERS_EVENT,
  notifyFiltersChanged,
  useBrowserValue,
} from "@/components/discovery/storage";
import { LEVEL_LABEL, SUBJECT_META } from "@/components/discovery/subjects";
import { Button } from "@/components/ui/button";
import { getFilters, getInterests, setFilters, setInterests } from "@/lib/local";
import {
  LEVELS,
  SUBJECTS,
  type BankSummary,
  type Level,
  type LocalFilters,
  type Subject,
} from "@/lib/schemas";

/** Filter row above the feed: topics (kb:interests), level and tags (kb:filters). Changes apply immediately. */
export function FilterBar() {
  const [open, setOpen] = useState(false);
  const subjects = useBrowserValue(getInterests, [FILTERS_EVENT]) ?? [...SUBJECTS];
  const filters = useBrowserValue(getFilters, [FILTERS_EVENT]) ?? { tags: [], level: null };
  const [banks, setBanks] = useState<BankSummary[]>([]);
  const counts = useSubjectCounts();

  // Refresh the tag list each time the sheet opens, so new uploads show up.
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
          onClick={() => setOpen(true)}
          aria-label="Open filters"
          className="h-9 shrink-0 rounded-full px-3.5"
        >
          <SlidersHorizontal aria-hidden />
          Filters
        </Button>
        <SummaryChip onClick={() => setOpen(true)}>{subjectSummary}</SummaryChip>
        {filters.level && (
          <SummaryChip onRemove={() => setLevel(null)}>{LEVEL_LABEL[filters.level]}</SummaryChip>
        )}
        {filters.tags.map((tag) => (
          <SummaryChip key={tag} onRemove={() => toggleTag(tag)}>
            {`#${tag}`}
          </SummaryChip>
        ))}
      </div>

      <BottomSheet open={open} onOpenChange={setOpen} title="Filter your feed">
        <section className="grid gap-2">
          <h3 className="text-sm font-semibold">Topics</h3>
          <div className="flex flex-wrap gap-2">
            {SUBJECTS.map((subject) => {
              const { label, icon } = SUBJECT_META[subject];
              return (
                <OptionChip
                  key={subject}
                  icon={icon}
                  selected={subjects.includes(subject)}
                  muted={counts !== undefined && !counts[subject]}
                  onClick={() => toggleSubject(subject)}
                >
                  {label}
                </OptionChip>
              );
            })}
          </div>
        </section>

        <section className="grid gap-2">
          <h3 className="text-sm font-semibold">Level</h3>
          <div className="flex flex-wrap gap-2">
            <OptionChip selected={filters.level === null} onClick={() => setLevel(null)}>
              Any
            </OptionChip>
            {LEVELS.map((level) => (
              <OptionChip
                key={level}
                icon={LEVEL_ICON[level]}
                selected={filters.level === level}
                onClick={() => setLevel(level)}
              >
                {LEVEL_LABEL[level]}
              </OptionChip>
            ))}
          </div>
        </section>

        {tags.length > 0 && (
          <section className="grid gap-2">
            <h3 className="text-sm font-semibold">Tags</h3>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <OptionChip key={tag} selected={filters.tags.includes(tag)} onClick={() => toggleTag(tag)}>
                  #{tag}
                </OptionChip>
              ))}
            </div>
          </section>
        )}

        <div className="flex gap-2">
          {active && (
            <Button
              variant="outline"
              className="h-11 flex-1"
              onClick={() => {
                updateSubjects([...SUBJECTS]);
                updateFilters({ tags: [], level: null });
              }}
            >
              Clear all
            </Button>
          )}
          <Button className="h-11 flex-1" onClick={() => setOpen(false)}>
            Show results
          </Button>
        </div>
      </BottomSheet>
    </>
  );
}
