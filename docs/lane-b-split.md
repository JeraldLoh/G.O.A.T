# Lane B split — Feed (B1) and Course layer (B2)

Lane B (Feed & Learning Experience, see `CLAUDE.md`) is split between two people.
The split follows the seam already in `components/feed/FeedItem.tsx`: an entry is either a **card** or a **quiz**.

- **B1 — Feed surface:** the swipe feed, content cards, the source passage, demo polish.
- **B2 — Course layer:** quizzes, progress, completion, the Progress page.

All Lane B rules from `CLAUDE.md` still apply (shared contracts, seed data first, `main` always runs).

## File ownership

| File | Owner | Notes |
|---|---|---|
| `app/(app)/page.tsx` | B1 | Feed page: fetch `/api/feed`, scroll-snap container, loading/empty/error states |
| `components/feed/FeedItem.tsx` | B1 | Dispatcher only: `card` → `FeedCard`, `quiz` → `QuizCard` (B2) |
| `components/feed/FeedCard.tsx` | B1 | New. Topic label, title, body, quote block, bank title + license/attribution, verified badge |
| `components/feed/SourceSheet.tsx` | B1 | Quote in context from `sourceStart/End` |
| `components/feed/EndOfFeed.tsx` | B1 | New. "You're all caught up" screen at the bottom of the feed |
| `app/api/feed/**` | B1 | Feed endpoint (order + hidden-card rules from the contract) |
| `public/manifest.webmanifest` | B1 | PWA manifest only, no service worker |
| `components/feed/QuizCard.tsx` | B2 | New. Pick an answer, ✓/✗ + "Correct"/"Not quite" + explanation, calls `recordQuiz` |
| `components/feed/BankProgress.tsx` | B2 | New. Progress bar for one bank (cards seen + quizzes answered) |
| `components/feed/CompletionScreen.tsx` | B2 | New. Shown when a bank is 100% done |
| `app/(app)/progress/**` | B2 | Progress page: per-bank and per-topic progress, quiz score |
| `lib/local.ts` | B2 | `kb:progress` helpers. B1 only calls `markSeen` / `getProgress` |
| `app/api/banks/[id]/**` | B2 | Read-only bank endpoint (used by the Progress page and completion screen) |

## Seams between B1 and B2

Agree on these props at 0:30, then work independently.

| Component | Built by | Placed by | Props |
|---|---|---|---|
| `QuizCard` | B2 | B1 (inside `FeedItem`) | `{ quiz: Quiz; bank: BankSummary }` |
| `BankProgress` | B2 | B1 (top of `FeedCard` / `QuizCard`) | `{ bankId: string }` |
| `CompletionScreen` | B2 | B1 (feed, after a bank's last entry) | `{ bank: BankSummary }` |
| `markSeen(cardId)` | B2 (`lib/local.ts`, exists) | B1 | Call when a card is ≥ 60% in view (IntersectionObserver) |

Until B2's components land, B1 keeps the current inline quiz markup as a placeholder. B2 can build `QuizCard` on a test page or directly in `FeedItem` behind a one-line import swap.

Progress changes must refresh the bar: `lib/local.ts` dispatches a `kb:progress` window event after every write, and `BankProgress` listens for it (B2 adds both).

## Schedule

| When | B1 — Feed surface | B2 — Course layer |
|---|---|---|
| 0:30–1:30 | Swipe feed on seed data: `FeedCard` layout (topic, title, body, quote block, "source" button, bank title + license/attribution). Split `FeedItem` into a dispatcher | `QuizCard`: select an answer, ✓/✗ feedback with words, explanation, `recordQuiz`. Add the `kb:progress` change event to `lib/local.ts` |
| 1:30–2:30 | `markSeen` on view, loading/empty/error states, `EndOfFeed` screen | `BankProgress` bar, progress maths (seen cards + answered quizzes / total per bank and per topic) |
| 2:30–3:30 | `SourceSheet`: bottom sheet with the source text around the quote, quote highlighted | `CompletionScreen` (sunflower accent, score, "next bank") and the Progress page (`/progress`) |
| 3:30–4:30 | Demo polish: transitions, spacing, mobile sizing, verified badge, manifest | Polish quiz and progress screens; place `BankProgress` / `CompletionScreen` with B1 |
| 4:30–6:00 | Demo rehearsal, integration bug fixes | Demo rehearsal, integration bug fixes |

## Git

- Branches: `b1/feed` and `b2/course`.
- `FeedItem.tsx` is the one shared touch point: B1 owns it, B2 asks before changing it (usually only the `QuizCard` import).
- Merge to `main` at the sync points in `CLAUDE.md` (0:30, 2:00, 3:30, 4:30).

## Definition of done

- **B1:** a new user can swipe through cards from seeds and uploaded banks, every card shows its bank, license and verified status, and "source" opens the passage in context.
- **B2:** quizzes record right/wrong with ✓/✗ and an explanation, progress bars move as the user swipes, a finished bank shows the completion screen, and `/progress` lists every bank's progress.
