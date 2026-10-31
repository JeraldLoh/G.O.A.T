"use client";

import { useEffect, useState } from "react";
import { VideoFeed } from "@/components/video/VideoFeed";
import { VideoStatus } from "@/components/video/VideoStatus";
import { getFilters, getInterests, getProgress } from "@/lib/local";
import type { VideoItem } from "@/lib/schemas";

function videoQuery(): string {
  const params = new URLSearchParams();
  const interests = getInterests();
  const { tags, level } = getFilters();
  if (interests?.length) params.set("subjects", interests.join(","));
  if (tags.length) params.set("tags", tags.join(","));
  if (level) params.set("level", level);
  return params.toString();
}

/** Unwatched chapters first, keeping the server's mix of banks. */
function unwatchedFirst(items: VideoItem[]): VideoItem[] {
  const seen = new Set(getProgress().seen);
  const watched = (item: VideoItem) => item.chapter.scenes.every((scene) => seen.has(scene.cardId));
  return [...items.filter((item) => !watched(item)), ...items.filter(watched)];
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
      .then((data: VideoItem[]) => live && setItems(unwatchedFirst(data)))
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
