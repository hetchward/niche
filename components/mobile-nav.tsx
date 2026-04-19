"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const links = [
  { href: "/", label: "Home", emoji: "🏠" },
  { href: "/map", label: "Map", emoji: "🗺️" },
  { href: "/entries/new", label: "Add", emoji: "➕" },
  { href: "/categories/new", label: "Niche", emoji: "🧷" },
] as const;

export function MobileNav() {
  const pathname = usePathname();
  return (
    <nav className="sticky bottom-0 z-40 border-t border-border/70 bg-background/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-lg items-stretch justify-around gap-1 px-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] pt-2">
        {links.map((l) => {
          const active =
            l.href === "/"
              ? pathname === "/"
              : pathname === l.href || pathname.startsWith(`${l.href}/`);
          return (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                "flex min-w-[4.25rem] flex-1 flex-col items-center gap-0.5 rounded-2xl px-2 py-1 text-[10px] font-medium text-muted-foreground transition",
                active && "bg-primary/10 text-foreground",
              )}
            >
              <span className="text-lg leading-none">{l.emoji}</span>
              {l.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
