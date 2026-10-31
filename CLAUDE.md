# CLAUDE.md — Community Knowledge Bank (Hackathon Build)

## Project summary
A community-driven, open-source "knowledge bank" that turns uploaded learning material into a swipeable, TikTok-style feed of short cards with quizzes. Learners pick interests and get a filtered feed. Goal: give students a free, easy way to learn from open material instead of paying for expensive online courses.

**Hackathon constraint: 6 hours total. Feature freeze at hour 5:00. Keep everything simple and always runnable.**

## Judging rubric (NUS Hackers) — what we are scored on
Scale per criterion: 1 weak, 2 limited, 3 credible, 4 strong, 5 exceptional. Weighted total = sum of (score / 5 x weight).
Judges ask every team: **"What did you uncover, and how do you know it works?"** They reward **working builds and real numbers, not presentation polish.**

Five criteria, weights total 100%.

| Criterion | Weight | Strong looks like | Our evidence / what to show |
|---|---|---|---|
| Cost of the status quo ("how expensive old thing is now") | 20% | A named product with a credible, sourced price or cost of ownership (money, time or lock-in) — not a vague "things are expensive" claim | **Named target: Coursera (now including Udemy).** Coursera Plus $59/month or $399/year; individual courses roughly $29–$99; free audit reduced to a one-module preview on most courses; a 6-month goal on the monthly plan = $354 (6 x $59). Put sources and the date checked in the README |
| Reach of the old thing ("how many people use expensive old thing") | 15% | Credible usage figures or clear evidence of a large user base | Coursera: 205M registered learners at 31 Mar 2026 (last figure disclosed; Coursera says it is "not a measure of active engagement"); about 290M learners combined with Udemy after the 11 May 2026 merger; 1.66M paid consumer subscribers at 30 Jun 2026 (+44% YoY). Quote registered AND paying numbers honestly |
| Coolness of the new build | 25% | A working build demoed live that recreates or improves on the original; technical ambition, polish, the "can't believe it works" factor. Slides or mock-ups with no build are weak | Live upload -> course-style feed in seconds, quote verification, source links, modules + quiz + progress. Demo the real app, not slides |
| Cost reduction ("how u make expensive thing cheap") | 25% | A clear before/after number, free or near-free for the user; compare with the original's price/subscription and show saving per user | Cost counter in the app + comparison table in README and demo; learner cost $0 vs $399/year |
| Open source licensing | 15% | Public repo with an explicit open-source license and reusable code | Public repo from minute one, `LICENSE` (MIT) at repo root, license stated in README and app footer |

### Strategy notes from the rubric
- **Our target is Coursera, not ScrollEd.** ScrollEd is a pre-launch startup, so it scores poorly on "reach" and "cost of status quo". Use ScrollEd only as inspiration. Other paid comparators for context: Blinkist about $12.99/month, ScrollEd Pro nominally $6.99/month (beta) — re-check before the demo.
- **"Recreates or improves on the original":** frame the build as a Coursera-style course experience (modules, quizzes, progress, completion) generated from any open document in seconds, for $0. We do NOT claim to replace credentials/certificates.
- **Registered learners are not active learners.** Say so ourselves — honesty with sources scores better than inflated claims.
- Saving per learner vs Coursera Plus: $399/year on the annual plan, $708/year if paying monthly (12 x $59).

### Sources for the README (re-check figures before the demo)
- Coursera Q1 2026 results (205M registered learners): https://www.streetinsider.com/Business+Wire/Coursera+Reports+First+Quarter+2026+Financial+Results/26358939.html and https://www.sec.gov/Archives/edgar/data/0001651562/000165156226000030/cour-20260331.htm
- Coursera Q2 2026 10-Q (stopped disclosing registered learners; paid subscribers metric): https://www.sec.gov/Archives/edgar/data/0001651562/000165156226000063/cour-20260630.htm
- Paid subscribers 1.66M at 30 Jun 2026: https://www.subscriptioninsider.com/blog/coursera-sets-post-udemy-baseline-as-subscribers-grow-and-enterprise-retention-falls-news
- Coursera + Udemy merger, ~290M learners: https://marketchameleon.com/articles/b/2026/5/11/coursera-udemy-skills-platform-merger
- Coursera Plus price ($59/month, $399/year): https://www.myengineeringbuddy.com/blog/coursera-reviews-alternatives-pricing-offerings/
- 6-month cost ($354) and free-access changes: https://learnwithpath.com/blog/coursera-alternatives-for-self-learners-2026 and https://www.datacamp.com/blog/best-coursera-alternatives

