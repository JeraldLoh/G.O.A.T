import { ChapterFeed } from "@/components/video/ChapterFeed";

// /learn/[bankId]?topic=… opens a bank's video chapters, at that topic's chapter if given.
export default async function LearnPage({
  params,
  searchParams,
}: {
  params: Promise<{ bankId: string }>;
  searchParams: Promise<{ topic?: string }>;
}) {
  const { bankId } = await params;
  const { topic } = await searchParams;
  return <ChapterFeed bankId={bankId} topic={topic} />;
}
