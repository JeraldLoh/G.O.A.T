"use client";

import { UserRound, Compass, Trophy, Upload } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/", label: "Explore", icon: Compass },
  { href: "/upload", label: "Upload", icon: Upload },
  { href: "/progress", label: "My Learning", icon: Trophy },
  { href: "/profile", label: "Profile", icon: UserRound },
];

export function TabBar() {
  const pathname = usePathname();

  return (
    <nav className="grid grid-cols-4 border-t bg-background pb-[env(safe-area-inset-bottom)]">
      {TABS.map(({ href, label, icon: Icon }) => {
        const active =
          href === "/"
            ? pathname === "/" || pathname.startsWith("/learn/")
            : pathname === href || pathname.startsWith(`${href}/`);
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