## Core principles
1. **Always keep a runnable version.** Commit often. Never leave `main` broken.
2. **Grounded content only.** Every card must come from real source text, never from the AI's memory alone.
3. **Every card links back to its source** and shows the license/attribution of its bank.
4. **Boring tech.** No accounts, no video, no native mobile app.
5. **Demo safety.** Pre-generate sample banks so the demo works even if the AI API or Wi-Fi fails.

## Features

### Must-have (demo depends on these)
1. Upload a knowledge bank: `.md` / `.txt` first, PDF only if time allows. Fields: title, subject, difficulty level, free tags, license dropdown.
2. Tagging: subject (controlled list), level, free tags.
3. AI conversion: split source text into short cards (~60 seconds of reading each).
4. Quiz per topic: 1–3 short questions at the end of each topic.
5. Interest picker: new user chooses topics on first visit (stored locally).
6. Filtered scroll feed: vertical scroll-snap, swipe up for next topic, filtered by chosen interests.
7. Source link on every card pointing to the original text passage.

### Should-have
8. Tag filters in the feed (level, subject, length), changeable at any time.
9. Quote verification: each card stores an exact quote; check it exists in the source (normalized substring match). Hide or mark cards that fail.
10. Flag button: users can report a wrong or low-quality card.
11. Accuracy rating: thumbs up/down per bank, shown as a score.
12. Progress tracking (**promote to must-have** — it makes the build feel like a course): topics/modules completed, progress bar and a completion screen, stored on the device.

### Rubric evidence features (treat as must-have — they earn points)
A. **Cost counter:** log API tokens/cost for every bank generated; show "Generation cost: $X.XX, served to unlimited learners" on the bank page. Never invent numbers — use measured values only.
B. **Stats panel / README table:** after running on 3+ real documents, report: number of banks, number of cards, % of cards passing quote verification, average generation time, average cost per bank.
C. **License visibility:** public repo from the start, `LICENSE` file at the root, license named in the README and in the app footer.

### Stretch (only after all above work)
13. "Generate a starter bank from Wikipedia" when no bank matches an interest (fetch via Wikipedia API, run through the same pipeline, label as "AI-seeded from Wikipedia").
14. "Request this topic" wishlist so contributors can fill gaps.
15. Audio narration with text-to-speech.
16. Learning paths (prerequisites between banks).
17. Export cards to Anki.
18. AI video — skip unless everything else is finished.

### Explicitly out of scope
Accounts/login, comments, payments, behavior-based recommendations, mobile apps, general web scraping.

## Tech stack

