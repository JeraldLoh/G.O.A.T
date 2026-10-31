"use client";

import { BarChart3, Layers, Trophy, Upload } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/", label: "Feed", icon: Layers },
  { href: "/upload", label: "Upload", icon: Upload },
  { href: "/progress", label: "Progress", icon: Trophy },
  { href: "/stats", label: "Stats", icon: BarChart3 },
];

/** Routes that run as a full-screen flow with their own exit, so the tab bar steps aside. */
const FULL_SCREEN = ["/upload", "/learn"];

export function TabBar() {
  const pathname = usePathname();
  if (FULL_SCREEN.some((route) => pathname.startsWith(route))) return null;

  return (
    <nav className="grid grid-cols-4 border-t bg-background pb-[env(safe-area-inset-bottom)]">
      {TABS.map(({ href, label, icon: Icon }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "press flex min-h-16 flex-col items-center justify-center gap-1 text-xs text-muted-foreground transition-transform",
              active && "font-semibold text-foreground",
            )}
          >
            {/* Active tab: a filled pill behind the icon, like native tab bars. */}
            <span
              className={cn(
                "flex h-8 w-14 items-center justify-center rounded-full transition-colors",
                active && "bg-cream",
              )}
            >
              <Icon className={cn("size-5", active && "text-olive-deep")} aria-hidden />
            </span>
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
