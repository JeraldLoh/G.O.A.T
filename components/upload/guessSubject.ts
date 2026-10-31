import type { Subject } from "@/lib/schemas";

// Keywords per subject, matched against tags and title words. Keep them
// lowercase; multi-word tags are hyphenated by parseTags (e.g. "data-structures").
const KEYWORDS: Record<Exclude<Subject, "other">, string[]> = {
  science: [
    "science", "biology", "chemistry", "physics", "plants", "plant", "photosynthesis", "cells",
    "cell", "genetics", "evolution", "ecology", "astronomy", "space", "geology", "earth",
    "energy", "atoms", "molecules", "sound", "light", "climate", "environment",
  ],
  technology: [
    "technology", "tech", "programming", "coding", "code", "software", "computer", "computing",
    "algorithms", "algorithm", "data-structures", "web", "javascript", "python", "ai",
    "machine-learning", "networks", "internet", "security", "database", "databases", "hash-tables",
  ],
  business: [
    "business", "economics", "finance", "money", "investing", "markets", "marketing",
    "management", "accounting", "entrepreneurship", "startup", "startups", "interest",
    "compound-interest", "budget", "budgeting", "supply", "demand", "trade",
  ],
  humanities: [
    "humanities", "history", "philosophy", "literature", "art", "arts", "music", "religion",
    "politics", "government", "civics", "law", "culture", "sociology", "anthropology", "ethics",
  ],
  math: [
    "math", "maths", "mathematics", "algebra", "geometry", "calculus", "statistics",
    "probability", "arithmetic", "numbers", "number-theory", "primes", "fractions",
    "trigonometry", "equations",
  ],
  language: [
    "language", "languages", "english", "grammar", "vocabulary", "writing", "spanish", "french",
    "chinese", "mandarin", "japanese", "german", "malay", "tamil", "linguistics", "reading",
  ],
  health: [
    "health", "medicine", "medical", "nutrition", "fitness", "exercise", "anatomy", "wellbeing",
    "mental-health", "psychology", "sleep", "diet", "disease", "first-aid",
  ],
};

/**
 * Picks the subject whose keywords best match the tags (worth 2) and title
 * words (worth 1). Ties go to the first subject listed; no match is "other".
 */
export function guessSubject(title: string, tags: string[]): Subject {
  const titleWords = title.toLowerCase().split(/[^a-z0-9-]+/).filter(Boolean);
  let best: Subject = "other";
  let bestScore = 0;
  for (const [subject, words] of Object.entries(KEYWORDS) as [Subject, string[]][]) {
    const score =
      tags.filter((tag) => words.includes(tag)).length * 2 +
      titleWords.filter((word) => words.includes(word)).length;
    if (score > bestScore) {
      best = subject;
      bestScore = score;
    }
  }
  return best;
}
