"use client";

import { ArrowLeft, ChevronDown, FileText, Upload, X } from "lucide-react";
import { useId, useRef, useState } from "react";
import { LEVEL_ICON, OptionChip } from "@/components/discovery/Chip";
import { LEVEL_LABEL, SUBJECT_META } from "@/components/discovery/subjects";
import { Button } from "@/components/ui/button";
import { guessSubject } from "@/components/upload/guessSubject";
import {
  CreateBankRequestSchema,
  DEFAULT_MAX_WORDS,
  LEVELS,
  LICENSES,
  type Level,
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
 * Two-step upload. Step 1 is only the source (paste, pick or drop a file);
 * step 2 asks for title, level and tags, with license/attribution/URL folded
 * under "Sharing details". Text files are read in the browser and sent as
 * JSON; PDFs go as multipart so the server can extract the text.
 */
export function BankUploadForm({ onSubmit }: { onSubmit: (request: UploadRequest) => void }) {
  const id = useId();
  const fileInput = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<1 | 2>(1);
  const [file, setFile] = useState<File | null>(null);
  const [fileText, setFileText] = useState<string | null>(null); // .md/.txt contents
  const [text, setText] = useState("");
  const [dragging, setDragging] = useState(false);
  const [title, setTitle] = useState("");
  const [level, setLevel] = useState<Level>("beginner");
  const [tagsRaw, setTagsRaw] = useState("");
  const [license, setLicense] = useState<License>("CC-BY-4.0");
  const [attribution, setAttribution] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isPdf = file?.name.toLowerCase().endsWith(".pdf") ?? false;
  const sourceText = fileText ?? text;
  const words = isPdf ? null : countWords(sourceText);
  const tooLong = words !== null && words > DEFAULT_MAX_WORDS;
  const hasSource = isPdf || sourceText.trim().length > 0;
  const tags = parseTags(tagsRaw);
  const subject = guessSubject(title, tags);
  const SubjectIcon = SUBJECT_META[subject].icon;
  const needsAttribution = NEEDS_ATTRIBUTION.includes(license);

  async function pickFile(picked: File | undefined) {
    setErrors({});
    if (!picked) return;
    const name = picked.name.toLowerCase();
    if (![".md", ".txt", ".pdf"].some((ext) => name.endsWith(ext))) {
      setErrors({ text: "Use a .md, .txt or .pdf file." });
      return;
    }
    if (picked.size > MAX_FILE_BYTES) {
      setErrors({ text: "Files must be under 1 MB." });
      return;
    }
    setFile(picked);
    setFileText(name.endsWith(".pdf") ? null : await picked.text());
    // Suggest a title from the file name, e.g. "supply-and-demand.md" -> "Supply and demand".
    if (!title) {
      const base = picked.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").trim();
      setTitle(base.charAt(0).toUpperCase() + base.slice(1));
    }
  }

  function clearFile() {
    setFile(null);
    setFileText(null);
    if (fileInput.current) fileInput.current.value = "";
  }

  function goToDetails() {
    if (!hasSource) return setErrors({ text: "Paste some text or choose a file." });
    if (tooLong) return setErrors({ text: `Keep it under ${DEFAULT_MAX_WORDS.toLocaleString()} words for now.` });
    setErrors({});
    setStep(2);
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fields = {
      title,
      subject,
      level,
      tags,
      license,
      attribution: needsAttribution ? attribution : "",
      sourceUrl: sourceUrl.trim() || undefined,
      // PDFs are extracted on the server; a placeholder keeps the schema check for the other fields.
      text: isPdf ? "pdf" : sourceText,
    };

    const found: Record<string, string> = {};
    const parsed = CreateBankRequestSchema.safeParse(fields);
    if (!parsed.success) {
      for (const issue of parsed.error.issues) found[String(issue.path[0])] ??= "Check this field.";
    }
    if (!title.trim()) found.title = "Give it a title.";
    if (needsAttribution && !attribution.trim()) found.attribution = "This license needs the author's name.";
    if (found.sourceUrl) found.sourceUrl = "Enter a full link, starting with https://";
    setErrors(found);
    if (found.attribution || found.sourceUrl) {
      setDetailsOpen(true);
      // After the section opens, focus (and scroll to) the field that needs fixing.
      const field = found.attribution ? `${id}-attribution` : `${id}-url`;
      setTimeout(() => document.getElementById(field)?.focus(), 0);
    }
    if (Object.keys(found).length > 0 || !parsed.success) return;

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

  const fileInputEl = (
    <input
      ref={fileInput}
      type="file"
      accept=".md,.txt,.pdf,text/markdown,text/plain,application/pdf"
      className="sr-only"
      tabIndex={-1}
      onChange={(event) => pickFile(event.target.files?.[0])}
    />
  );

  if (step === 1) {
    return (
      <div
        className="flex h-full flex-col"
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          pickFile(event.dataTransfer.files[0]);
        }}
      >
        <div className="flex-1 overflow-y-auto p-5">
          <p className="text-sm font-medium text-olive-deep">Step 1 of 2</p>
          <h1 className="mt-0.5 text-2xl font-semibold">Add your material</h1>

          {file ? (
            <div className="mt-5 flex items-center gap-3 rounded-2xl bg-card p-4">
              <FileText aria-hidden className="size-8 shrink-0 text-olive-deep" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{file.name}</p>
                <p className="text-sm text-muted-foreground">
                  {isPdf ? "PDF" : `${words?.toLocaleString()} words`}
                </p>
              </div>
              <button
                type="button"
                aria-label="Remove file"
                onClick={clearFile}
                className="flex size-11 items-center justify-center rounded-full hover:bg-muted"
              >
                <X aria-hidden className="size-5" />
              </button>
            </div>
          ) : (
            <div className="mt-5 grid gap-3">
              <label htmlFor={`${id}-text`} className="sr-only">
                Paste your text
              </label>
              <textarea
                id={`${id}-text`}
                value={text}
                onChange={(event) => {
                  setText(event.target.value);
                  setErrors({});
                }}
                rows={9}
                placeholder="Paste a chapter, article or notes…"
                className={inputClass(errors.text, "rounded-2xl p-4")}
              />
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <span className="h-px flex-1 bg-border" />
                or
                <span className="h-px flex-1 bg-border" />
              </div>
              <button
                type="button"
                onClick={() => fileInput.current?.click()}
                className={cn(
                  "flex min-h-20 flex-col items-center justify-center gap-1 rounded-2xl border-2 border-dashed px-4 py-3 transition-colors hover:bg-muted",
                  dragging ? "border-olive-deep bg-cream" : "border-border",
                )}
              >
                <Upload aria-hidden className="size-6 text-olive-deep" />
                <span className="font-medium">Choose or drop a file</span>
                <span className="text-sm text-muted-foreground">.md, .txt or .pdf, up to 1 MB</span>
              </button>
            </div>
          )}
          {fileInputEl}
          {errors.text && (
            <p role="alert" className="mt-2 text-sm text-destructive">
              {errors.text}
            </p>
          )}
        </div>

        <div className="flex items-center gap-3 border-t bg-background p-4">
          {words !== null && words > 0 && (
            <span className={cn("text-sm text-muted-foreground tabular-nums", tooLong && "text-destructive")}>
              {words.toLocaleString()} / {DEFAULT_MAX_WORDS.toLocaleString()} words
            </span>
          )}
          <Button size="lg" className="ml-auto h-11 min-w-32 text-base" onClick={goToDetails}>
            Next
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={submit}
      // Errors reappear on the next submit; hide stale ones while the user fixes them.
      onInput={() => Object.keys(errors).length > 0 && setErrors({})}
      noValidate
      className="flex h-full flex-col"
    >
      <div className="flex-1 overflow-y-auto p-5">
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label="Back to step 1"
            onClick={() => setStep(1)}
            className="-ml-3 flex size-11 items-center justify-center rounded-full hover:bg-muted"
          >
            <ArrowLeft aria-hidden className="size-5" />
          </button>
          <p className="text-sm font-medium text-olive-deep">Step 2 of 2</p>
          <span className="ml-auto truncate text-sm text-muted-foreground">
            {file ? file.name : `${words?.toLocaleString()} words`}
          </span>
        </div>
        <h1 className="mt-1 text-2xl font-semibold">Describe it</h1>

        <div className="mt-5 grid gap-6">
          <Field label="Title" htmlFor={`${id}-title`} error={errors.title}>
            <input
              id={`${id}-title`}
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="e.g. Supply and Demand"
              className={inputClass(errors.title)}
            />
          </Field>

          <fieldset className="grid gap-2">
            <legend className="mb-2 text-sm font-semibold">Level</legend>
            <div className="flex flex-wrap gap-2">
              {LEVELS.map((value) => (
                <OptionChip
                  key={value}
                  icon={LEVEL_ICON[value]}
                  selected={level === value}
                  onClick={() => setLevel(value)}
                >
                  {LEVEL_LABEL[value]}
                </OptionChip>
              ))}
            </div>
          </fieldset>

          <Field label="Tags" htmlFor={`${id}-tags`} hint="Separate with commas">
            <input
              id={`${id}-tags`}
              value={tagsRaw}
              onChange={(event) => setTagsRaw(event.target.value)}
              placeholder="e.g. economics, markets"
              className={inputClass()}
            />
            <div className="flex flex-wrap items-center gap-1.5" aria-live="polite">
              <span className="inline-flex h-7 items-center gap-1.5 rounded-full bg-cream px-3 text-sm font-medium">
                <SubjectIcon aria-hidden className="size-4 text-olive-deep" />
                {SUBJECT_META[subject].label}
                <span className="sr-only">(topic, from your title and tags)</span>
              </span>
              {tags.map((tag) => (
                <span key={tag} className="inline-flex h-7 items-center rounded-full bg-muted px-3 text-sm">
                  #{tag}
                </span>
              ))}
            </div>
          </Field>

          <section className="rounded-2xl border">
            <button
              type="button"
              aria-expanded={detailsOpen}
              aria-controls={`${id}-details`}
              onClick={() => setDetailsOpen((open) => !open)}
              className="flex min-h-14 w-full items-center gap-3 px-4 text-left"
            >
              <span className="flex-1">
                <span className="block text-sm font-semibold">Sharing details</span>
                <span className="block text-sm text-muted-foreground">
                  {license.replace(/-/g, " ")}
                  {needsAttribution && (attribution ? ` · ${attribution}` : " · credit needed")}
                </span>
              </span>
              <ChevronDown
                aria-hidden
                className={cn("size-5 transition-transform", detailsOpen && "rotate-180")}
              />
            </button>
            <div id={`${id}-details`} hidden={!detailsOpen} className="grid gap-5 border-t p-4">
              <Field
                label="License"
                htmlFor={`${id}-license`}
                hint="Only upload material you're allowed to share."
              >
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
              {needsAttribution && (
                <Field label="Credit the author" htmlFor={`${id}-attribution`} error={errors.attribution}>
                  <input
                    id={`${id}-attribution`}
                    value={attribution}
                    onChange={(event) => setAttribution(event.target.value)}
                    placeholder="e.g. OpenStax, Principles of Economics 3e"
                    className={inputClass(errors.attribution)}
                  />
                </Field>
              )}
              <Field label="Link to the original (optional)" htmlFor={`${id}-url`} error={errors.sourceUrl}>
                <input
                  id={`${id}-url`}
                  value={sourceUrl}
                  onChange={(event) => setSourceUrl(event.target.value)}
                  type="url"
                  inputMode="url"
                  placeholder="https://"
                  className={inputClass(errors.sourceUrl)}
                />
              </Field>
            </div>
          </section>
        </div>
      </div>

      <div className="border-t bg-background p-4">
        <Button type="submit" size="lg" className="h-11 w-full text-base">
          Turn it into cards
        </Button>
      </div>
    </form>
  );
}

function inputClass(error?: string, extra?: string) {
  return cn(
    "min-h-11 w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
    error && "border-destructive",
    extra,
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
    <div className="grid gap-2">
      <label htmlFor={htmlFor} className="text-sm font-semibold">
        {label}
      </label>
      {children}
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : (
        hint && <p className="text-sm text-muted-foreground">{hint}</p>
      )}
    </div>
  );
}
