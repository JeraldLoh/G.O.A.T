import { MIN_QUOTE_CHARS } from "@/lib/schemas";

const SINGLE_QUOTES = new Set(["‘", "’", "‚", "‛"]);
const DOUBLE_QUOTES = new Set(["“", "”", "„", "‟"]);
const SOFT_HYPHEN = "­";

/**
 * Normalized text plus, for each normalized UTF-16 unit, the index in the NFKC
 * input it came from. indexOf on `text` alone would give positions in the
 * normalized string, which drift from Bank.sourceText after any collapsed
 * whitespace; `map` translates them back so source links land on the passage.
 */
export function normalizeWithMap(input: string): { text: string; map: number[] } {
  const source = input.normalize("NFKC");
  let text = "";
  const map: number[] = [];
  let pendingSpace: number | null = null;

  const emit = (chars: string, index: number) => {
    if (pendingSpace !== null && text.length > 0) {
      text += " ";
      map.push(pendingSpace);
    }
    pendingSpace = null;
    for (let i = 0; i < chars.length; i++) map.push(index);
    text += chars;
  };

  for (let i = 0; i < source.length; ) {
    const char = String.fromCodePoint(source.codePointAt(i)!);

    // Line-break hyphenation: "photo-\nsynthesis" -> "photosynthesis".
    if (char === "-" && /^\r?\n/.test(source.slice(i + 1, i + 3))) {
      i += source[i + 1] === "\r" ? 3 : 2;
      continue;
    }
    if (char === SOFT_HYPHEN) {
      i += char.length;
      continue;
    }
    if (/\s/u.test(char)) {
      pendingSpace ??= i;
      i += char.length;
      continue;
    }

    if (SINGLE_QUOTES.has(char)) emit("'", i);
    else if (DOUBLE_QUOTES.has(char)) emit('"', i);
    else emit(char.toLowerCase(), i);
    i += char.length;
  }

  return { text, map };
}

export function normalize(input: string): string {
  return normalizeWithMap(input).text;
}

/**
 * Finds a quote in NFKC sourceText. Returns offsets into sourceText, or null if
 * the quote is absent or under MIN_QUOTE_CHARS (short quotes match by accident).
 */
export function locateQuote(
  sourceText: string,
  quote: string,
): { start: number; end: number } | null {
  const needle = normalize(quote);
  if (needle.length < MIN_QUOTE_CHARS) return null;

  const { text, map } = normalizeWithMap(sourceText);
  const position = text.indexOf(needle);
  if (position === -1) return null;

  const last = map[position + needle.length - 1];
  const lastCodePoint = sourceText.normalize("NFKC").codePointAt(last)!;
  return {
    start: map[position],
    end: last + String.fromCodePoint(lastCodePoint).length,
  };
}
