"use client";

import { useEffect } from "react";

/**
 * Safari only speaks if speech first started inside a tap, but narration starts
 * later, after videos load and a short delay. So the first tap anywhere in the
 * app speaks one silent utterance, which allows speech for the rest of the visit.
 */
export function SpeechUnlock() {
  useEffect(() => {
    if (!("speechSynthesis" in window)) return;
    const unlock = () => {
      const silent = new SpeechSynthesisUtterance(" ");
      silent.volume = 0;
      window.speechSynthesis.speak(silent);
      window.removeEventListener("click", unlock, true);
      window.removeEventListener("touchend", unlock, true);
    };
    window.addEventListener("click", unlock, true);
    window.addEventListener("touchend", unlock, true);
    return () => {
      window.removeEventListener("click", unlock, true);
      window.removeEventListener("touchend", unlock, true);
    };
  }, []);
  return null;
}
