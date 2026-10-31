"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { VideoFeed } from "@/components/video/VideoFeed";
import { VideoStatus } from "@/components/video/VideoStatus";
import { feedContent, useBank } from "@/lib/course";
import type { Chapter, VideoItem } from "@/lib/schemas";

/** Learn more: every chapter of one bank, opening at the chosen topic. */
export function ChapterFeed({ bankId, topic }: { bankId: string; topic?: string }) {
  const router = useRouter();
  const { detail, failed: bankFailed } = useBank(bankId);
  const [chapters, setChapters] = useState<Chapter[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let live = true;
    fetch(`/api/banks/${encodeURIComponent(bankId)}/chapters`)
      .then((response) => {
        if (!response.ok) throw new Error(`Chapters request failed: ${response.status}`);
        return response.json();
      })
      .then((data: Chapter[]) => live && setChapters(data))
      .catch(() => live && setFailed(true));
    return () => {
      live = false;
    };
  }, [bankId]);

  if (failed || bankFailed) {
    return <VideoStatus title="Couldn't load this video" href="/" action="Back to the feed" />;
  }
  if (!chapters || !detail) return <VideoStatus title="Writing your chapters…" />;
  if (chapters.length === 0) {
    return <VideoStatus title="No chapters here yet" href="/" action="Back to the feed" />;
  }

  const { cards, quizzes } = feedContent(detail);
  const items: VideoItem[] = chapters.map((chapter) => ({
    chapter,
    bank: detail.summary,
    cards,
    quizzes: quizzes.filter((quiz) => quiz.topic === chapter.topic),
  }));

  return (
    <VideoFeed
      items={items}
      startIndex={Math.max(0, chapters.findIndex((chapter) => chapter.topic === topic))}
      onClose={() => (window.history.length > 1 ? router.back() : router.push("/"))}
      endTitle="You finished every chapter"
      endBody={detail.bank.title}
    />
  );
}
