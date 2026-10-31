import { MOCK_MODEL } from "@/lib/schemas";

/**
 * USD per 1M tokens, Standard paid tier, from
 * https://ai.google.dev/gemini-api/docs/pricing (checked 2026-10-31).
 * Output includes thinking tokens. Add a row before using a new model.
 */
export const MODEL_PRICES: Record<string, { input: number; output: number }> = {
  "gemini-3.1-flash-lite": { input: 0.25, output: 1.5 },
  "gemini-3.5-flash-lite": { input: 0.3, output: 2.5 },
  [MOCK_MODEL]: { input: 0, output: 0 },
};

export function hasPrice(model: string): boolean {
  return model in MODEL_PRICES;
}

/**
 * Real token counts at the paid list price. On the free tier this is what the
 * run would cost on a paid plan, not what was charged.
 */
export function costUsd(model: string, inputTokens: number, outputTokens: number): number {
  const price = MODEL_PRICES[model];
  if (!price) throw new Error(`No price for ${model}: add it to MODEL_PRICES in lib/cost.ts`);
  return (inputTokens * price.input + outputTokens * price.output) / 1_000_000;
}
