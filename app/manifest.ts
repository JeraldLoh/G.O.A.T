import type { MetadataRoute } from "next";

// Lane B1. Installable PWA: manifest only, no service worker (see CLAUDE.md).
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Community Knowledge Bank",
    short_name: "Knowledge Bank",
    description: "Open learning material turned into a free, swipeable feed of cards and quizzes.",
    start_url: "/",
    display: "standalone",
    background_color: "#fbf6ea",
    theme_color: "#797d62",
    icons: [{ src: "/favicon.ico", sizes: "any", type: "image/x-icon" }],
  };
}
