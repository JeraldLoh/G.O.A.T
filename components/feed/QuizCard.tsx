"use client";

import { Check, X } from "lucide-react";
import { useState } from "react";
import { BankProgress } from "@/components/feed/BankProgress";
import { recordQuiz, useProgress } from "@/lib/local";
import type { BankSummary, Quiz } from "@/lib/schemas";
import { cn } from "@/lib/utils";

// Lane B2. Pick an answer, then it locks: ✓/✗ with words (never color alone) + explanation.
export function QuizCard({ quiz, bank }: { quiz: Quiz; bank: BankSummary }) {
  const progress = useProgress();
  const [picked, setPicked] = useState<number | null>(null);
  // A quiz answered earlier shows as answered, but we only know right/wrong, not which option.
  const earlier = quiz.id in progress.quiz ? progress.quiz[quiz.id] : null;
  const answered = picked !== null || earlier !== null;
  const correct = picked !== null ? picked === quiz.answerIndex : earlier;

  function choose(index: number) {
    if (answered) return;
    setPicked(index);
    recordQuiz(quiz.id, index === quiz.answerIndex);
  }

  return (
    <div className="flex h-full flex-col gap-4 p-5">
      <BankProgress bank={bank} />
      <div className="flex flex-1 flex-col justify-center gap-4">
        <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          Quiz · {quiz.topic}
        </p>
        <h2 className="text-xl leading-snug font-semibold text-balance">{quiz.question}</h2>
        <ul className="flex flex-col gap-2">
          {quiz.options.map((option, index) => {
            const isAnswer = index === quiz.answerIndex;
            const isPicked = index === picked;
            return (
              <li key={index}>
                <button
                  type="button"
                  onClick={() => choose(index)}
                  disabled={answered}
                  aria-pressed={isPicked}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl border-2 border-khaki bg-card px-4 py-3 text-left transition-colors",
                    "focus-visible:ring-3 focus-visible:ring-ring focus-visible:outline-none",
                    !answered && "hover:border-apricot hover:bg-apricot/30 active:bg-clay/40",
                    answered && isAnswer && "border-olive-deep bg-sage/40",
                    isPicked && !isAnswer && "border-brick bg-peach/50",
                    answered && !isAnswer && !isPicked && "opacity-60",
                  )}
                >
                  <span className="flex-1">{option}</span>
                  {answered && isAnswer && <Check className="size-5 shrink-0 text-olive-deep" aria-label="Correct answer" />}
                  {isPicked && !isAnswer && <X className="size-5 shrink-0 text-brick" aria-label="Your answer" />}
                </button>
              </li>
            );
          })}
        </ul>
        {answered && (
          <div
            role="status"
            className="animate-in fade-in-0 slide-in-from-bottom-2 rounded-xl bg-muted p-4 duration-300"
          >
            <p className={cn("flex items-center gap-1.5 font-semibold", correct ? "text-olive-deep" : "text-brick")}>
              {correct ? <Check className="size-4" aria-hidden /> : <X className="size-4" aria-hidden />}
              {correct ? "Correct" : "Not quite"}
            </p>
            <p className="mt-1 text-sm">{quiz.explanation}</p>
          </div>
        )}
      </div>
    </div>
  );
}