| Layer | Pick | Notes |
|---|---|---|
| Framework | Next.js (App Router) + TypeScript (strict) | Frontend and API routes in one repo; no separate backend |
| UI | Tailwind CSS + shadcn/ui | Install only what we use (button, card, dialog, progress, tabs). Cap setup at ~20 minutes |
| Mobile look | Centered column `max-w-[430px] mx-auto h-dvh` + bottom tab bar (Feed / Upload / Progress) | The scroll-snap container is the 430px column, not the whole window |
| Installable | PWA manifest only | Skip the service worker (cache bugs cost time) |
| Swipe feed | CSS scroll-snap (`snap-y snap-mandatory`, each card `h-dvh snap-start`) | No library needed. Framer Motion only for small transitions, optional |
| Database | Supabase Postgres | Store extracted source text in tables. **Skip Supabase Storage.** All writes go through server routes using the service-role key (server only). Row Level Security on |
| AI | One LLM provider (decide at hour 0) with JSON/structured output + Zod validation | Low temperature. Retry once on invalid JSON. Keep a price constants file (`lib/cost.ts`) for the cost counter |
| File parsing | `.md` / `.txt` read as-is; PDF via **unpdf** | Do NOT use pdf-parse (native canvas deps can crash on Vercel). PDF is a bonus, not the demo path |
| Local state | localStorage | Interest picks, progress, device ID for flags/ratings |
| Deploy | Vercel (Fluid Compute enabled) + local fallback | Demo must also run locally from seeded data |
| Demo mode | `DEMO_MODE=1` loads banks from `/seed/*.json` | Works with no Supabase and no LLM key; also what a reviewer can run in one command |
| Evaluation | `scripts/eval.ts` | Runs the pipeline on 3+ documents and prints bank count, cards, % verified, avg time, avg cost |

### Color scheme — "Earthy Tones"
Base palette (10 colors, light to dark within each hue family). Define them as CSS variables in `app/globals.css` and map them to the shadcn tokens below; components use the tokens, not raw hex.

| Name | Hex | Use |
|---|---|---|
| olive | `#797D62` | Brand color for large shapes: headers, illustrations, chart series (buttons use `olive-deep`) |
| sage | `#9B9B7A` | Secondary surfaces, inactive chips, borders on dark areas |
| khaki | `#BAA587` | Borders, dividers, muted icons |
| peach | `#D9AE94` | Quote block background tint, subtle highlights |
| cream | `#F1DCA7` | Card background, text on `olive` buttons |
| sunflower | `#FFCB69` | Accent: verified badge, streaks, completion screen, focus ring |
| apricot | `#E8AC65` | Quiz option hover/selected |
| terracotta | `#D08C60` | Secondary accent: flag button, rating, "AI-seeded" label |
| clay | `#B58463` | Pressed states, chart series |
| brown | `#997B66` | Muted metadata badges (license, level) |

Added colors (the base palette has no text color, no page background and no error color):

| Name | Hex | Use |
|---|---|---|
| ink | `#2F3125` | All body and heading text (12.3:1 on `paper`, 9.8:1 on `cream`) |
| paper | `#FBF6EA` | Page background |
| linen | `#F3E8CF` | Muted surfaces (`--muted`): area outside the phone column, inactive tabs, skeletons |
| olive-deep | `#5C6146` | Text-sized olive: links, "correct" quiz feedback, source link (6.0:1 on `paper`) |
| brick | `#983D2A` | Errors and "wrong answer" quiz feedback (6.4:1 on `paper`, 5.1:1 on `cream`) |
| bark | `#7A5038` | Text-sized terracotta/brown (6.4:1 on `paper`, 5.1:1 on `cream`) |
| night | `#23241B` | Dark-mode background (`paper` text on it is 14.5:1) |

Accessibility rules (WCAG AA, contrast checked):
- **Never use a base palette color for text on `paper`, `cream` or white** — none of the 10 reaches 4.5:1. Use `ink`, `olive-deep`, `bark` or `brick` for text.
- Base colors are for fills, borders and large shapes. On those fills, text is `ink` (passes on everything from `sage` to `sunflower`) — except on `olive`, where `paper` text is only about 4:1, so primary buttons use `olive-deep` (6.0:1).
- Do not signal quiz right/wrong by color alone: add a ✓ / ✗ icon and the words "Correct" / "Not quite".

shadcn token mapping (light): `--background: paper`, `--foreground: ink`, `--card: cream`, `--card-foreground: ink`, `--primary: olive-deep`, `--primary-foreground: paper`, `--secondary: sage`, `--secondary-foreground: ink`, `--muted: linen`, `--muted-foreground: olive-deep` (not bark: brown hints looked like brick errors), `--accent: sunflower`, `--accent-foreground: ink`, `--destructive: brick`, `--border: khaki`, `--input: khaki`, `--ring: sunflower`.
Dark mode (`.dark` class, optional): `--background: night`, `--foreground: paper`, `--card: ink`, `--primary: sunflower`, `--primary-foreground: ink`, `--muted-foreground: khaki`, `--destructive: #E08A6E`.
Implemented in `app/globals.css`; every palette color is also a Tailwind color (`bg-sunflower`, `text-olive-deep`, `border-khaki`).

