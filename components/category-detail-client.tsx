"use client";

import { useMemo, useState } from "react";
import { EmptyState } from "@/components/empty-state";
import { LeaderboardList } from "@/components/leaderboard-list";
import { MapView } from "@/components/map-view";
import { Podium } from "@/components/podium";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  selectCategory,
  selectEntriesForCategory,
  selectLeaderboard,
  selectPodium,
  selectWatchlistForCategory,
} from "@/lib/selectors";
import type { LeaderboardSort } from "@/lib/scoring";
import { getDefaultPresetId, getWeightPresets } from "@/lib/scoring";
import { useNicheStore } from "@/hooks/use-niche-store";
import type { EntryLabel } from "@/types/niche";
import Link from "next/link";
import { EntryRowThumb } from "@/components/entry-photo-picker";

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

type SortKind = "raw" | "rawWithBonus" | "preset100";

export function CategoryDetailClient({ categoryId }: { categoryId: string }) {
  const { state } = useNicheStore();
  const category = selectCategory(state, categoryId);
  const [sortKind, setSortKind] = useState<SortKind>("preset100");
  const [presetId, setPresetId] = useState<string>("");
  const [label, setLabel] = useState<EntryLabel | "all">("all");

  const sort: LeaderboardSort = useMemo(() => {
    if (!category) return { kind: "raw" };
    if (sortKind === "raw") return { kind: "raw" };
    if (sortKind === "rawWithBonus") return { kind: "rawWithBonus" };
    const presets = getWeightPresets(category);
    const pid =
      presetId && presets.some((p) => p.id === presetId)
        ? presetId
        : getDefaultPresetId(category);
    return { kind: "preset100", presetId: pid };
  }, [category, sortKind, presetId]);

  const leaderboard = useMemo(() => {
    if (!category) return [];
    const base = selectLeaderboard(state, categoryId, sort);
    if (label === "all") return base;
    return base.filter((e) => e.label === label);
  }, [category, categoryId, label, sort, state]);

  const podium = useMemo(() => {
    if (!category) return [];
    const base = selectPodium(state, categoryId, sort);
    if (label === "all") return base;
    return base.filter((e) => e.label === label);
  }, [category, categoryId, label, sort, state]);

  const watchlist = selectWatchlistForCategory(state, categoryId);
  const mapEntries = selectEntriesForCategory(state, categoryId);

  if (!category) {
    return (
      <div className="mx-auto max-w-lg px-4 py-10">
        <EmptyState
          title="Category not found"
          description="It may have been deleted from local storage."
          actionHref="/"
          actionLabel="Back home"
        />
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-6 px-4 py-6">
      <header className="space-y-3">
        <Link href="/" className="text-sm text-muted-foreground">
          ← Home
        </Link>
        <div className="flex items-start gap-3">
          <span className="text-5xl leading-none">{category.emoji}</span>
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold tracking-tight">
              {category.name}
            </h1>
            {category.description ? (
              <p className="mt-2 text-sm text-muted-foreground">
                {category.description}
              </p>
            ) : null}
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge variant="secondary" className="rounded-full">
                {category.scoringMode === "equal" ? "Equal scoring" : "Weighted"}
              </Badge>
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-wrap gap-2">
        <Link
          href={`/entries/new?categoryId=${category.id}`}
          className={cn(buttonVariants(), "rounded-2xl")}
        >
          Add entry
        </Link>
        <Link
          href={`/watchlist/new?categoryId=${category.id}`}
          className={cn(buttonVariants({ variant: "secondary" }), "rounded-2xl")}
        >
          Add watchlist
        </Link>
        <Link
          href={`/categories/${category.id}/criteria`}
          className={cn(buttonVariants({ variant: "outline" }), "rounded-2xl")}
        >
          Edit criteria & presets
        </Link>
      </div>

      <Card className="rounded-3xl border-border/70">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Criteria</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {[...(category.criteria ?? [])]
            .sort((a, b) => a.displayOrder - b.displayOrder)
            .map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between rounded-2xl bg-muted/30 px-3 py-2 text-sm"
              >
                <span className="font-medium">
                  {c.emoji ? `${c.emoji} ` : null}
                  {c.name}
                </span>
                <span className="text-xs text-muted-foreground">
                  max {c.maxScore} · w {c.weight}
                </span>
              </div>
            ))}
        </CardContent>
      </Card>

      <section className="space-y-3">
        <span className="text-sm font-medium">Sort leaderboard</span>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            variant={sortKind === "raw" ? "default" : "outline"}
            className="rounded-full"
            onClick={() => setSortKind("raw")}
          >
            Raw sum
          </Button>
          <Button
            type="button"
            size="sm"
            variant={sortKind === "rawWithBonus" ? "default" : "outline"}
            className="rounded-full"
            onClick={() => setSortKind("rawWithBonus")}
          >
            Raw + bonus
          </Button>
          <Button
            type="button"
            size="sm"
            variant={sortKind === "preset100" ? "default" : "outline"}
            className="rounded-full"
            onClick={() => setSortKind("preset100")}
          >
            /100
          </Button>
        </div>
        {sortKind === "preset100" ? (
          <div className="space-y-2">
            <Label className="text-sm">Weight preset</Label>
            <select
              className="h-11 w-full rounded-2xl border border-input bg-background px-3 text-sm"
              value={
                presetId &&
                getWeightPresets(category).some((p) => p.id === presetId)
                  ? presetId
                  : getDefaultPresetId(category)
              }
              onChange={(e) => setPresetId(e.target.value)}
            >
              {getWeightPresets(category).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        ) : null}
        <div className="space-y-2">
          <Label className="text-sm">Filter by label</Label>
          <select
            className="h-11 w-full rounded-2xl border border-input bg-background px-3 text-sm"
            value={label}
            onChange={(e) => setLabel(e.target.value as EntryLabel | "all")}
          >
            <option value="all">All labels</option>
            {LABELS.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Podium</h2>
        {podium.length === 0 ? (
          <EmptyState
            title="No podium yet"
            description="Add a reviewed entry to start the drama."
            actionHref={`/entries/new?categoryId=${category.id}`}
            actionLabel="Add entry"
          />
        ) : (
          <Podium entries={podium} category={category} sort={sort} />
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Leaderboard</h2>
        {leaderboard.length === 0 ? (
          <EmptyState
            title="Nothing matches"
            description="Try clearing filters — or add more opinions."
            actionHref={`/entries/new?categoryId=${category.id}`}
            actionLabel="Add entry"
          />
        ) : (
          <LeaderboardList
            entries={leaderboard}
            category={category}
            sort={sort}
          />
        )}
      </section>

      <section className="space-y-3">
        <div className="flex items-baseline justify-between gap-2">
          <h2 className="text-lg font-semibold">Watchlist</h2>
          <Link
            href={`/watchlist/new?categoryId=${category.id}`}
            className="text-sm font-medium text-[var(--niche-forest)]"
          >
            Add
          </Link>
        </div>
        {watchlist.length === 0 ? (
          <EmptyState
            title="Your watchlist is suspiciously empty."
            description="Drop in places you’re plotting to audit."
            actionHref={`/watchlist/new?categoryId=${category.id}`}
            actionLabel="Add item"
          />
        ) : (
          <ul className="flex flex-col gap-2">
            {watchlist.map((w) => (
              <li key={w.id}>
                <Link
                  href={`/entries/${w.id}`}
                  className="flex items-center gap-3 rounded-2xl border border-border/70 bg-card px-4 py-3 text-sm transition hover:bg-muted/40"
                >
                  <EntryRowThumb entry={w} />
                  <div className="min-w-0">
                    <p className="font-medium">{w.title}</p>
                    {w.locationName ? (
                      <p className="truncate text-xs text-muted-foreground">{w.locationName}</p>
                    ) : null}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Map preview</h2>
        <MapView entries={mapEntries} categories={state.categories} categoryId={category.id} />
      </section>

      <Separator />
      <p className="pb-6 text-center text-xs text-muted-foreground">
        Local-only MVP — your hot takes never leave this device.
      </p>
    </div>
  );
}
