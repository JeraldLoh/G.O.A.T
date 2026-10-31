"use client";

import { ArrowRight, Play } from "lucide-react";
import { useState } from "react";
import { QuizCard } from "@/components/feed/QuizCard";
import { useProgress } from "@/lib/local";
import type { BankSummary, Quiz } from "@/lib/schemas";

/**
 * A chapter's quiz inside the video's "Test your knowledge" sheet: one question
 * at a time with "Question 1 of 2", then Next question, and Back to video on the last.
 */
export function ChapterQuiz({
  quizzes,
  bank,
  onDone,
}: {
  quizzes: Quiz[];
  bank: BankSummary;
  /** Closes the sheet so the video carries on. */
  onDone: () => void;
}) {
  const [index, setIndex] = useState(0);
  const progress = useProgress();
  const quiz = quizzes[index];
  if (!quiz)
    return (
      <p className="text-sm text-muted-foreground">
        No questions for this chapter yet.
      </p>
    );

  const last = index === quizzes.length - 1;
  const answered = quiz.id in progress.quiz;
  const correct = quizzes.filter((q) => progress.quiz[q.id]).length;

  return (
    <div className="flex flex-col gap-3">
      <p
        className="flex items-center justify-between text-sm font-semibold text-olive-deep"
        aria-live="polite"
      >
        <span>
          Question {index + 1} of {quizzes.length}
        </span>
        {last && answered && (
          <span className="font-medium text-muted-foreground">
            {correct} of {quizzes.length} correct
          </span>
        )}
      </p>
      <div className="min-h-[22rem]">
        {/* Keyed so moving to the next question clears the previous pick. */}
        <QuizCard key={quiz.id} quiz={quiz} bank={bank} showProgress={false} />
      </div>
      {last ? (
        <button
          type="button"
          onClick={onDone}
          className="press flex min-h-12 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-base font-semibold text-primary-foreground"
        >
          <Play className="size-4" aria-hidden />
          Back to video
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setIndex((i) => i + 1)}
          className={
            answered
              ? "press flex min-h-12 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-base font-semibold text-primary-foreground"
              : "press flex min-h-12 items-center justify-center gap-2 rounded-xl border border-khaki px-4 text-base font-semibold text-olive-deep"
          }
        >
          {answered ? "Next question" : "Skip question"}
          <ArrowRight className="size-4" aria-hidden />
        </button>
      )}
    </div>
  );
}
