// npm run eval -- path/to/a.md path/to/b.txt path/to/c.pdf
// Runs the real pipeline on each document and prints the measured numbers.
// Saves to the active store, so banks reach /stats. Use DEMO_MODE=1 for a trial
// run that leaves Supabase alone. With no paths it uses the /seed source texts.
import { readdirSync, readFileSync } from "node:fs";
import { basename, join } from "node:path";
import { extractText } from "@/lib/extract";
import { getGenerator, runPipeline, type PipelineResult } from "@/lib/pipeline";
import { SeedFileSchema, type CreateBankRequest } from "@/lib/schemas";

async function readDocuments(paths: string[]): Promise<{ title: string; text: string }[]> {
  if (paths.length > 0) {
    return Promise.all(
      paths.map(async (path) => ({
        title: basename(path),
        text: await extractText(new File([readFileSync(path)], basename(path))),
      })),
    );
  }
  const dir = join(process.cwd(), "seed");
  return readdirSync(dir)
    .filter((name) => name.endsWith(".json"))
    .map((name) => {
      const { bank } = SeedFileSchema.parse(JSON.parse(readFileSync(join(dir, name), "utf8")));
      return { title: bank.title, text: bank.sourceText };
    });
}

function average(values: number[]): number {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

async function main() {
  const generator = getGenerator();
  console.log(`Model: ${generator.model}`);

  const results: PipelineResult[] = [];
  for (const { title, text } of await readDocuments(process.argv.slice(2))) {
    const input: CreateBankRequest = {
      title,
      subject: "other",
      level: "beginner",
      tags: ["eval"],
      license: "OWN-WORK",
      attribution: "",
      text,
    };
    try {
      const result = await runPipeline(input, () => {}, generator);
      results.push(result);
      const { cardsTotal, cardsVerified, durationMs, costUsd } = result.generation;
      console.log(
        `${title}: ${cardsVerified}/${cardsTotal} verified (${result.cardsVerifiedFirstPass} first pass), ` +
          `${(durationMs / 1000).toFixed(1)}s, $${costUsd.toFixed(6)}`,
      );
    } catch (error) {
      console.error(`${title}: FAILED: ${error instanceof Error ? error.message : error}`);
      process.exitCode = 1;
    }
  }
  if (results.length === 0) return;

  const generations = results.map((result) => result.generation);
  const total = generations.reduce((sum, g) => sum + g.cardsTotal, 0);
  const verified = generations.reduce((sum, g) => sum + g.cardsVerified, 0);
  const firstPass = results.reduce((sum, result) => sum + result.cardsVerifiedFirstPass, 0);

  console.log(`
Banks:                ${results.length}
Cards kept:           ${verified} of ${total} generated
Verified:             ${((verified / total) * 100).toFixed(1)}%
Verified first pass:  ${((firstPass / total) * 100).toFixed(1)}%
Avg generation time:  ${(average(generations.map((g) => g.durationMs)) / 1000).toFixed(1)}s
Avg tokens per bank:  ${Math.round(average(generations.map((g) => g.inputTokens)))} in, ${Math.round(average(generations.map((g) => g.outputTokens)))} out
Avg cost per bank:    $${average(generations.map((g) => g.costUsd)).toFixed(6)} at paid list price`);
}

main();
