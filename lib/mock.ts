import type { Generator } from "@/lib/llm";
import { MIN_QUOTE_CHARS, MOCK_MODEL } from "@/lib/schemas";

const CARDS_PER_CHUNK = 3;

/** No-LLM generator: real sentences from the text become cards, so uploads work without a key. */
export const mockGenerator: Generator = {
  model: MOCK_MODEL,
  async generate(title, chunk) {
    const topic = chunk.match(/^#+\s*(.+)$/m)?.[1]?.trim() ?? title;
    const prose = chunk.replace(/^#+.*$/gm, "");
    const sentences = (prose.match(/[^.!?\n]+[.!?]+/g) ?? [])
      .map((sentence) => sentence.trim())
      .filter((sentence) => sentence.length >= MIN_QUOTE_CHARS);
    const picked = sentences.slice(0, CARDS_PER_CHUNK);

    return {
      cards: picked.map((sentence) => ({
        topic,
        title: sentence.split(/\s+/).slice(0, 5).join(" "),
        body: sentence,
        quote: sentence,
      })),
      quizzes: picked.slice(0, 1).map((sentence) => ({
        topic,
        question: `Does the source say: "${sentence}"`,
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
