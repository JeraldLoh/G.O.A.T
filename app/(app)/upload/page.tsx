"use client";

import { useState } from "react";
import { notifyFiltersChanged } from "@/components/discovery/storage";
import { BankUploadForm, type UploadRequest } from "@/components/upload/BankUploadForm";
import { FlowHeader } from "@/components/upload/FlowHeader";
import { GenerationView, type GenerationState } from "@/components/upload/GenerationView";
import { errorMessage, readBankStream } from "@/components/upload/readBankStream";
import { getFilters, getInterests, setFilters, setInterests } from "@/lib/local";
import type { BankSummary } from "@/lib/schemas";

/**
 * Loosen the uploader's own feed filters just enough that the new bank shows up
 * on "Open in feed": add its subject, and drop a level or tag filter it doesn't match.
 */
function makeVisibleInFeed(bank: BankSummary) {
  const interests = getInterests();
  if (interests && !interests.includes(bank.subject)) {
    setInterests([...interests, bank.subject]);
  }
  const filters = getFilters();
  setFilters({
    level: filters.level === bank.level ? filters.level : null,
    tags: filters.tags.some((tag) => bank.tags.includes(tag)) ? filters.tags : [],
  });
  notifyFiltersChanged();
}

export default function UploadPage() {
  const [state, setState] = useState<GenerationState | null>(null);
  const [formKey, setFormKey] = useState(0);

  async function upload({ body, headers, title }: UploadRequest) {
    const update = (patch: Partial<GenerationState>) =>
      setState((current) => (current ? { ...current, ...patch } : current));
    setState({
      title,
      status: "streaming",
      bank: null,
      progress: null,
      cards: [],
      quizzes: [],
      generation: null,
      error: null,
    });

    try {
      const response = await fetch("/api/banks", { method: "POST", body, headers });
      if (!response.ok) {
        update({ status: "error", error: await errorMessage(response) });
        return;
      }
      let finished = false;
      for await (const event of readBankStream(response)) {
        switch (event.type) {
          case "bank":
            update({ bank: event.bank });
            makeVisibleInFeed(event.bank);
            break;
          case "progress":
            update({ progress: { message: event.message, done: event.done, total: event.total } });
            break;
          case "card":
            setState((current) => current && { ...current, cards: [...current.cards, event.card] });
            break;
          case "quiz":
            setState((current) => current && { ...current, quizzes: [...current.quizzes, event.quiz] });
            break;
          case "done":
            finished = true;
            update({ status: "done", generation: event.generation });
            break;
          case "error":
            finished = true;
            update({ status: "error", error: event.message });
            break;
        }
      }
      if (!finished) {
        update({ status: "error", error: "The connection closed before generation finished." });
      }
    } catch {
      update({ status: "error", error: "Couldn't reach the server. Check your connection and try again." });
    }
  }

  return (
    <div className="h-full">
      {state && (
        <div className="flex h-full flex-col">
          <FlowHeader
            label={state.status === "streaming" ? "Making cards" : state.status === "done" ? "Done" : "Upload"}
            progress={state.status === "streaming" ? 0.9 : 1}
          />
          <div className="flex-1 overflow-y-auto p-5">
            <GenerationView
              state={state}
              onReset={() => {
                if (state.status === "done") setFormKey((key) => key + 1); // fresh form after a success
                setState(null);
              }}
            />
          </div>
        </div>
      )}
      {/* Hidden, not unmounted, so "Back to the form" keeps what was typed. */}
      <div hidden={state !== null} className="h-full">
        <BankUploadForm key={formKey} onSubmit={upload} />
      </div>
    </div>
  );
}
