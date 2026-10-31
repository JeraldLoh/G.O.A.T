// Video chapters: a script generated once per bank from its verified cards, then
// reused for every learner. The page plays it live, so there are no video files
// and no per-view cost. Scripts can only cite the bank's cards, so each scene
// keeps that card's verified quote and source link.
import { hasPrice } from "@/lib/cost";
import type { ChapterInput, GeneratedChapters, Usage } from "@/lib/llm";
import { getGenerator, isOverDailyLimit } from "@/lib/pipeline";
import {
  FLAG_HIDE_THRESHOLD,
  type BankFilter,
  type Card,
  type Chapter,
  type VideoItem,
} from "@/lib/schemas";
import { getBank, listBanks, readChapters, saveChapters, saveGeneration } from "@/lib/store";

const FALLBACK_EMOJI = "💡";
const refFor = (index: number) => `c${index + 1}`;

function groupByTopic(cards: Card[]): { topic: string; cards: Card[] }[] {
  return [...new Set(cards.map((card) => card.topic))].map((topic) => ({
    topic,
    cards: cards.filter((card) => card.topic === topic),
  }));
}

/** A topic's chapter using its cards' own words. Needs no AI, so playback always works. */
function chapterFromCards(bankId: string, topic: string, cards: Card[], order: number): Chapter {
  return {
    id: `${bankId}-chapter-${order + 1}`,
    bankId,
    topic,
    title: topic,
    order,
    scenes: cards.map((card) => ({
      cardId: card.id,
      caption: card.title,
      narration: card.body,
      emoji: FALLBACK_EMOJI,
    })),
  };
}

/** Keeps scenes citing a card in their own topic; a topic left with none uses its cards. */
function toChapters(bankId: string, cards: Card[], generated: GeneratedChapters): Chapter[] {
  return groupByTopic(cards).map(({ topic, cards: topicCards }, order) => {
    const written = generated.chapters.find((chapter) => chapter.topic === topic);
    const scenes = (written?.scenes ?? []).flatMap((scene) => {
      const card = topicCards.find((_, index) => refFor(index) === scene.cardRef);
      if (!card) return [];
      const { cardRef: _cardRef, ...rest } = scene;
      return [{ ...rest, cardId: card.id, emoji: rest.emoji || FALLBACK_EMOJI }];
    });
    const fallback = chapterFromCards(bankId, topic, topicCards, order);
    return scenes.length > 0 && written ? { ...fallback, title: written.title, scenes } : fallback;
  });
}

function chaptersFromCards(bankId: string, cards: Card[]): Chapter[] {
  return groupByTopic(cards).map(({ topic, cards: topicCards }, order) =>
    chapterFromCards(bankId, topic, topicCards, order),
  );
}

async function writeScript(bankId: string, title: string, cards: Card[]): Promise<Chapter[]> {
  const fromCards = () => chaptersFromCards(bankId, cards);

  const generator = getGenerator();
  if (!generator.writeChapters || !hasPrice(generator.model) || (await isOverDailyLimit())) {
    return fromCards();
  }

  const topics: ChapterInput[] = groupByTopic(cards).map(({ topic, cards: topicCards }) => ({
    topic,
    cards: topicCards.map((card, index) => ({
      ref: refFor(index),
      title: card.title,
      body: card.body,
      quote: card.quote,
    })),
  }));

  const startedAt = Date.now();
  const usage: Usage = { inputTokens: 0, outputTokens: 0, costUsd: 0 };
  let chapters: Chapter[];
  try {
    chapters = toChapters(bankId, cards, await generator.writeChapters(title, topics, usage));
  } catch (error) {
    console.error("Chapter script failed, using cards", error);
    return fromCards();
  }

  // A failed save only means the script is written again next time.
  await saveChapters(bankId, chapters).catch((error) => {
    console.error("Could not save chapters. Has the chapter_scripts migration run?", error);
  });
  await saveGeneration({
    id: crypto.randomUUID(),
    bankId,
    model: generator.model,
    inputTokens: usage.inputTokens,
    outputTokens: usage.outputTokens,
    costUsd: usage.costUsd,
    durationMs: Date.now() - startedAt,
    cardsTotal: 0, // Marks a script run: lib/store.ts leaves these out of per-bank averages.
    cardsVerified: 0,
    createdAt: new Date().toISOString(),
  }).catch((error) => console.error("Could not record script cost", error));
  return chapters;
}

// Two learners opening a new bank at once should share one LLM call.
const inFlight = new Map<string, Promise<Chapter[]>>();

/** A bank's chapters, without scenes from hidden cards. Null if the bank is unknown. */
export async function getChapters(bankId: string): Promise<Chapter[] | null> {
  const detail = await getBank(bankId);
  if (!detail) return null;

  const visible = visibleCards(detail.cards);
  if (visible.length === 0) return [];

  const saved = await readChapters(bankId).catch((error) => {
    console.error("Could not read chapters", error);
    return null;
  });
  let chapters = saved;
  if (!chapters) {
    let pending = inFlight.get(bankId);
    if (!pending) {
      pending = writeScript(bankId, detail.bank.title, visible).finally(() => inFlight.delete(bankId));
      inFlight.set(bankId, pending);
    }
    chapters = await pending;
  }

  return withoutHiddenCards(chapters, visible);
}

function visibleCards(cards: Card[]): Card[] {
  return cards.filter((card) => card.verified && card.flags < FLAG_HIDE_THRESHOLD);
}

function withoutHiddenCards(chapters: Chapter[], visible: Card[]): Chapter[] {
  const visibleIds = new Set(visible.map((card) => card.id));
  return chapters
    .map((chapter) => ({
      ...chapter,
      scenes: chapter.scenes.filter((scene) => visibleIds.has(scene.cardId)),
    }))
    .filter((chapter) => chapter.scenes.length > 0);
}

/** One at a time, because free-tier keys have low per-minute limits. */
async function writeMissingScripts(bankIds: string[]): Promise<void> {
  for (const bankId of bankIds) {
    await getChapters(bankId).catch((error) => console.error("Background script failed", error));
  }
}

/**
 * Chapters across matching banks, for the Videos tab: each bank's first chapter,
 * then each bank's second, and so on, so one bank doesn't fill the feed. This
 * never waits on the AI: a bank with no script yet shows its cards now and has
 * its script written in the background for the next visit.
 */
export async function getVideoFeed(filter: BankFilter): Promise<VideoItem[]> {
  const banks = await listBanks(filter);
  const details = (await Promise.all(banks.map((bank) => getBank(bank.id)))).flatMap((detail) =>
    detail ? [detail] : [],
  );

  const missing: string[] = [];
  const perBank = await Promise.all(
    details.map(async ({ bank, cards, quizzes, summary }) => {
      const visible = visibleCards(cards);
      if (visible.length === 0) return [];
      const saved = await readChapters(bank.id).catch(() => null);
      if (!saved) missing.push(bank.id);
      return withoutHiddenCards(saved ?? chaptersFromCards(bank.id, visible), visible).map(
        (chapter): VideoItem => ({
          chapter,
          bank: summary,
          cards: visible,
          quizzes: quizzes.filter((quiz) => quiz.topic === chapter.topic),
        }),
      );
    }),
  );
  void writeMissingScripts(missing);

  const rounds = Math.max(0, ...perBank.map((items) => items.length));
  return Array.from({ length: rounds }, (_, round) =>
    perBank.flatMap((items) => (items[round] ? [items[round]] : [])),
  ).flat();
}
