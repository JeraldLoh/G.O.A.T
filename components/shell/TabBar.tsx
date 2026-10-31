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

export function TabBar() {
  const pathname = usePathname();
  return (
    <nav className="grid grid-cols-4 border-t pb-[env(safe-area-inset-bottom)]">
      {TABS.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          aria-current={pathname === href ? "page" : undefined}
          className={cn(
            "flex flex-col items-center gap-0.5 py-2 text-xs text-muted-foreground",
            pathname === href && "font-medium text-foreground",
          )}
        >
          <Icon className="size-5" aria-hidden />
          {label}
        </Link>
      ))}
    </nav>
  );
}
