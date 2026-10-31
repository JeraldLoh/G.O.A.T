"use client";

import Link from "next/link";
import { Eye, Pencil } from "lucide-react";
import { useState } from "react";
import { useBrowserValue } from "@/components/discovery/storage";
import { BackLink } from "@/components/shell/BackLink";
import { readWorkspace, deleteUpload, EMPTY_WORKSPACE, formatUploadDate } from "@/components/upload/workspace";
import { SourcePreview } from "@/components/upload/SourcePreview";

export default function ContributionsPage() {
  const workspace = useBrowserValue(readWorkspace, ["kb:upload-workspace"]) ?? EMPTY_WORKSPACE;
  const [message, setMessage] = useState("");
  function remove(id: string, title: string) {
    if (!window.confirm(`Delete ${title.trim() || "this upload"}? This cannot be undone.`)) return;
    try {
      deleteUpload(id);
      setMessage("Upload deleted from this device.");
    } catch {
      setMessage("Could not delete this upload.");
    }
  }
  const items = [...workspace.submissions].sort((a, b) =>
    (b.updatedAt ?? b.submittedAt).localeCompare(a.updatedAt ?? a.submittedAt),
  );
  const totalViews = items.reduce((sum, item) => sum + (item.views ?? 0), 0);

  return (
    <div className="h-full overflow-y-auto p-5">
      <BackLink href="/profile" />
      <h1 className="mt-4 text-xl font-semibold">My Contributions</h1>
      <p className="mt-3 text-sm text-muted-foreground">The knowledge you’ve shared, all in one place.</p>
      {message && <p role="status" className="mt-3 rounded-xl bg-cream p-3 text-sm">{message}</p>}
      <div className="mt-4 grid grid-cols-3 gap-2 text-center text-sm">
        <div className="rounded-xl bg-cream px-2 py-3">
          <p className="text-lg font-semibold tabular-nums">{items.length}</p>
          <p className="text-[11px] text-muted-foreground">uploads</p>
        </div>
        <div className="rounded-xl bg-cream px-2 py-3">
          <p className="text-lg font-semibold tabular-nums">{totalViews.toLocaleString()}</p>
          <p className="text-[11px] text-muted-foreground">audience views</p>
        </div>
        <Link href="/upload" className="flex flex-col items-center justify-center rounded-xl border px-2 py-3 font-medium">
          <span className="text-lg font-semibold tabular-nums">{workspace.drafts.length}</span>
          <span className="text-[11px]">drafts →</span>
        </Link>
      </div>
      <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
        Saved on this device. Audience view counts appear after a bank is approved and opened by learners. Previewing or editing your own work does not count.
      </p>
      {items.length === 0 && (
        <div className="mt-5 rounded-2xl border border-dashed p-5">
          <p className="font-medium">Your first contribution starts here.</p>
          <Link href="/upload" className="mt-3 inline-flex min-h-11 items-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground">
            Add material →
          </Link>
        </div>
      )}
      {items.map((item) => (
        <article key={item.id} className="mt-4 rounded-2xl border p-4">
          <span className="inline-block rounded-full bg-cream px-2.5 py-1 text-xs font-medium">{item.status}</span>
          <h2 className="mt-2 text-lg font-semibold break-words">{item.title}</h2>
          <div className="mt-3 flex items-center gap-2 rounded-xl bg-linen px-3 py-3">
            <Eye className="size-5 text-olive-deep" aria-hidden />
            <div>
              <p className="text-2xl font-semibold tabular-nums leading-none">{(item.views ?? 0).toLocaleString()}</p>
              <p className="mt-1 text-[11px] text-muted-foreground">people viewed this</p>
            </div>
          </div>
          <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
            <div>
              <dt className="text-muted-foreground">Uploaded</dt>
              <dd>{formatUploadDate(item.submittedAt)} SGT</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Last edited</dt>
              <dd>{item.updatedAt ? `${formatUploadDate(item.updatedAt)} SGT` : "No edits yet"}</dd>
            </div>
          </dl>
          <SourcePreview text={item.text} sourceFileId={item.sourceFileId} fileName={item.fileName} />
          <div className="mt-3 flex flex-wrap gap-2">
            <Link
              href={`/upload?edit=${encodeURIComponent(item.id)}`}
              className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground"
            >
              <Pencil className="size-4" aria-hidden />
              Edit contribution
            </Link>
            <button
              onClick={() => remove(item.id, item.title)}
              className="min-h-11 rounded-xl border border-brick/40 px-4 text-sm font-semibold text-brick"
            >
              Delete
            </button>
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground">Saved edits return to Pending approval.</p>
        </article>
      ))}
    </div>
  );
}
