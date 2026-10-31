"use client";

import { CircleCheck } from "lucide-react";
import { useEffect, useState } from "react";

const TOAST_EVENT = "kb:toast";
const SHOW_MS = 2600;

/** Show a short confirmation above the tab bar, e.g. toast("Reported. Thanks!"). */
export function toast(message: string): void {
  window.dispatchEvent(new CustomEvent<string>(TOAST_EVENT, { detail: message }));
}

/** Mounted once in the app shell. Announces each toast to screen readers too. */
export function Toaster() {
  const [message, setMessage] = useState<{ text: string; id: number } | null>(null);

  useEffect(() => {
    const show = (event: Event) =>
      setMessage({ text: (event as CustomEvent<string>).detail, id: Date.now() });
    window.addEventListener(TOAST_EVENT, show);
    return () => window.removeEventListener(TOAST_EVENT, show);
  }, []);

  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => setMessage(null), SHOW_MS);
    return () => clearTimeout(timer);
  }, [message]);

  return (
    <div
      aria-live="polite"
      className="pointer-events-none absolute inset-x-0 bottom-[calc(5rem+env(safe-area-inset-bottom))] z-[60] flex justify-center px-4"
    >
      {message && (
        <p
          key={message.id}
          className="flex items-center gap-2 rounded-full bg-ink px-4 py-2.5 text-sm font-medium text-paper shadow-lg duration-200 animate-in fade-in-0 slide-in-from-bottom-2"
        >
          <CircleCheck aria-hidden className="size-4 text-sunflower" />
          {message.text}
        </p>
      )}
    </div>
  );
}
