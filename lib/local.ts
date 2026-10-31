// localStorage helpers (Lane B owns this; others import). Browser-only callers:
// reads return the default during server render.
// Every write fires a window event named after its key (e.g. "kb:progress"), so
// components on the same page can re-read without a reload.
import { useSyncExternalStore } from "react";
import { z } from "zod";
import {
  LocalFiltersSchema,
  LocalProgressSchema,
  SubjectSchema,
  type LocalFilters,
  type LocalProgress,
  type Subject,
} from "@/lib/schemas";

const KEYS = {
  interests: "kb:interests",
  filters: "kb:filters",
  progress: "kb:progress",
  device: "kb:device",
} as const;

function read<T>(key: string, schema: z.ZodType<T>, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const parsed = schema.safeParse(JSON.parse(localStorage.getItem(key) ?? "null"));
    return parsed.success ? parsed.data : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown): void {
  localStorage.setItem(key, JSON.stringify(value));
  window.dispatchEvent(new Event(key));
}

/** Calls onChange after any write to `key`, in this tab or another one. Returns the unsubscribe. */
export function onLocalChange(key: string, onChange: () => void): () => void {
  const onStorage = (event: StorageEvent) => {
    if (event.key === key) onChange();
  };
  window.addEventListener(key, onChange);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(key, onChange);
    window.removeEventListener("storage", onStorage);
  };
}

/** null means the user hasn't picked yet, so InterestGate should show the picker. */
export function getInterests(): Subject[] | null {
  return read(KEYS.interests, z.array(SubjectSchema).nullable(), null);
}

export function setInterests(subjects: Subject[]): void {
  write(KEYS.interests, subjects);
}

export function getFilters(): LocalFilters {
  return read(KEYS.filters, LocalFiltersSchema, { tags: [], level: null });
}

export function setFilters(filters: LocalFilters): void {
  write(KEYS.filters, filters);
}

export function getProgress(): LocalProgress {
  return read(KEYS.progress, LocalProgressSchema, { seen: [], quiz: {} });
}

export function markSeen(cardId: string): void {
  const progress = getProgress();
  if (progress.seen.includes(cardId)) return;
  write(KEYS.progress, { ...progress, seen: [...progress.seen, cardId] });
}

export function recordQuiz(quizId: string, correct: boolean): void {
  const progress = getProgress();
  write(KEYS.progress, { ...progress, quiz: { ...progress.quiz, [quizId]: correct } });
}

export function resetProgress(): void {
  write(KEYS.progress, { seen: [], quiz: {} });
}

const EMPTY_PROGRESS: LocalProgress = { seen: [], quiz: {} };
// useSyncExternalStore needs the same object back until the data changes,
// so the parsed value is cached against the raw string.
let progressCache: { raw: string | null; value: LocalProgress } = {
  raw: null,
  value: EMPTY_PROGRESS,
};

function progressSnapshot(): LocalProgress {
  const raw = localStorage.getItem(KEYS.progress);
  if (raw !== progressCache.raw) progressCache = { raw, value: getProgress() };
  return progressCache.value;
}

/** Live kb:progress: re-renders whenever markSeen, recordQuiz or resetProgress runs. */
export function useProgress(): LocalProgress {
  return useSyncExternalStore(
    (onChange) => onLocalChange(KEYS.progress, onChange),
    progressSnapshot,
    () => EMPTY_PROGRESS,
  );
}

export function getDeviceId(): string {
  const existing = localStorage.getItem(KEYS.device);
  if (existing) return existing;
  const id = crypto.randomUUID();
  localStorage.setItem(KEYS.device, id);
  return id;
}
