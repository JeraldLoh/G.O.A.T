"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

const BUTTON =
  "press inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-xl bg-primary px-3 text-sm font-semibold text-primary-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

/** Basic back control in the app's olive theme. Goes to the previous screen. */
export function BackLink({
  href,
  label = "Back",
  onClick,
  className,
}: {
  href?: string;
  label?: string;
  onClick?: () => void;
  className?: string;
}) {
  const router = useRouter();

  function goBack() {
    if (onClick) {
      onClick();
      return;
    }
    if (href) {
      router.push(href);
      return;
    }
    router.back();
  }

  return (
    <button type="button" aria-label={label} onClick={goBack} className={cn(BUTTON, className)}>
      <ArrowLeft className="size-4" aria-hidden />
      {label}
    </button>
  );
}
