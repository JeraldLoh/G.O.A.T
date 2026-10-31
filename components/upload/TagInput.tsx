"use client";

import { Plus, X } from "lucide-react";
import { useEffect, useState } from "react";
import type { BankSummary } from "@/lib/schemas";

export const MAX_TAGS = 8;

/** "Number Theory" / "#primes" -> "number-theory" / "primes". */
export function normalizeTag(raw: string): string {
  return raw.trim().toLowerCase().replace(/^#+/, "").replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

/**
 * Chip-style tag entry: type a tag and press Enter, comma or space-free
 * "Add" to make it a chip; Backspace on an empty field removes the last one.
 * Tags already used by other banks show as one-tap suggestions.
 */
export function TagInput({
  id,
  tags,
  onChange,
}: {
  id: string;
  tags: string[];
  onChange: (tags: string[]) => void;
}) {
  const [draft, setDraft] = useState("");
  const [known, setKnown] = useState<string[]>([]);

  useEffect(() => {
    fetch("/api/banks")
      .then((response) => (response.ok ? response.json() : []))
      .then((banks: BankSummary[]) => setKnown([...new Set(banks.flatMap((bank) => bank.tags))].sort()))
      .catch(() => setKnown([]));
  }, []);

  const full = tags.length >= MAX_TAGS;

  function add(raw: string) {
    // Pasting "a, b, c" adds all three.
    const next = [...tags];
    for (const part of raw.split(",")) {
      const tag = normalizeTag(part);
      if (tag && !next.includes(tag) && next.length < MAX_TAGS) next.push(tag);
    }
    onChange(next);
    setDraft("");
  }

  const query = normalizeTag(draft);
  const suggestions = known
    .filter((tag) => !tags.includes(tag) && (!query || tag.includes(query)))
    .slice(0, 6);

  return (
    <div className="grid gap-2">
      <div className="flex min-h-11 flex-wrap items-center gap-1.5 rounded-xl border border-input bg-background px-2 py-1.5 focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50">
        {tags.map((tag) => (
          <span key={tag} className="inline-flex h-8 items-center rounded-full bg-muted pl-3 text-sm font-medium">
            #{tag}
            <button
              type="button"
              aria-label={`Remove tag ${tag}`}
              onClick={() => onChange(tags.filter((t) => t !== tag))}
              className="relative flex h-8 w-8 items-center justify-center rounded-full after:absolute after:-inset-1.5 hover:text-destructive"
            >
              <X aria-hidden className="size-4" />
            </button>
          </span>
        ))}
        {!full && (
          <input
            id={id}
            value={draft}
            onChange={(event) => {
              const value = event.target.value;
              // A typed comma finishes the tag, like most mobile chip inputs.
              if (value.includes(",")) add(value);
              else setDraft(value);
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault(); // don't submit the form
                if (draft.trim()) add(draft);
              } else if (event.key === "Backspace" && !draft && tags.length > 0) {
                onChange(tags.slice(0, -1));
              }
            }}
            onBlur={() => draft.trim() && add(draft)}
            enterKeyHint="done"
            autoCapitalize="none"
            autoCorrect="off"
            placeholder={tags.length === 0 ? "Type a tag, then press Enter" : "Add another"}
            className="h-8 min-w-32 flex-1 bg-transparent px-1.5 text-base outline-none"
          />
        )}
      </div>

      {(suggestions.length > 0 || (query && !tags.includes(query))) && !full && (
        <div className="flex flex-wrap gap-1.5" aria-label="Tag suggestions">
          {query && !tags.includes(query) && !known.includes(query) && (
            <SuggestionChip onClick={() => add(query)}>Add #{query}</SuggestionChip>
          )}
          {suggestions.map((tag) => (
            <SuggestionChip key={tag} onClick={() => add(tag)}>
              #{tag}
            </SuggestionChip>
          ))}
        </div>
      )}
      {full && <p className="text-sm text-muted-foreground">Up to {MAX_TAGS} tags.</p>}
    </div>
  );
}

function SuggestionChip({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      // Keep focus in the input so tapping a suggestion doesn't trigger onBlur first.
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
      className="inline-flex min-h-9 items-center gap-1 rounded-full border border-dashed px-3 text-sm hover:bg-muted"
    >
      <Plus aria-hidden className="size-3.5" />
      {children}
    </button>
  );
}
