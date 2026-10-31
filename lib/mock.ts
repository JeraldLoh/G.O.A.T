import type { Generator } from "@/lib/llm";
import { MIN_QUOTE_CHARS, MOCK_MODEL } from "@/lib/schemas";

const CARDS_PER_CHUNK = 3;
const MAX_BODY_WORDS = 60;

// Metadata lines that describe the document rather than teach anything
// ("Source: …", "License: …"), and lines that are mostly a link.
const METADATA_LINE = /^(source|sources|author|authors|version|license|licence|changes|attribution|url|link|retrieved|accessed|copyright|credit|credits)\s*:/i;
const URL = /https?:\/\/\S+/g;

// Words ending in "." that don't end a sentence.
const ABBREVIATIONS = new Set([
  "e.g", "i.e", "etc", "vs", "mr", "mrs", "ms", "dr", "prof", "st", "no", "fig", "approx", "ca", "al", "u.s", "u.k", "jan", "feb", "mar", "apr", "jun", "jul", "aug", "sep", "sept", "oct", "nov", "dec",
]);

// Openers that only make sense after the previous sentence ("It also…").
const DANGLING_START = /^(it|its|this|these|that|those|they|their|he|she|his|her|such|however|also|and|but|or|so|then|thus|therefore|here)\b/i;

type Line = { text: string; heading: string | null };

const ENDS_SENTENCE = /[.!?:]["”’)]*$/;

/**
 * A short line with no end punctuation that starts with a capital: a heading
 * candidate. It must contain a real word and no "/", so wrapped link or number
 * fragments ("0/", "1317") aren't taken for headings.
 */
function looksLikeHeading(line: string): boolean {
  const words = line.split(/\s+/).length;
  return (
    words <= 8 &&
    !/[.!?:;,]$/.test(line) &&
    /^[A-Z0-9]/.test(line) &&
    !/^[-*•]/.test(line) &&
    /[A-Za-z]{3,}/.test(line) &&
    !line.includes("/")
  );
}

/** "RENEWABLE ENERGY" -> "Renewable energy"; other headings are kept as written. */
function tidyHeading(heading: string): string {
  const clean = heading.replace(/[*_`#]/g, "").trim();
  if (clean === clean.toUpperCase() && /[A-Z]/.test(clean)) {
    return clean.charAt(0) + clean.slice(1).toLowerCase();
  }
  return clean;
}

/**
 * Paragraphs tagged with the heading above them. PDF text breaks every printed
 * line, so wrapped lines are joined back into paragraphs first; a short line only
 * counts as a heading when it follows a finished sentence (or a blank line) and the
 * next line starts with a capital. Markdown, metadata and link-only lines are dropped.
 */
function proseLines(chunk: string, fallbackHeading: string): Line[] {
  const paragraphs: Line[] = [];
  let heading: string | null = null;
  let current: string[] = [];
  const flush = () => {
    const text = current.join(" ").replace(/\s+/g, " ").trim();
    if (text) paragraphs.push({ text, heading: heading ?? fallbackHeading });
    current = [];
  };

  const raw = chunk.split("\n").map((line) => line.trim());
  raw.forEach((line, i) => {
    if (!line) return flush();
    const markdownHeading = line.match(/^#{1,6}\s+(.+)$/);
    if (markdownHeading) {
      flush();
      heading = tidyHeading(markdownHeading[1]);
      return;
    }
    if (line.startsWith(">") || METADATA_LINE.test(line)) return flush();
    const withoutLinks = line.replace(URL, "").trim();
    if (withoutLinks.length < line.length / 2) return; // mostly a link

    const previous = current.at(-1) ?? "";
    const next = raw[i + 1] ?? "";
    const afterBreak = current.length === 0 || ENDS_SENTENCE.test(previous);
    if (looksLikeHeading(line) && afterBreak && (next === "" || /^[A-Z0-9"“(]/.test(next))) {
      flush();
      heading = tidyHeading(line);
      return;
    }

    const text = line
      .replace(/^[-*•]\s+|^\d+[.)]\s+/, "") // list markers
      .replace(/\*\*|__|`/g, "") // bold / code markers; the words stay
      .trim();
    // A list item or a line after a finished sentence that starts a new thought keeps its own paragraph.
    if (/^[-*•]\s|^\d+[.)]\s/.test(line)) flush();
    current.push(text);
  });
  flush();
  return paragraphs;
}

