import { z } from "zod";
import type { Chapter, StockVideo } from "@/lib/schemas";

const API_URL = "https://pixabay.com/api/videos/";
const REQUEST_TIMEOUT_MS = 8000;
const RESULTS_PER_SEARCH = 10;

const SearchSchema = z.object({
  hits: z.array(
    z.object({
      id: z.number(),
      pageURL: z.string(),
      user: z.string(),
      // tiny is the lightest rendition, which suits a phone on conference Wi-Fi.
      videos: z.object({ tiny: z.object({ url: z.string(), thumbnail: z.string() }) }),
    }),
  ),
});

export const hasStockKey = () => Boolean(process.env.PIXABAY_API_KEY);

/** First result not already in `used`, or null. Never throws: a scene can go without a video. */
async function findVideo(query: string, used: Set<string>): Promise<StockVideo | null> {
  const params = new URLSearchParams({
    key: process.env.PIXABAY_API_KEY ?? "",
    q: query,
    video_type: "film",
    safesearch: "true",
    per_page: String(RESULTS_PER_SEARCH),
  });
  try {
    const response = await fetch(`${API_URL}?${params}`, {
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    if (!response.ok) throw new Error(`Pixabay ${response.status}`);
    const { hits } = SearchSchema.parse(await response.json());
    const hit = hits.find((candidate) => !used.has(candidate.videos.tiny.url));
    if (!hit) return null;
    used.add(hit.videos.tiny.url);
    return {
      url: hit.videos.tiny.url,
      poster: hit.videos.tiny.thumbnail,
      credit: hit.user,
      pageUrl: hit.pageURL,
    };
  } catch (error) {
    console.error(`Stock video search failed for "${query}"`, error);
    return null;
  }
}

/**
 * Picks a background clip for every scene that has a search term but no video yet,
 * so a bank gets different clips and only searches once. Clips are decoration:
 * facts stay in the captions and narration, which come from verified cards.
 */
export async function attachVideos(chapters: Chapter[]): Promise<Chapter[]> {
  if (!hasStockKey()) return chapters;

  const used = new Set(
    chapters.flatMap((chapter) => chapter.scenes.flatMap((scene) => scene.video?.url ?? [])),
  );
  const result: Chapter[] = [];
  // One at a time, so clips within a bank can't race each other into duplicates.
  for (const chapter of chapters) {
    const scenes = [];
    for (const scene of chapter.scenes) {
      const needsVideo = scene.videoQuery && scene.video === undefined;
      scenes.push(
        needsVideo ? { ...scene, video: await findVideo(scene.videoQuery!, used) } : scene,
      );
    }
    result.push({ ...chapter, scenes });
  }
  return result;
}
