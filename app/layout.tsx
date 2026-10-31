import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Community Knowledge Bank",
  description: "Open learning material turned into a free, swipeable feed of cards and quizzes.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Draw under the notch / home indicator; the shell pads with safe-area insets.
  viewportFit: "cover",
  // Shrink the page when the keyboard opens, so bottom action bars stay visible.
  interactiveWidget: "resizes-content",
  themeColor: "#fbf6ea",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="h-full bg-muted">{children}</body>
    </html>
  );
}
