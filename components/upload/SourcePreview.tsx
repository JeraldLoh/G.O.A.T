"use client";

import { useEffect, useState } from "react";
import { loadSourceFile } from "@/components/upload/sourceFiles";

export function SourcePreview({
  text,
  sourceFileId,
  fileName,
  file,
  defaultOpen = false,
}: {
  text: string;
  sourceFileId?: string;
  fileName?: string;
  file?: File | null;
  defaultOpen?: boolean;
}) {
  const isPdf =
    /\.pdf$/i.test(file?.name ?? "") || /\.pdf$/i.test(fileName ?? "") || Boolean(sourceFileId);
  const [open, setOpen] = useState(defaultOpen);
  return (
    <details open={open} onToggle={(event) => setOpen(event.currentTarget.open)} className="mt-4 rounded-xl border p-3">
      <summary className="cursor-pointer text-sm font-semibold">
        Preview source{fileName ? ` · ${fileName}` : isPdf ? " · PDF" : ""}
      </summary>
      {isPdf ? <PdfViewer sourceFileId={sourceFileId} file={file} /> : <PaperText text={text} />}
      {isPdf && text.trim() && (
        <details className="mt-3">
          <summary className="cursor-pointer text-xs font-medium text-olive-deep">Extracted text</summary>
          <PaperText text={text} />
        </details>
      )}
    </details>
  );
}

function PaperText({ text }: { text: string }) {
  return (
    <div className="mt-3 max-h-[55dvh] overflow-auto rounded-xl border bg-white p-4 shadow-inner">
      <pre className="font-sans text-sm leading-relaxed whitespace-pre-wrap break-words text-ink">
        {text || "No text extracted from this file yet."}
      </pre>
    </div>
  );
}

function PdfViewer({ sourceFileId, file }: { sourceFileId?: string; file?: File | null }) {
  const [url, setUrl] = useState<string>();
  const [status, setStatus] = useState("Opening PDF…");

  useEffect(() => {
    let objectUrl: string | undefined;
    let active = true;
    async function open() {
      try {
        const blob = file ?? (sourceFileId ? await loadSourceFile(sourceFileId) : null);
        if (!active) return;
        if (!blob) {
          setStatus("The original PDF is no longer on this device. Choose the file again to restore its preview.");
          return;
        }
        const pdf = blob.type === "application/pdf" ? blob : new Blob([blob], { type: "application/pdf" });
        objectUrl = URL.createObjectURL(pdf);
        setUrl(objectUrl);
        setStatus("");
      } catch {
        if (active) setStatus("Could not display this PDF. The extracted text is below.");
      }
    }
    void open();
    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [file, sourceFileId]);

  if (status) return <p role="status" className="mt-3 rounded-xl bg-muted p-3 text-xs">{status}</p>;
  if (!url) return null;
  return (
    <div className="mt-3 overflow-hidden rounded-xl border bg-muted">
      <iframe
        src={url}
        title="Original PDF"
        className="h-[55dvh] w-full bg-white"
      />
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className="block min-h-11 px-3 py-2 text-center text-xs font-semibold text-olive-deep"
      >
        Open PDF in a new tab
      </a>
    </div>
  );
}
