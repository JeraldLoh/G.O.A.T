"use client";

import { FileUp, X } from "lucide-react";
import { useId, useRef, useState } from "react";
import { LEVEL_LABEL, SUBJECT_META } from "@/components/discovery/subjects";
import { Button } from "@/components/ui/button";
import {
  CreateBankRequestSchema,
  DEFAULT_MAX_WORDS,
  LEVELS,
  LICENSES,
  SUBJECTS,
  type License,
} from "@/lib/schemas";
import { cn } from "@/lib/utils";

const MAX_FILE_BYTES = 1_000_000;

export const LICENSE_LABEL: Record<License, string> = {
  "CC0-1.0": "CC0 1.0 (no rights reserved)",
  "CC-BY-4.0": "CC BY 4.0 (credit the author)",
  "CC-BY-SA-4.0": "CC BY-SA 4.0 (credit + share alike)",
  "CC-BY-NC-SA-4.0": "CC BY-NC-SA 4.0 (non-commercial)",
  "PUBLIC-DOMAIN": "Public domain",
  "OWN-WORK": "My own work (shared openly)",
};

/** Licenses whose terms require crediting the author. */
const NEEDS_ATTRIBUTION: License[] = ["CC-BY-4.0", "CC-BY-SA-4.0", "CC-BY-NC-SA-4.0"];

export type UploadRequest = { body: BodyInit; headers?: HeadersInit; title: string };

const countWords = (text: string) => text.trim().split(/\s+/).filter(Boolean).length;

