"use client";

import { Flag } from "lucide-react";
import { useState } from "react";
import { addFlagged, useFlagged } from "@/components/discovery/storage";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getDeviceId } from "@/lib/local";
import { FLAG_HIDE_THRESHOLD } from "@/lib/schemas";
import { cn } from "@/lib/utils";

const REASONS = [
  "Incorrect or misleading",
  "Quote doesn't match the source",
  "Unclear or low quality",
  "Inappropriate content",
];

/**
 * Report a card. Cards with FLAG_HIDE_THRESHOLD reports from different devices
 * leave the feed. onFlagged lets the feed hide the card for this user right away.
 */
export function FlagButton({
  cardId,
  onFlagged,
}: {
  cardId: string;
  onFlagged?: (flags: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const flagged = useFlagged(cardId);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function report(reason: string) {
    setSending(true);
    setError(null);
    try {
      const response = await fetch("/api/flag", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cardId, deviceId: getDeviceId(), reason }),
      });
      if (!response.ok) throw new Error(`Flag failed: ${response.status}`);
      const { flags } = (await response.json()) as { flags: number };
      addFlagged(cardId);
      setOpen(false);
      onFlagged?.(flags);
    } catch {
      setError("Couldn't send the report. Try again.");
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        disabled={flagged}
        onClick={() => setOpen(true)}
        className={cn("text-muted-foreground", flagged && "opacity-100")}
      >
        <Flag aria-hidden className={cn(flagged && "fill-current")} />
        {flagged ? "Reported" : "Report"}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Report this card</DialogTitle>
            <DialogDescription>
              Cards reported by {FLAG_HIDE_THRESHOLD} people are removed from the feed.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2">
            {REASONS.map((reason) => (
              <Button
                key={reason}
                variant="outline"
                className="h-10 justify-start"
                disabled={sending}
                onClick={() => report(reason)}
              >
                {reason}
              </Button>
            ))}
          </div>
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
