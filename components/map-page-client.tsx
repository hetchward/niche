"use client";

import { useMemo, useState } from "react";
import { MapView } from "@/components/map-view";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import type { EntryLabel } from "@/types/niche";
import { useNicheStore } from "@/hooks/use-niche-store";
import Link from "next/link";

const LABELS: EntryLabel[] = [
  "Watchlist",
  "Strong Buy",
  "Overvalued",
  "Breakout Candidate",
  "Blue Chip",
  "Hidden Gem",
  "Certified Classic",
  "Risky Pick",
  "Flop",
  "Controversial",
  "Needs Re-test",
];

export function MapPageClient() {
  const { state } = useNicheStore();
  const [categoryId, setCategoryId] = useState<string | "all">("all");
  const [reviewedOnly, setReviewedOnly] = useState(false);
  const [watchlistOnly, setWatchlistOnly] = useState(false);
  const [topRatedOnly, setTopRatedOnly] = useState(false);
  const [labelFilter, setLabelFilter] = useState<EntryLabel | "all">("all");

  const chips = useMemo(
    () => [
      { id: "all" as const, emoji: "🌍", name: "All" },
      ...state.categories.map((c) => ({
        id: c.id,
        emoji: c.emoji,
        name: c.name,
      })),
    ],
    [state.categories],
  );

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-4 px-4 py-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <Link href="/" className="text-sm text-muted-foreground">
            ← Home
          </Link>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">Map</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Reviewed vs watchlist, emoji pins, top-rated filter.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {chips.map((c) => (
          <Button
            key={c.id}
            type="button"
            size="sm"
            variant={categoryId === c.id ? "default" : "outline"}
            className="rounded-full"
            onClick={() => setCategoryId(c.id)}
          >
            {"emoji" in c && c.emoji ? (
              <span className="mr-1">{c.emoji}</span>
            ) : null}
            {c.name}
          </Button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant={reviewedOnly ? "default" : "outline"}
          className="rounded-full"
          onClick={() => setReviewedOnly((v) => !v)}
        >
          Reviewed
        </Button>
        <Button
          type="button"
          size="sm"
          variant={watchlistOnly ? "default" : "outline"}
          className="rounded-full"
          onClick={() => setWatchlistOnly((v) => !v)}
        >
          Watchlist
        </Button>
        <Button
          type="button"
          size="sm"
          variant={topRatedOnly ? "default" : "outline"}
          className="rounded-full"
          onClick={() => setTopRatedOnly((v) => !v)}
        >
          Top 3 / category
        </Button>
      </div>

      <div className="space-y-2">
        <Label className="text-sm">Label filter</Label>
        <select
          className="h-11 w-full rounded-2xl border border-input bg-background px-3 text-sm"
          value={labelFilter}
          onChange={(e) => setLabelFilter(e.target.value as EntryLabel | "all")}
        >
          <option value="all">All labels</option>
          {LABELS.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </select>
      </div>

      <MapView
        entries={state.entries}
        categories={state.categories}
        categoryId={categoryId === "all" ? null : categoryId}
        reviewedOnly={reviewedOnly}
        watchlistOnly={watchlistOnly}
        topRatedOnly={topRatedOnly}
        labelFilter={labelFilter === "all" ? null : labelFilter}
      />
    </div>
  );
}
