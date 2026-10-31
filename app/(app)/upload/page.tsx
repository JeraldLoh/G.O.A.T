"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useBrowserValue } from "@/components/discovery/storage";
import { BankUploadForm, type UploadRequest } from "@/components/upload/BankUploadForm";
import { readWorkspace, saveWorkspace, deleteUpload, EMPTY_WORKSPACE, formatUploadDate, type UploadDraft } from "@/components/upload/workspace";
import { SourcePreview } from "@/components/upload/SourcePreview";

export default function UploadPage() {
  return (
    <Suspense fallback={<div className="p-5 text-sm text-muted-foreground">Opening uploads…</div>}>
      <UploadWorkspace />
    </Suspense>
  );
}

function UploadWorkspace() {
  const workspace = useBrowserValue(readWorkspace, ["kb:upload-workspace"]) ?? EMPTY_WORKSPACE;
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");
  const [selection, setEditing] = useState<UploadDraft | "new" | null>();
  const editing =
    selection === undefined
      ? workspace.drafts.find((item) => item.id === editId) ?? workspace.submissions.find((item) => item.id === editId) ?? null
      : selection;
  const [message, setMessage] = useState("");

  function save(draft: UploadDraft) {
    const current = readWorkspace();
    try {
      saveWorkspace({
        ...current,
        drafts: [...current.drafts.filter((item) => item.id !== draft.id), { ...draft, updatedAt: new Date().toISOString() }],
      });
      setEditing(null);
      setMessage("Draft saved on this device. Pick it up whenever you’re ready.");
    } catch {
      setMessage("Could not save. Device storage may be full. Keep this page open and copy your text.");
    }
  }

  function remove(id: string, title: string, kind: "draft" | "upload") {
    const label = title.trim() || (kind === "draft" ? "this draft" : "this upload");
    if (!window.confirm(`Delete ${label}? This cannot be undone.`)) return;
    try {
      deleteUpload(id);
      setMessage(kind === "draft" ? "Draft deleted from this device." : "Upload deleted from this device.");
    } catch {
      setMessage("Could not delete this item.");
    }
  }

  function submit(request: UploadRequest) {
    const current = readWorkspace();
    const fields = JSON.parse(String(request.body));
    const id = editing && editing !== "new" ? editing.id : crypto.randomUUID();
    const previous = current.submissions.find((item) => item.id === id);
    const now = new Date().toISOString();
    try {
      saveWorkspace({
        drafts: current.drafts.filter((item) => item.id !== id),
        submissions: [
          ...current.submissions.filter((item) => item.id !== id),
          {
            ...fields,
            id,
            sourceFileId: request.sourceFileId,
            fileName: request.fileName,
            status: "Pending approval",
            submittedAt: previous?.submittedAt ?? now,
            updatedAt: previous ? now : undefined,
            views: previous?.views ?? 0,
          },
        ],
      });
      setEditing(null);
      setMessage("Saved as Pending approval on this device. It is not published. Community review is not connected yet.");
    } catch {
      setMessage("Could not save your submission. Your text is still in the form.");
    }
  }

  if (editing) {
    return (
      <div className="flex h-full flex-col">
        {message && <p role="status" className="bg-cream p-3 text-sm">{message}</p>}
        <div className="min-h-0 flex-1">
          <BankUploadForm
            draft={editing === "new" ? undefined : editing}
            onSubmit={submit}
            onSaveDraft={save}
            onExit={() => {
              if (window.confirm("Leave this form? Save a draft first if you want to keep your changes.")) {
                setEditing(null);
                setMessage("");
              }
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-5">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Your uploads</h1>
        <button
          onClick={() => {
            setEditing("new");
            setMessage("");
          }}
          className="min-h-11 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground"
        >
          + Add material
        </button>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">A place for what you know. Saved on this device.</p>
      {message && <p role="status" className="mt-4 rounded-xl bg-cream p-3 text-sm">{message}</p>}

      <section className="mt-6">
        <h2 className="font-semibold">
          Drafts <span className="text-sm text-muted-foreground">({workspace.drafts.length})</span>
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">Private and editable. Not submitted. No item limit.</p>
        {workspace.drafts.length === 0 && (
          <p className="mt-3 rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
            Ideas can take their time. Your drafts will appear here.
          </p>
        )}
        {workspace.drafts.map((draft) => (
          <article key={draft.id} className="mt-3 rounded-xl border p-4">
            <p className="truncate font-medium">{draft.title || "Untitled draft"}</p>
            <p className="mt-1 text-xs text-muted-foreground">Last edited {formatUploadDate(draft.updatedAt)}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                onClick={() => {
                  setEditing(draft);
                  setMessage("");
                }}
                className="min-h-11 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground"
              >
                Continue →
              </button>
              <button
                onClick={() => remove(draft.id, draft.title, "draft")}
                className="min-h-11 rounded-xl border border-brick/40 px-4 text-sm font-semibold text-brick"
              >
                Delete
              </button>
            </div>
          </article>
        ))}
      </section>

      <section className="mt-6">
        <h2 className="font-semibold">
          Submitted <span className="text-sm text-muted-foreground">({workspace.submissions.length})</span>
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">Editable after submit. No item limit.</p>
        <p className="mt-2 rounded-xl bg-muted p-3 text-xs leading-relaxed">
          Review statuses: Approved · Pending approval · Rejected. Safety review is not connected yet, so new submissions stay pending on this device and are not shared.
        </p>
        {workspace.submissions.length === 0 && <p className="mt-3 text-sm text-muted-foreground">No submissions yet.</p>}
        {workspace.submissions.map((item) => (
          <article key={item.id} className="mt-3 rounded-xl border p-4">
            <h3 className="font-medium">{item.title}</h3>
            <span className="mt-1 inline-block rounded-full bg-cream px-2 py-1 text-xs">{item.status}</span>
            <p className="mt-3 text-xs text-muted-foreground">
              Uploaded {formatUploadDate(item.submittedAt)}
              {item.updatedAt ? ` · Last edited ${formatUploadDate(item.updatedAt)}` : ""} · {item.license}
            </p>
            <p className="mt-2 text-sm font-semibold">{(item.views ?? 0).toLocaleString()} audience views</p>
            <SourcePreview text={item.text} sourceFileId={item.sourceFileId} fileName={item.fileName} />
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                onClick={() => {
                  setEditing(item);
                  setMessage("");
                }}
                className="min-h-11 rounded-xl border-2 border-primary px-4 text-sm font-semibold text-olive-deep"
              >
                Edit submission →
              </button>
              <button
                onClick={() => remove(item.id, item.title, "upload")}
                className="min-h-11 rounded-xl border border-brick/40 px-4 text-sm font-semibold text-brick"
              >
                Delete
              </button>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
