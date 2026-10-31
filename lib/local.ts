// localStorage helpers (Lane B owns this; others import). Browser-only callers:
// reads return the default during server render.
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

export function getDeviceId(): string {
  const existing = localStorage.getItem(KEYS.device);
  if (existing) return existing;
  const id = crypto.randomUUID();
  localStorage.setItem(KEYS.device, id);
  return id;
}
