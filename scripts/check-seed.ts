// npm run check:seed — every seed must parse, and every quote must exist in its
// source at the stored offsets. Exits 1 on any failure.
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { SeedFileSchema } from "@/lib/schemas";
import { locateQuote, normalize } from "@/lib/verify";

const dir = join(process.cwd(), "seed");
const files = readdirSync(dir).filter((file) => file.endsWith(".json"));
const errors: string[] = [];

for (const file of files) {
  const parsed = SeedFileSchema.safeParse(JSON.parse(readFileSync(join(dir, file), "utf8")));
  if (!parsed.success) {
    errors.push(`${file}: ${parsed.error.message}`);
    continue;
  }
  const { bank, cards, quizzes } = parsed.data;

  if (bank.sourceText !== bank.sourceText.normalize("NFKC")) {
    errors.push(`${file}: sourceText is not NFKC-normalized`);
  }
  for (const card of cards) {
    const found = locateQuote(bank.sourceText, card.quote);
    if (!found) {
      errors.push(`${file}: ${card.id}: quote not found in source`);
    } else if (found.start !== card.sourceStart || found.end !== card.sourceEnd) {
      errors.push(`${file}: ${card.id}: stored offsets differ from located quote`);
    } else if (
      normalize(bank.sourceText.slice(found.start, found.end)) !== normalize(card.quote)
    ) {
      errors.push(`${file}: ${card.id}: offsets do not slice back to the quote`);
    }
  }
  const topics = new Set(cards.map((card) => card.topic));
  for (const quiz of quizzes) {
    if (!topics.has(quiz.topic)) errors.push(`${file}: ${quiz.id}: no cards in this topic`);
  }
  console.log(`${file}: ${cards.length} cards, ${quizzes.length} quizzes`);
}

if (files.length === 0) errors.push("no seed files found");
if (errors.length > 0) {
  console.error(errors.join("\n"));
  process.exit(1);
}
console.log(`OK: ${files.length} seed files verified`);
