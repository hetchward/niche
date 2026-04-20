"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MobileNav } from "@/components/mobile-nav";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isShare = pathname.startsWith("/share");
  const appVersion = process.env.NEXT_PUBLIC_APP_VERSION ?? "dev";

  return (
    <div className="flex min-h-dvh flex-col bg-[var(--niche-cream)] text-foreground">
      <div className={`flex flex-1 flex-col ${isShare ? "pb-4" : "pb-2"}`}>{children}</div>
      {isShare ? (
        <div className="sticky bottom-0 z-40 border-t border-border/70 bg-background/90 px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] backdrop-blur-md">
          <Link
            href="/"
            className={cn(buttonVariants({ size: "lg" }), "w-full rounded-2xl")}
          >
            Run your own rankings in Niche
          </Link>
          <p className="mt-2 text-center text-[10px] text-muted-foreground">
            Version {appVersion}
          </p>
        </div>
      ) : (
        <MobileNav versionLabel={appVersion} />
      )}
    </div>
  );
}