export function parseTags(raw: string): string[] {
  const tags = raw
    .split(",")
    .map((tag) => tag.trim().toLowerCase().replace(/^#/, "").replace(/\s+/g, "-"))
    .filter(Boolean);
  return [...new Set(tags)];
}

/**
 * Upload form: pasted text or a .md/.txt/.pdf file plus tags and license.
 * Text files are read in the browser and sent as JSON; PDFs go as multipart so
 * the server can extract the text.
 */
export function BankUploadForm({ onSubmit }: { onSubmit: (request: UploadRequest) => void }) {
  const id = useId();
  const fileInput = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [fileText, setFileText] = useState<string | null>(null); // .md/.txt contents
  const [text, setText] = useState("");
  const [tagsRaw, setTagsRaw] = useState("");
  const [license, setLicense] = useState<License>("CC-BY-4.0");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isPdf = file?.name.toLowerCase().endsWith(".pdf") ?? false;
  const sourceText = fileText ?? text;
  const words = isPdf ? null : countWords(sourceText);
  const tooLong = words !== null && words > DEFAULT_MAX_WORDS;

  async function pickFile(picked: File | undefined) {
    setErrors((current) => ({ ...current, text: "" }));
    if (!picked) return;
    const name = picked.name.toLowerCase();
    if (![".md", ".txt", ".pdf"].some((ext) => name.endsWith(ext))) {
      setErrors((current) => ({ ...current, text: "Use a .md, .txt or .pdf file." }));
      return;
    }
    if (picked.size > MAX_FILE_BYTES) {
      setErrors((current) => ({ ...current, text: "Files must be under 1 MB." }));
      return;
    }
    setFile(picked);
    setFileText(name.endsWith(".pdf") ? null : await picked.text());
  }

  function clearFile() {
    setFile(null);
    setFileText(null);
    if (fileInput.current) fileInput.current.value = "";
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const fields = {
      title: String(data.get("title") ?? ""),
      subject: String(data.get("subject") ?? ""),
      level: String(data.get("level") ?? ""),
      tags: parseTags(tagsRaw),
      license,
      attribution: String(data.get("attribution") ?? ""),
      sourceUrl: String(data.get("sourceUrl") ?? "").trim() || undefined,
      // PDFs are extracted on the server; a placeholder keeps the schema check for the other fields.
      text: isPdf ? "pdf" : sourceText,
    };

    const next: Record<string, string> = {};
    const parsed = CreateBankRequestSchema.safeParse(fields);
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0]);
        next[key] ??= key === "text" ? "Paste some text or choose a file." : "Check this field.";
      }
    }
    if (!fields.title.trim()) next.title = "Give the bank a title.";
    if (NEEDS_ATTRIBUTION.includes(license) && !fields.attribution.trim()) {
      next.attribution = "This license requires crediting the author.";
    }
    if (tooLong) next.text = `Keep it under ${DEFAULT_MAX_WORDS.toLocaleString()} words for now.`;
    setErrors(next);
    if (Object.values(next).some(Boolean) || !parsed.success) return;

    if (isPdf && file) {
      const form = new FormData();
      for (const [key, value] of Object.entries(parsed.data)) {
        if (key === "text" || value === undefined) continue;
        form.set(key, Array.isArray(value) ? value.join(",") : String(value));
      }
      form.set("file", file);
      onSubmit({ body: form, title: parsed.data.title });
    } else {
      onSubmit({
        body: JSON.stringify(parsed.data),
        headers: { "Content-Type": "application/json" },
        title: parsed.data.title,
      });
    }
  }

  const tags = parseTags(tagsRaw);

  return (
    <form
      onSubmit={submit}
      // Errors reappear on the next submit; hide stale ones while the user fixes them.
      onInput={() => Object.values(errors).some(Boolean) && setErrors({})}
      noValidate
      className="grid gap-5"
    >
      <Field label="Source material" htmlFor={file ? undefined : `${id}-text`} error={errors.text}>
        {file ? (
          <div className="flex items-center gap-3 rounded-lg border bg-card p-3">
            <FileUp aria-hidden className="size-5 shrink-0 text-olive-deep" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{file.name}</p>
              <p className="text-xs text-muted-foreground">
                {isPdf
                  ? "PDF: text is extracted on the server"
                  : `${words?.toLocaleString()} words`}
              </p>
            </div>
            <Button variant="ghost" size="icon-sm" aria-label="Remove file" onClick={clearFile}>
              <X aria-hidden />
            </Button>
          </div>
        ) : (
          <>
            <textarea
              id={`${id}-text`}
              value={text}
              onChange={(event) => setText(event.target.value)}
              rows={7}
              placeholder="Paste a chapter, article or notes you're allowed to share…"
              className={inputClass(errors.text)}
            />
            <div className="flex items-center justify-between gap-2">
              <Button variant="outline" size="sm" onClick={() => fileInput.current?.click()}>
                <FileUp aria-hidden />
                Or choose a file
              </Button>
              <span className={cn("text-xs text-muted-foreground", tooLong && "text-destructive")}>
                {words?.toLocaleString()} / {DEFAULT_MAX_WORDS.toLocaleString()} words
              </span>
            </div>
          </>
        )}
        <input
          ref={fileInput}
          type="file"
          accept=".md,.txt,.pdf,text/markdown,text/plain,application/pdf"
          className="sr-only"
          tabIndex={-1}
          onChange={(event) => pickFile(event.target.files?.[0])}
        />
      </Field>

      <Field label="Title" htmlFor={`${id}-title`} error={errors.title}>
        <input
          id={`${id}-title`}
          name="title"
          placeholder="e.g. Intro to Supply and Demand"
          className={inputClass(errors.title)}
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Subject" htmlFor={`${id}-subject`} error={errors.subject}>
          <select id={`${id}-subject`} name="subject" defaultValue="science" className={inputClass()}>
            {SUBJECTS.map((subject) => (
              <option key={subject} value={subject}>
                {SUBJECT_META[subject].label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Level" htmlFor={`${id}-level`} error={errors.level}>
          <select id={`${id}-level`} name="level" defaultValue="beginner" className={inputClass()}>
            {LEVELS.map((level) => (
              <option key={level} value={level}>
                {LEVEL_LABEL[level]}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field label="Tags" htmlFor={`${id}-tags`} hint="Comma separated, e.g. economics, markets">
        <input
          id={`${id}-tags`}
          value={tagsRaw}
          onChange={(event) => setTagsRaw(event.target.value)}
          className={inputClass()}
        />
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <span key={tag} className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium">
                #{tag}
              </span>
            ))}
          </div>
        )}
      </Field>

      <Field label="License" htmlFor={`${id}-license`} hint="Only upload material you're allowed to share.">
        <select
          id={`${id}-license`}
          value={license}
          onChange={(event) => setLicense(event.target.value as License)}
          className={inputClass()}
        >
          {LICENSES.map((value) => (
            <option key={value} value={value}>
              {LICENSE_LABEL[value]}
            </option>
          ))}
        </select>
      </Field>

      <Field
        label={NEEDS_ATTRIBUTION.includes(license) ? "Attribution" : "Attribution (optional)"}
        htmlFor={`${id}-attribution`}
        error={errors.attribution}
        hint="Author and where it's from, e.g. “OpenStax, Principles of Economics 3e”"
      >
        <input id={`${id}-attribution`} name="attribution" className={inputClass(errors.attribution)} />
      </Field>

      <Field label="Source URL (optional)" htmlFor={`${id}-url`} error={errors.sourceUrl}>
        <input
          id={`${id}-url`}
          name="sourceUrl"
          type="url"
          inputMode="url"
          placeholder="https://"
          className={inputClass(errors.sourceUrl)}
        />
      </Field>

      <Button type="submit" size="lg" className="h-11">
        Turn it into cards
      </Button>
    </form>
  );
}

function inputClass(error?: string) {
  return cn(
    "w-full rounded-lg border border-input bg-background px-3 py-2 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 sm:text-sm",
    error && "border-destructive",
  );
}

function Field({
  label,
  htmlFor,
  hint,
  error,
  children,
}: {
  label: string;
  htmlFor?: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-1.5">
      <label htmlFor={htmlFor} className="text-sm font-medium">
        {label}
      </label>
      {children}
      {error ? (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      ) : (
        hint && <p className="text-xs text-muted-foreground">{hint}</p>
      )}
    </div>
  );
}
