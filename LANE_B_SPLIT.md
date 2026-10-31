# Lane B split — two people

Lane B (Feed & Learning Experience) from `CLAUDE.md`, split for two people. All shared contracts in `CLAUDE.md` stay as they are. This only divides Lane B's files and tasks.

**The split:** **B1 owns the swipe feed** (what scrolls, the content cards, the source link). **B2 owns the course layer** (quizzes, progress, completion). They connect at `components/feed/FeedItem.tsx`: B1 renders cards, and for quiz entries it imports B2's `QuizCard`.

| | B1 — Feed surface | B2 — Course layer |
|---|---|---|
| Branch | `b1/feed` | `b2/course` |
| Owns | `app/(app)/page.tsx`, `components/feed/FeedItem.tsx`, `components/feed/FeedCard.tsx` (new), `components/feed/SourceSheet.tsx`, `app/api/feed/**`, PWA manifest | `components/feed/QuizCard.tsx` (new), `components/feed/BankProgress.tsx` (new), `components/feed/CompletionScreen.tsx` (new), `app/(app)/progress/**`, `lib/local.ts`, `app/api/banks/[id]/**` |
| Definition of done | A user can swipe through cards, see bank title + license on every card, and open the source passage for any card | A user can answer quizzes, see progress per bank, reach a completion screen, and see everything on the Progress page |

## Seam components (B2 creates stubs first, B1 imports them)

**In the first 10 minutes**, B2 commits these three stubs to `main` with the exact props below. Then B1 never waits on B2.

| Component | Props | Where B1 puts it |
|---|---|---|
| `QuizCard` | `{ quiz: Quiz; bank: BankSummary }` | `FeedItem` when `entry.kind === "quiz"` (replaces the inline quiz markup) |
| `BankProgress` | `{ bank: BankSummary }` | Header of every card and quiz slot (thin progress bar + "3 / 8") |
| `CompletionScreen` | `{ bank: BankSummary }` | One extra snap slot after each bank's last entry in the feed |

**Progress contract (B2 owns `lib/local.ts`):**
- B1 calls `markSeen(card.id)` when a card is at least 60% visible (IntersectionObserver in `FeedCard`).
- B2's `QuizCard` calls `recordQuiz(quiz.id, correct)`.
- B2 adds a change signal so the progress bar updates live: `setProgress` writes fire `window.dispatchEvent(new Event("kb:progress"))`, plus a `useProgress()` hook that listens to it. This is an additive change to `lib/local.ts`. Announce it in the chat.
- Bank totals come from `BankSummary.cardCount` and `quizCount`. No new API is needed.

## Timeline

| When | B1 — Feed surface | B2 — Course layer |
|---|---|---|
| 0:30–0:40 | Pull shell, read `FeedItem.tsx` | Commit `QuizCard`, `BankProgress`, `CompletionScreen` stubs, then push |
| 0:40–1:30 | `FeedCard`: scroll-snap layout, topic label, title, body, quote block (peach tint), bank title + license/attribution, "source" button; split `FeedItem` into card/quiz dispatch | `QuizCard`: pick an answer, lock it, show ✓ Correct / ✗ Not quite with icon + text (not color alone) and the explanation; call `recordQuiz` |
| 1:30–2:30 | `SourceSheet`: bottom sheet showing `bank.sourceText` around `sourceStart/End` with the quote highlighted (fetch from `/api/banks/[id]`). Loading, empty and error states; end-of-feed screen | `useProgress()` + change event in `lib/local.ts`; `BankProgress` bar; `app/api/banks/[id]` read-only endpoint checked against the contract |
| **2:00 sync** | Feed shows an uploaded (mock) bank first | Quizzes record results in seed banks |
| 2:30–3:30 | `markSeen` via IntersectionObserver; insert a `CompletionScreen` slot after each bank; make sure C's `FilterBar` / `FlagButton` / `RatingButtons` sit cleanly in the card | `CompletionScreen` (sunflower accent, "Bank complete: 5 cards, 3/3 quizzes" or "x of y done"); `Progress` page: per-bank bars, quiz score, "reset progress" |
| **3:30 sync** | Real LLM cards render correctly (long titles, missing `sourceStart`) | Progress counts stay correct with real banks |
| 3:30–4:30 | Polish: spacing, mobile sizing at 430px, small transitions, verified badge (sunflower) on cards, PWA manifest | Polish: quiz feedback transition, completion screen, Progress page empty state ("Start swiping to track progress") |
| **4:30 freeze** | | |
| 4:30–6:00 | Demo rehearsal: swipe, open a source passage | Demo rehearsal: answer a quiz, finish a bank, show the Progress page. Both fix integration bugs |

## Rules for these two lanes
- **B1 never edits `lib/local.ts` or B2's components. B2 never edits `FeedItem.tsx` or `page.tsx`.** If you need a prop changed, ask in the chat. Make changes additive only, for example a new optional prop.
- Merge to `main` at the sync points and at least every 45 minutes. `npm run build` must pass before merging.
- Colors: use the shadcn tokens from `CLAUDE.md` (`bg-card`, `text-foreground`, `bg-primary`, …), not raw hex. Text is `ink`, `olive-deep`, `bark` or `brick` only.
- **If one of you falls behind, cut in this order:** feed transitions → Progress page reset button → per-topic progress (keep per-bank). **Never cut:** quiz, source link, completion screen.
