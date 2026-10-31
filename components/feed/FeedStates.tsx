import Link from "next/link";

/** Error, loading and empty screens shared by the home feed's tabs. Renders nothing once there is content. */
export function FeedStates({
  loading,
  failed,
  empty,
  onRetry,
  emptyTitle,
}: {
  loading: boolean;
  failed: boolean;
  empty: boolean;
  onRetry: () => void;
  emptyTitle: string;
}) {
  if (failed) {
    return (
      <FeedMessage
        title="Could not load the feed"
        body="Check your connection and try again."
      >
        <button
          type="button"
          onClick={onRetry}
          className="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground"
        >
          Retry
        </button>
      </FeedMessage>
    );
  }
  if (loading) return <FeedMessage title="Loading your feed…" />;
  if (empty) {
    return (
      <FeedMessage
        title={emptyTitle}
        body="Nothing matches your interests and filters. Change them, or add the first bank."
      >
        <Link
          href="/upload"
          className="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground"
        >
          Upload a bank
        </Link>
      </FeedMessage>
    );
  }
  return null;
}

/** One full-height snap slot with a centered message. */
export function FeedMessage({
  title,
  body,
  children,
}: {
  title: string;
  body?: string;
  children?: React.ReactNode;
}) {
  return (
    <section className="flex h-full snap-start flex-col items-center justify-center gap-3 p-6 text-center">
      <h2 className="text-xl font-semibold">{title}</h2>
      {body && <p className="max-w-xs text-sm text-muted-foreground">{body}</p>}
      {children}
    </section>
  );
}
