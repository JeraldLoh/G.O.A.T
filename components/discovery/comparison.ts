// The status quo we compare against (rubric: cost + reach of the old thing).
// Figures and sources come from CLAUDE.md. Re-check them before the demo and
// update CHECKED_ON when you do. These are published figures, not our measurements.

export const CHECKED_ON = "Oct 2026";

export const COURSERA = {
  plusMonthlyUsd: 59,
  plusAnnualUsd: 399,
  courseUsd: { min: 29, max: 99 },
  registeredLearners: "205M",
  registeredAsOf: "31 Mar 2026",
  combinedWithUdemy: "~290M",
  paidSubscribers: "1.66M",
  paidAsOf: "30 Jun 2026",
};

export const PRICE_ROWS: { label: string; detail: string; usd: number | string }[] = [
  { label: "Coursera Plus, monthly", detail: "$59 × 12 months", usd: COURSERA.plusMonthlyUsd * 12 },
  { label: "Coursera Plus, annual", detail: "Billed yearly", usd: COURSERA.plusAnnualUsd },
  { label: "6-month goal, monthly plan", detail: "$59 × 6 months", usd: COURSERA.plusMonthlyUsd * 6 },
  {
    label: "One Coursera course",
    detail: "Typical range",
    usd: `${COURSERA.courseUsd.min}–${COURSERA.courseUsd.max}`,
  },
];

export const SOURCES = [
  {
    label: "Coursera Q1 2026 results (205M registered learners)",
    url: "https://www.sec.gov/Archives/edgar/data/0001651562/000165156226000030/cour-20260331.htm",
  },
  {
    label: "Coursera Q2 2026 10-Q",
    url: "https://www.sec.gov/Archives/edgar/data/0001651562/000165156226000063/cour-20260630.htm",
  },
  {
    label: "1.66M paid subscribers at 30 Jun 2026 (Subscription Insider)",
    url: "https://www.subscriptioninsider.com/blog/coursera-sets-post-udemy-baseline-as-subscribers-grow-and-enterprise-retention-falls-news",
  },
  {
    label: "Coursera + Udemy merger, ~290M learners (Market Chameleon)",
    url: "https://marketchameleon.com/articles/b/2026/5/11/coursera-udemy-skills-platform-merger",
  },
  {
    label: "Coursera Plus pricing, $59/month or $399/year",
    url: "https://www.myengineeringbuddy.com/blog/coursera-reviews-alternatives-pricing-offerings/",
  },
  {
    label: "6-month cost and free-audit changes",
    url: "https://learnwithpath.com/blog/coursera-alternatives-for-self-learners-2026",
  },
];
