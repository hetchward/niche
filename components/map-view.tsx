"use client";

import dynamic from "next/dynamic";
import type { Category, Entry } from "@/types/niche";

const MapInner = dynamic(() => import("@/components/map-inner"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[min(70vh,560px)] w-full items-center justify-center rounded-3xl border border-dashed border-border/80 bg-muted/30 text-sm text-muted-foreground">
      Loading map…
    </div>
  ),
});

export function MapView(props: {
  entries: Entry[];
  categories: Category[];
  categoryId?: string | null;
  reviewedOnly?: boolean;
  watchlistOnly?: boolean;
  topRatedOnly?: boolean;
  labelFilter?: string | null;
}) {
  return <MapInner {...props} />;
}
