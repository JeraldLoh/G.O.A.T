const MAX_CHUNKS = 6;
const WORDS_PER_CHUNK = 350;

const countWords = (text: string) => text.trim().split(/\s+/).filter(Boolean).length;

/** Paragraphs, with any paragraph too long for one chunk split into sentences. */
function toUnits(text: string, chunkWords: number): string[] {
  return text
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .flatMap((paragraph) =>
      countWords(paragraph) > chunkWords
        ? (paragraph.match(/[^.!?]+[.!?]*\s*/g) ?? [paragraph])
        : [paragraph],
    );
}

/** Splits text into at most MAX_CHUNKS pieces, breaking at headings where it can. */
export function chunkText(text: string): string[] {
  const words = countWords(text);
  if (words === 0) return [];
  const chunkWords = Math.max(WORDS_PER_CHUNK, Math.ceil(words / MAX_CHUNKS));

  const chunks: string[][] = [[]];
  let current = 0;
  for (const unit of toUnits(text, chunkWords)) {
    const size = countWords(unit);
    const atHeading = unit.startsWith("#") && current >= chunkWords / 2;
    if (current > 0 && (atHeading || current + size > chunkWords)) {
      chunks.push([]);
      current = 0;
    }
    chunks[chunks.length - 1].push(unit);
    current += size;
  }

  // Greedy filling can overshoot by a chunk or two; fold the extras into the last.
  const kept = chunks.slice(0, MAX_CHUNKS);
  kept[kept.length - 1].push(...chunks.slice(MAX_CHUNKS).flat());
  return kept.map((units) => units.join("\n\n"));
}
