"use client";

import { useEffect, useState } from "react";
import { VideoFeed } from "@/components/video/VideoFeed";
import { VideoStatus } from "@/components/video/VideoStatus";
import { getFilters, getInterests, getProgress } from "@/lib/local";
import type { VideoItem } from "@/lib/schemas";
import { shuffle } from "@/lib/shuffle";

function videoQuery(): string {
  const params = new URLSearchParams();
  const interests = getInterests();
  const { tags, level } = getFilters();
  if (interests?.length) params.set("subjects", interests.join(","));
  if (tags.length) params.set("tags", tags.join(","));
  if (level) params.set("level", level);
  return params.toString();
}

/**
 * Banks in random order like the Fun facts feed (a new shuffle per visit), one
 * chapter from each in turn. Within a bank, chapters stay in sequence from the
 * next unwatched one, so nobody starts on chapter 2. Watched chapters go last.
 */
function nextUpFirst(items: VideoItem[]): VideoItem[] {
  const watched = new Set(getProgress().watched);
  const unwatched = (item: VideoItem) => !watched.has(item.chapter.id);
  const queues = shuffle([...new Set(items.map((item) => item.bank.id))], Date.now()).map((bankId) =>
    items
      .filter((item) => item.bank.id === bankId && unwatched(item))
      .sort((a, b) => a.chapter.order - b.chapter.order),
  );
  const rounds = Math.max(0, ...queues.map((queue) => queue.length));
  const next = Array.from({ length: rounds }, (_, round) =>
    queues.flatMap((queue) => (queue[round] ? [queue[round]] : [])),
  ).flat();
  return [...next, ...items.filter((item) => !unwatched(item))];
}

/** The Videos tab: chapters from every bank matching the learner's interests and filters. */
export function VideosTab() {
  const [items, setItems] = useState<VideoItem[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let live = true;
    const query = videoQuery();
    fetch(`/api/videos${query ? `?${query}` : ""}`)
      .then((response) => {
        if (!response.ok) throw new Error(`Videos request failed: ${response.status}`);
        return response.json();
      })
      .then((data: VideoItem[]) => live && setItems(nextUpFirst(data)))
      .catch(() => live && setFailed(true));
    return () => {
      live = false;
    };
  }, []);

  if (failed) return <VideoStatus title="Couldn't load videos" href="/" action="Back to the feed" />;
  if (!items) return <VideoStatus title="Loading videos…" />;
  if (items.length === 0) {
    return (
      <VideoStatus
        title="No videos yet"
        body="No banks match your interests and filters."
        href="/upload"
        action="Upload a bank"
      />
    );
  }
  return (
    <VideoFeed
      items={items}
      endTitle="You're all caught up"
      endBody="That's every video for your interests."
    />
  );
}
