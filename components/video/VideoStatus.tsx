import Link from "next/link";

/** Full-screen loading, empty or error message on the video background. */
export function VideoStatus({
  title,
  body,
  href,
  action,
}: {
  title: string;
  body?: string;
  href?: string;
  action?: string;
}) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 bg-ink p-6 text-center text-cream">
      <h1 className="text-xl font-semibold">{title}</h1>
      {body && <p className="max-w-xs text-sm">{body}</p>}
      {href && (
        <Link href={href} className="text-sm underline underline-offset-4">
          {action}
        </Link>
      )}
    </div>
  );
}