### Generation pipeline (streaming)
1. `POST /api/banks`: validate size (live demo cap ~3,000 words), license, tags -> extract text -> save the bank.
2. Split the text into 3–6 chunks on headings/paragraphs.
3. For each chunk, in parallel: one LLM call -> cards + quiz as JSON, validated with Zod.
4. For each card: normalize and locate the quote in the source; set `verified`; retry once on failure; drop if it still fails.
5. Stream each finished card to the client (ReadableStream/SSE) so cards appear live; persist them as they complete.
6. Write a `generations` row: model, input/output tokens, cost_usd, duration_ms, cards, verified_pct.

### Quote verification
Normalize both source and quote: Unicode NFKC, lowercase, curly quotes to straight, remove soft hyphens and line-break hyphenation (`-\n`), collapse whitespace. Then `indexOf` on the normalized source; store the position for the source link. PDFs will fail more often than `.md`/`.txt` — report the pass rate honestly.

### Environment variables (`.env.example`, never commit real keys)
`LLM_API_KEY`, `LLM_MODEL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (only if used client-side), `SUPABASE_SERVICE_ROLE_KEY` (server only), `MAX_WORDS`, `DAILY_GENERATION_LIMIT`, `DEMO_MODE`.

### Reusability target (open-source score)
README quickstart in about five commands: clone -> `cp .env.example .env.local` -> `npm install` -> `npm run seed` (or run migrations) -> `npm run dev`. SQL migrations live in `/supabase/migrations`. MIT `LICENSE` at the repo root.

### Abuse and cost protection (public URL)
- Cap upload size (about 1 MB) and word count.
- Global daily generation limit to protect the API budget.
- Device ID from localStorage for flags and ratings; throttle per device.
- Service-role key and LLM key stay server-side; no keys in the repo or client bundle.

### Repo structure
```
/app            routes: / (feed), /upload, /progress, /api/banks, /api/flag, /api/stats
/components     FeedCard, QuizCard, InterestPicker, BankUploadForm, StatsPanel
/lib            llm.ts, chunk.ts, verify.ts, cost.ts, supabase.ts
/scripts        eval.ts, seed.ts
/seed           pre-generated banks (JSON)
/supabase       migrations
LICENSE  README.md  CLAUDE.md  .env.example
```

### Platform limits to remember (checked Oct 2026 — re-check)
- Vercel with Fluid Compute: Hobby default and max duration 300 s. Projects without Fluid Compute can have much lower limits — check Project Settings -> Functions.
- Supabase free tier: project pauses after 7 days of inactivity (wake it on the day), 500 MB database, 1 GB file storage, 50 MB max upload.
- Conference Wi-Fi is a single point of failure: keep the local demo mode working.

### Coding conventions
- TypeScript strict; validate every LLM response with Zod before use.
- Keep API routes thin; put logic in `/lib` so `scripts/eval.ts` can reuse it.
- No new dependencies unless they clearly save time.

## Data model (keep minimal)
- **Bank**: id, title, subject, level, tags[], license, source_text, source_url (optional), origin (`community` | `ai-seeded`), accuracy_score, created_at.
- **Card**: id, bank_id, topic, title, body, quote, source_position, verified (bool), flags (int).
- **Quiz**: id, bank_id, topic, question, options[], answer_index, explanation.
- **Generation** (for the cost counter and stats): id, bank_id, model, input_tokens, output_tokens, cost_usd, duration_ms, cards_total, cards_verified, created_at.
- **Flag**: id, card_id, device_id, reason, created_at.

## Card generation rules (prompt requirements)
- Output strict JSON only.
- Each card: `title`, `body` (2–4 sentences), `quote` (verbatim from source), `topic`.
- Each topic: 1–3 multiple-choice questions with an explanation.
- Do not add facts that are not in the source text.
- If the source is too short or unclear, return fewer cards instead of inventing content.

## Team split (3 people) — read this before writing code

**Goal of the split:** three people build in parallel with almost no shared files, meet at fixed integration points, and always have a runnable app.

### Ground rules
1. **Own your lane.** Only edit files in your lane (tables below). If you need a change in someone else's file, ask them or make a tiny, announced change.
2. **Contracts are frozen at 0:30.** Data shapes and API shapes below are the contract. Changes must be additive and announced in the team chat. If `lib/schemas.ts` exists in the repo it is the source of truth (Zod schemas + inferred types); if not, create it from the shapes below before anything else.
3. **Build against seeds and mocks first.** Person B and C do not wait for Person A: use the seed banks and the mock streaming endpoint until the real pipeline lands.
4. **Integration seams.** Shared UI spots are stub components that one person owns and others import. Never inline someone else's feature into your file — import their component.
5. **Git:** one branch per person (`a/pipeline`, `b/feed`, `c/upload-discovery`). Small commits. Merge to `main` at least every 45 minutes (sync points below). Rebase on `main` before merging. `main` must always run (`npm run dev` and `npm run build`).
6. **Dependencies:** `package.json` is a conflict hot-spot. Announce before adding a dependency; one person installs, others pull.
7. **Fewer than 3 people?** Merge lane C into B and A (A takes stats/cost UI, B takes upload/discovery) and cut Should-have items first.

### Hour-0 shell checklist (do together, ~30 minutes, then freeze)
- [ ] `npx create-next-app@latest` with TypeScript, Tailwind, App Router, no `src/` dir; add `zod` and `unpdf`; add `tsx` as a dev dependency for scripts.
- [ ] If the template enables experimental flags such as `cacheComponents` / `partialPrefetching` in `next.config.ts`, turn them off so pages and API routes behave as ordinary dynamic routes.
- [ ] Avoid `next/font/google` (it needs network at build time). Use a system font stack.
- [ ] This Next.js version may differ from what AI assistants remember (e.g. `params` in route handlers is a Promise). When something behaves unexpectedly, check the docs shipped in `node_modules/next/dist/docs/`.
- [ ] App shell: route group `app/(app)/` with a centered phone column (`max-w-[430px] mx-auto h-dvh`), a bottom tab bar (Feed `/`, Upload `/upload`, Progress `/progress`, Stats `/stats`), and placeholder pages.
- [ ] Create folders: `lib/`, `components/{feed,upload,discovery,shell}/`, `app/api/*`, `scripts/`, `seed/`, `supabase/migrations/`.
- [ ] Add `LICENSE` (MIT), `.env.example`, a README quickstart, and make the GitHub repo **public**.
- [ ] Seed data: 3 short banks written by us (original text, CC0) in `seed/`, each with ~5 cards and ~3 quizzes. Every quote must be copied verbatim from its source. Verify with a script (`npm run check:seed`).
- [ ] Data access goes through ONE module, `lib/store.ts`, with an in-memory implementation loaded from the seeds. Supabase is an optional adapter behind the same functions, added later by Person A if time allows.
- [ ] Commit, push, everyone pulls. Contracts frozen.

### Shared contracts

**Constants:** `FLAG_HIDE_THRESHOLD = 3` (cards with >= 3 flags leave the feed), `MIN_QUOTE_CHARS = 20`, `MAX_WORDS` default 3000. Subjects: science, technology, business, humanities, math, language, health, other. Levels: beginner, intermediate, advanced. Licenses: CC0-1.0, CC-BY-4.0, CC-BY-SA-4.0, CC-BY-NC-SA-4.0, PUBLIC-DOMAIN, OWN-WORK. Origins: community, ai-seeded.

**Types**
- `Bank`: id, title, subject, level, tags[], license, attribution, sourceUrl?, origin, sourceText (NFKC-normalized), ratingsUp, ratingsDown, createdAt.
- `BankSummary`: Bank without sourceText, plus cardCount, quizCount, verifiedPct (number | null), accuracyScore (number | null, thumbs-up share 0–100).
- `Card`: id, bankId, topic, title, body, quote, sourceStart | null, sourceEnd | null (offsets into Bank.sourceText), verified, flags, order.
- `Quiz`: id, bankId, topic, question, options[2–4], answerIndex, explanation.
- `Generation`: id, bankId, model, inputTokens, outputTokens, costUsd, durationMs, cardsTotal, cardsVerified, createdAt.
- `Flag`: id, cardId, deviceId, reason, createdAt.
- `FeedEntry`: `{ kind: "card", card, bank } | { kind: "quiz", quiz, bank }`, where `bank` is a `BankSummary`. Order: newest bank first; within a bank, topic by topic: cards (by `order`) then that topic's quizzes. Hidden: unverified cards and cards with flags >= threshold.
- `Stats`: banks, cards, quizzes, verifiedPct, generations, totalCostUsd, avgCostUsd, avgDurationMs, flags.

**API endpoints**
| Method + path | Purpose | Request | Response |
|---|---|---|---|
| `GET /api/banks` | List banks | query: `subjects`, `tags` (comma separated), `level` | `BankSummary[]` |
| `GET /api/banks/[id]` | One bank | — | `{ bank, cards, quizzes, summary }` |
| `POST /api/banks` | Create + generate | JSON `{ title, subject, level, tags, license, attribution, sourceUrl?, text }` or multipart with the same fields plus `file` (.md/.txt/.pdf) | **NDJSON stream** (see below) |
| `GET /api/feed` | Feed entries | query: `subjects`, `tags`, `level` | `FeedEntry[]` |
| `POST /api/flag` | Report a card | `{ cardId, deviceId, reason }` | `{ ok: true, flags }` |
| `POST /api/rate` | Rate a bank | `{ bankId, deviceId, value: 1 or -1 }` | `{ ok: true, accuracyScore }` |
| `GET /api/stats` | Platform stats | — | `Stats` |

**NDJSON events from `POST /api/banks`** (one JSON object per line): `{type:"bank", bank}`, `{type:"progress", message, done, total}`, `{type:"card", card}`, `{type:"quiz", quiz}`, `{type:"done", generation}`, `{type:"error", message}`. Cards appear in the UI as they arrive.

**Browser storage keys (localStorage)**: `kb:interests` (subjects[]), `kb:filters` (`{ tags: string[], level: Level | null }`), `kb:progress` (`{ seen: string[], quiz: Record<quizId, boolean> }`), `kb:device` (random device id). Helpers live in `lib/local.ts` (Person B owns it; others import).

**Seam components (stubs created in the shell, implemented by the owner):**
| Component | Owner | Used by |
|---|---|---|
| `components/discovery/InterestGate.tsx` — wraps the feed; shows the interest picker on first visit | C | B's feed page |
| `components/discovery/FilterBar.tsx` — tag / level filters, writes `kb:filters` | C | B's feed list |
| `components/discovery/FlagButton.tsx`, `RatingButtons.tsx` — call `/api/flag`, `/api/rate` | C | B's card components |
| `components/discovery/StatsPanel.tsx` — cost counter, verified %, savings comparison | C | `/stats` page (C) and bank detail |
| `components/feed/SourceSheet.tsx` — shows the quote in context from `sourceStart/End` | B | C's upload preview (optional) |

### Lane A — Pipeline & Data (backend)
**Owns:** `lib/llm.ts`, `lib/chunk.ts`, `lib/verify.ts`, `lib/cost.ts`, `lib/extract.ts`, `lib/pipeline.ts`, `lib/store.ts` (+ optional Supabase adapter), `lib/ndjson.ts`, `app/api/banks/**`, `app/api/stats/**`, `scripts/eval.ts`, `supabase/migrations/**`.
| When | Task |
|---|---|
| 0:30–1:15 | Pipeline skeleton end to end with a **mock generator** (real sentences from the text as cards), so `POST /api/banks` streams cards in the contract format. Unblocks B and C. |
| 1:15–2:15 | Real LLM call: pick the provider, structured output + Zod validation, one retry on invalid JSON, real token usage. Fill `MODEL_PRICES` from the provider's pricing page (no guessed numbers). |
| 2:15–3:00 | Quote verification hardening (normalization, one retry per failed card, drop if still failing), parallel chunk generation, streaming order, daily generation cap and size limits. |
| 3:00–3:45 | `scripts/eval.ts`: run the pipeline on 3+ documents and print banks, cards, % verified, average time, average cost. Write generation rows. |
| 3:45–4:30 | Optional: Supabase adapter behind `lib/store.ts`; PDF path test with `unpdf`; Wikipedia "starter bank" fetch (stretch). |
| 4:30–6:00 | Run the final eval and hand the numbers to C for the README; fix generation bugs; keep a pre-generated copy of every demo bank in `seed/`. |
**Definition of done:** upload of a `.md` file streams cards to the screen in seconds; every card has a verified quote; `/api/stats` returns real measured cost, time and verified %.

### Lane B — Feed & Learning Experience (frontend core)
**Owns:** `app/(app)/page.tsx`, `app/(app)/progress/**`, `components/feed/**`, `lib/local.ts`, `app/api/feed/**`, `app/api/banks/[id]/**` (read-only endpoint).
| When | Task |
|---|---|
| 0:30–1:30 | Swipe feed with scroll-snap reading `/api/feed` (seed data): card layout, topic label, title, body, quote block, "source" affordance, bank title + license/attribution on every card. |
| 1:30–2:30 | Quiz card (select an answer, show right/wrong + explanation, record result), end-of-feed screen, loading and empty states. |
| 2:30–3:30 | **Course feel (rubric: recreate the original):** progress per bank/topic, progress bar, completion screen, `Progress` page. `SourceSheet` that shows the quote in context from `sourceStart/End`. |
| 3:30–4:30 | Polish for the live demo: transitions, spacing, mobile sizing, installable manifest (manifest only, no service worker), verified badge on cards. |
| 4:30–6:00 | Demo rehearsal on the real app; fix UI bugs found during integration. |
**Definition of done:** a new user can swipe through cards, answer quizzes, see progress and a completion screen, and open the source passage for any card.

### Lane C — Upload, Discovery, Trust & Evidence
**Owns:** `app/(app)/upload/**`, `app/(app)/stats/**`, `components/upload/**`, `components/discovery/**`, `app/api/flag/**`, `app/api/rate/**`, README, demo script, cost-comparison table.
| When | Task |
|---|---|
| 0:30–1:30 | Upload form: file or pasted text, title, subject, level, tags, license dropdown, attribution. Validation with the shared Zod schema. |
| 1:30–2:30 | Streaming UI: read the NDJSON stream, show progress and cards appearing live, link to "open in feed" when done. Works with A's mock first. |
| 2:30–3:15 | `InterestGate` (first-visit interest picker, saved in `kb:interests`) and `FilterBar` (tags/level). |
| 3:15–4:00 | `FlagButton`, `RatingButtons`, `/api/flag`, `/api/rate`. Flagged cards (>= 3) disappear from the feed. |
| 4:00–4:45 | `StatsPanel` / `/stats` page: cost per bank, % verified, generation time, and the before/after comparison (Coursera Plus $59/month or $399/year vs $0). **Only measured numbers from A's eval.** |
| 4:45–6:00 | README (quickstart, license, comparison table with sources and dates), demo script, backup screen recording, submission form. |
**Definition of done:** upload -> live cards -> filter by interest works; flags and ratings change what users see; `/stats` shows real numbers with sources; README lets a stranger run the repo.

### Sync points (everyone stops and merges)
| Time | Check |
|---|---|
| 0:30 | Shell merged, contracts frozen, seeds render in the feed |
| 2:00 | Mock streaming upload works end to end; feed shows an uploaded bank first |
| 3:30 | Real LLM output flows through B's feed and C's upload screen; filters work |
| 4:30 | **Feature freeze.** Deploy; test with two fresh files; run `eval` |
| 5:15 | Final numbers into README and stats; demo rehearsal x2 |

### Conflict hot-spots (agree before touching)
`package.json` / lockfile, `app/(app)/layout.tsx` and the tab bar, `app/globals.css`, `lib/schemas.ts`, `.env.example`. One owner for each: shell setup person for the first four, Person A for `.env.example`.

## Schedule (6 hours)
| Time | Goal |
|---|---|
| 0:00–0:30 | Setup: repo + MIT license, stack, roles, API key, pick 2–3 short open-licensed sample texts |
| 0:30–2:00 | Parallel build: pipeline (upload → chunk → cards + quiz → verify → save) | feed UI (swipe cards, quiz, source link) | interest picker + tag schema + seed data |
| 2:00–3:30 | Integrate: feed reads from storage, interest filter works, upload form with tags + license |
| 3:30–4:30 | Should-haves (verified badge, flag button) + rubric evidence: cost counter, run on 3+ documents and record the stats. Polish the feed UI for the live demo (coolness is 25%); no slide design |
| 4:30–5:00 | Deploy and test with two fresh files. **Feature freeze at 5:00** |
| 5:00–6:00 | README, demo rehearsal, backup screen recording, submission |

## Cut order if running late
1. Flag button / accuracy rating
2. Extra tag filters (keep the interest picker)
3. Any stretch items
Never cut: upload → feed flow, quiz, source link, cost counter, LICENSE file, measured stats.
Cut slide/presentation polish before cutting any evidence or build polish — judges reward working builds and real numbers.

## Risks and fallbacks
- **AI API slow or down:** serve pre-generated banks from storage; cache all generations.
- **PDF extraction fails:** accept `.md` / `.txt` only.
- **Deployment trouble:** run the demo locally.
- **UI polish time sink:** timebox polish to the 3:30–4:30 block.
- **Wikipedia has nothing relevant:** show "no source found" — never fabricate.

## Demo script (~3 minutes)
1. Upload a short open-licensed chapter live.
2. Add tags and watch it become cards.
3. Switch to a second user, pick interests, show the filtered feed.
4. Show a card with its source link, then a flagged card being hidden.
5. Show the numbers: name the target (Coursera Plus, $59/month or $399/year) with its reach (205M registered learners, 1.66M paid subscribers), then our generation cost per bank, % cards verified, generation time, and the saving per learner ($399/year). Be ready to answer: "What did you uncover, and how do you know it works?"
6. Show the public repo and the LICENSE file.
7. (If built) search a topic with no bank and generate a starter bank from Wikipedia.

## Before submission checklist
- [ ] Public repo with MIT license and a clear README
- [ ] Sample banks pre-generated and committed/seeded
- [ ] Demo works offline from cached data
- [ ] Measured stats recorded (cost per bank, % verified, generation time, cards per bank)
- [ ] Before/after cost comparison table in README with sources and today's prices
- [ ] Prepared one-sentence answer to "What did you uncover, and how do you know it works?"
- [ ] Sources + dates for Coursera price and learner figures included in the README
- [ ] Live demo rehearsed on the real app (no slide-only demo)
- [ ] Backup demo video recorded
- [ ] Hackathon submission requirements checked (video, slides, repo link)

## Working instructions for Claude
- Prefer small, working increments over big rewrites.
- Keep code simple and commented where non-obvious.
- Do not add dependencies unless they save real time.
- When unsure about scope, choose the smaller option and note what was cut.
- Use only open-licensed or public-domain sample content in demos.
- Know the lane: when helping one person, only edit files in that person's lane (see Team split) and use the shared contracts exactly as written.
- Never invent measured numbers (costs, verified %, timings). Compute them from the `generations` data or leave them blank.