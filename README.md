# Community Knowledge Bank

Turn open learning material into a swipeable feed of short cards and quizzes, free for every learner. Every card quotes its source and links back to it.

## Quickstart

```sh
git clone https://github.com/JeraldLoh/G.O.A.T.git && cd G.O.A.T
cp .env.example .env.local
npm install
npm run dev
```

Open http://localhost:3000. `DEMO_MODE=1` serves the banks in `/seed`, so no database or LLM key is needed.

Run `npm run check:seed` to confirm every seed quote exists verbatim in its source.

## Why: the cost of the status quo

Our comparison target is **Coursera** (merged with Udemy in May 2026). A learner who wants a structured course today pays:

| Option | Cost per learner |
|---|---|
| Coursera Plus, monthly ($59 × 12) | **$708 / year** |
| Coursera Plus, annual | **$399 / year** |
| 6-month goal on the monthly plan ($59 × 6) | $354 |
| One Coursera course | $29–$99 |
| **Community Knowledge Bank** | **$0** |

**Saving per learner: $399/year (vs the annual plan) or $708/year (vs paying monthly).** We don't replace Coursera's certificates; we replace paying for the learning itself.

**Reach of the paid option:** 205M registered Coursera learners at 31 Mar 2026 (Coursera notes this is not a measure of active engagement), about 290M combined with Udemy after the merger, and 1.66M paying subscribers at 30 Jun 2026. Registered is not the same as active, and we quote both.

Sources (figures as of Oct 2026, re-check before the demo):
- [Coursera Q1 2026 results, 205M registered learners (SEC filing)](https://www.sec.gov/Archives/edgar/data/0001651562/000165156226000030/cour-20260331.htm)
- [Coursera Q2 2026 10-Q (SEC filing)](https://www.sec.gov/Archives/edgar/data/0001651562/000165156226000063/cour-20260630.htm)
- [1.66M paid subscribers at 30 Jun 2026 (Subscription Insider)](https://www.subscriptioninsider.com/blog/coursera-sets-post-udemy-baseline-as-subscribers-grow-and-enterprise-retention-falls-news)
- [Coursera + Udemy merger, ~290M learners (Market Chameleon)](https://marketchameleon.com/articles/b/2026/5/11/coursera-udemy-skills-platform-merger)
- [Coursera Plus pricing, $59/month or $399/year](https://www.myengineeringbuddy.com/blog/coursera-reviews-alternatives-pricing-offerings/)
- [6-month cost and free-audit changes](https://learnwithpath.com/blog/coursera-alternatives-for-self-learners-2026)

## What it costs us (measured)

Every generation logs its real token usage and cost. The `/stats` page shows these live, and `npm run eval` (coming) prints the same numbers for 3+ documents. Numbers below are filled in only from measured runs; mock and hand-written seed banks are excluded.

| Metric | Value |
|---|---|
| Banks generated | — |
| Cards generated | — |
| Cards whose quote was found verbatim in the source | — |
| Average generation time per bank | — |
| Average generation cost per bank | — |
| Cost per learner | $0 (a bank is generated once and served to unlimited learners) |

## How it works

1. **Upload** (`/upload`): paste text or choose a `.md`, `.txt` or `.pdf` file (under 1 MB, up to 3,000 words), then add a subject, level, tags, license and attribution.
2. **Generate**: the text is split into chunks, and an LLM writes short cards and quiz questions for each one. Every card stores an exact quote, which is checked against the source; cards whose quote isn't found are dropped. Cards stream to the screen as they're made.
3. **Learn** (`/`): new learners pick topics on their first visit, then swipe through a feed filtered by topic, level and tags. Every card links to its source passage and shows the bank's license.
4. **Trust**: learners can report a card (3 reports from different devices remove it from the feed) and rate each bank's accuracy.

## License

Code is released under the [MIT License](LICENSE). Seed banks are original text released as CC0-1.0. Each bank shows its own content license.