/** Sentence split that ignores abbreviations, decimals and initials. */
function sentences(text: string): string[] {
  const out: string[] = [];
  let start = 0;
  const boundary = /([.!?])["”’)\]]*\s+(?=["“(]?[A-Z0-9])/g;
  for (const match of text.matchAll(boundary)) {
    const end = match.index + match[0].length;
    const before = text.slice(start, match.index + 1);
    const lastWord = before.trim().split(/\s+/).at(-1)?.toLowerCase().replace(/[.!?]+$/, "") ?? "";
    if (match[1] === "." && (ABBREVIATIONS.has(lastWord) || /^[a-z]$/i.test(lastWord))) continue;
    // A decimal broken by a PDF line wrap ("1.\n8%" becomes "1. 8%") isn't a sentence end.
    if (match[1] === "." && /\d$/.test(lastWord) && /^\d/.test(text.slice(end))) continue;
    out.push(text.slice(start, end).trim());
    start = end;
  }
  const rest = text.slice(start).trim();
  if (rest) out.push(rest);
  return out;
}

/** How fact-like a sentence is on its own: definitions, numbers and causes score; fragments don't. */
function factScore(sentence: string): number {
  const words = sentence.split(/\s+/).length;
  let score = 0;
  if (/\b(is|are|was|were) (a|an|the|one of)\b/i.test(sentence)) score += 3;
  if (/\b(refers to|known as|called|defined as|means)\b/i.test(sentence)) score += 3;
  if (/\d/.test(sentence)) score += 2;
  if (/\b(because|so that|causes?|leads? to|results? in|allows?|produces?)\b/i.test(sentence)) score += 2;
  if (words >= 10 && words <= 35) score += 1;
  if (words < 7 || words > 50) score -= 3;
  if (DANGLING_START.test(sentence)) score -= 4;
  if (!/[.!?]["”’)]*$/.test(sentence)) score -= 4; // cut off mid-sentence
  if ((sentence.match(/[()[\]]/g) ?? []).length > 4) score -= 1;
  if (/[=^]/.test(sentence)) score -= 3; // formulas don't read well as a fact card
  return score;
}

/**
 * A short headline. The topic already shows as a chip on the card, so it isn't
 * repeated: "What is photosynthesis?" for definitions, "By the numbers" for
 * figures, "Why it happens" for causes, else "Did you know?".
 */
function headline(sentence: string): string {
  // Keeps "a"/"an" ("What is a volcano?"); drops "the" ("What is photosynthesis?").
  const definition = sentence.match(/^(?:The |(An?) )?([A-Za-z][\w\s-]{1,40}?)\s+(is|are)\s+(?:a|an|the|one of)\b/);
  if (definition && definition[2].trim().split(/\s+/).length <= 4) {
    const article = definition[1] ? `${definition[1].toLowerCase()} ` : "";
    return `What ${definition[3]} ${article}${definition[2].trim().toLowerCase()}?`;
  }
  if (/\d/.test(sentence)) return "By the numbers";
  if (/\b(because|causes?|leads? to|results? in)\b/i.test(sentence)) return "Why it happens";
  return "Did you know?";
}

/**
 * No-LLM generator, used when LLM_API_KEY is empty. Cards are real facts from
 * the upload: the most fact-like sentences of each chunk (plus the sentence
 * after, when it continues the thought), copied word for word, so every quote
 * verifies. Skips headings, links, markdown and "Source:/License:" lines.
 */
export const mockGenerator: Generator = {
  model: MOCK_MODEL,
  async generate(title, chunk) {
    const candidates = proseLines(chunk, title).flatMap(({ text, heading }) => {
      const parts = sentences(text);
      return parts.map((sentence, i) => ({ sentence, next: parts[i + 1], heading: heading ?? title }));
    });

    const picked = candidates
      .map((candidate, index) => ({ ...candidate, index, score: factScore(candidate.sentence) }))
      .filter(({ sentence, score }) => sentence.length >= MIN_QUOTE_CHARS && score >= 1)
      .sort((a, b) => b.score - a.score || a.index - b.index)
      .slice(0, CARDS_PER_CHUNK)
      .sort((a, b) => a.index - b.index); // back to reading order

    const cards = picked.map(({ sentence, next, heading }) => {
      const nextFits =
        next &&
        !/\d+\.\s*$/.test(next) &&
        (sentence + " " + next).split(/\s+/).length <= MAX_BODY_WORDS &&
        factScore(next) > -3;
      return {
        topic: heading,
        title: headline(sentence),
        body: nextFits ? `${sentence} ${next}` : sentence,
        quote: sentence,
      };
    });

    return {
      cards,
      quizzes: cards.slice(0, 1).map(({ topic, quote }) => ({
        topic,
        question: `Does the source say: "${quote}"`,
        options: ["Yes", "No"],
        answerIndex: 0,
        explanation: "This sentence is copied from the source.",
      })),
    };
  },
  async repairQuotes() {
    return new Map();
  },
};
