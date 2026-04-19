"use client";

import { useEffect, useState } from "react";
import { EmptyState } from "@/components/empty-state";
import { LabelBadge } from "@/components/label-badge";
import { EntryScoresEditor } from "@/components/entry-scores-editor";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { selectCategory } from "@/lib/selectors";
import {
  computeCriteriaScore100,
  computeRawSum,
  computeRawSumWithBonus,
  getDefaultPresetId,
  getWeightPresets,
  resolvePreset,
} from "@/lib/scoring";
import { useNicheStore } from "@/hooks/use-niche-store";
import Link from "next/link";
import { EntryPhotoPicker } from "@/components/entry-photo-picker";
import { EntryLocationEditor, EntryLocationReadOnly } from "@/components/entry-location-editor";
import { applyLocationPatch } from "@/lib/entry-location";

function EntryDetailPhotoGallery({ photos }: { photos: string[] }) {
  const [heroPhotoIndex, setHeroPhotoIndex] = useState(0);
  if (photos.length === 0) return null;
  const safeIndex = Math.min(heroPhotoIndex, photos.length - 1);
  const heroSrc = photos[safeIndex]!;
  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-3xl ring-1 ring-border/70">
        {/* eslint-disable-next-line @next/next/no-img-element -- data URLs from local entry photos */}
        <img
          src={heroSrc}
          alt=""
          className="aspect-[4/3] w-full bg-muted object-cover"
        />
      </div>
      {photos.length > 1 ? (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {photos.map((url, i) => (
            <button
              key={`${i}-${url.slice(-20)}`}
              type="button"
              onClick={() => setHeroPhotoIndex(i)}
              className={cn(
                "relative shrink-0 overflow-hidden rounded-xl ring-2 transition",
                i === heroPhotoIndex ? "ring-[var(--niche-forest)]" : "ring-transparent",
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" className="size-16 object-cover" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function EntryDetailClient({ entryId }: { entryId: string }) {
  const { state, addOrUpdateEntry } = useNicheStore();
  const entry = state.entries.find((e) => e.id === entryId);
  const category = entry ? selectCategory(state, entry.categoryId) : undefined;
  const [presetId, setPresetId] = useState<string>("");
  const [editingPhotos, setEditingPhotos] = useState(false);
  const [editingLocation, setEditingLocation] = useState(false);

  useEffect(() => {
    setEditingPhotos(false);
    setEditingLocation(false);
  }, [entryId]);

  if (!entry || !category) {
    return (
      <div className="mx-auto max-w-lg px-4 py-10">
        <EmptyState
          title="Entry not found"
          description="It may have been removed from local storage."
          actionHref="/"
          actionLabel="Back home"
        />
      </div>
    );
  }

  const presets = getWeightPresets(category);
  const defaultPresetId = getDefaultPresetId(category);
  const resolvedPresetId =
    presetId && presets.some((p) => p.id === presetId) ? presetId : defaultPresetId;
  const preset = resolvePreset(category, resolvedPresetId) ?? presets[0];
  const photos = (entry.photoUrls ?? []).filter(Boolean);
  const raw = entry.status === "reviewed" ? computeRawSum(entry, category) : 0;
  const bonus = entry.bonusPoints ?? 0;
  const rawBonus =
    entry.status === "reviewed" ? computeRawSumWithBonus(entry, category) : 0;
  const h100 =
    entry.status === "reviewed" && preset
      ? computeCriteriaScore100(entry, category, preset)
      : null;

  const persistPhotoUrls = (next: string[]) => {
    addOrUpdateEntry({
      ...entry,
      photoUrls: next.length ? next : undefined,
      updatedAt: new Date().toISOString(),
    });
  };

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-6 px-4 py-6 pb-10">
      <Link href={`/categories/${category.id}`} className="text-sm text-muted-foreground">
        ← {category.emoji} {category.name}
      </Link>

      <header className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="rounded-full">
            {entry.status === "reviewed" ? "Reviewed" : "Watchlist"}
          </Badge>
          {entry.weather ? (
            <Badge variant="outline" className="rounded-full">
              {entry.weather}
            </Badge>
          ) : null}
        </div>
        <h1 className="text-3xl font-semibold tracking-tight">{entry.title}</h1>
        {entry.locationName ? (
          <p className="text-sm text-muted-foreground">{entry.locationName}</p>
        ) : null}
        {entry.reviewedAt ? (
          <p className="text-xs text-muted-foreground">
            Visited {new Date(entry.reviewedAt).toLocaleDateString()}
          </p>
        ) : null}
      </header>

      {entry.status === "reviewed" ? (
        <div className="flex flex-col gap-4">
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Preset for /100</Label>
            <select
              className="h-11 w-full rounded-2xl border border-input bg-background px-3 text-sm"
              value={resolvedPresetId}
              onChange={(e) => setPresetId(e.target.value)}
            >
              {presets.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-wrap gap-3">
            <div className="rounded-3xl bg-card px-4 py-3 shadow-sm ring-1 ring-border/70">
              <p className="text-xs text-muted-foreground">Criteria /100</p>
              <p className="text-2xl font-semibold tabular-nums">
                {h100 != null ? Math.round(h100 * 10) / 10 : "—"}
              </p>
            </div>
            <div className="rounded-3xl bg-muted/40 px-4 py-3">
              <p className="text-xs text-muted-foreground">Raw sum</p>
              <p className="text-2xl font-semibold tabular-nums">
                {Math.round(raw * 100) / 100}
              </p>
            </div>
            <div className="rounded-3xl bg-muted/40 px-4 py-3">
              <p className="text-xs text-muted-foreground">Bonus</p>
              <p className="text-2xl font-semibold tabular-nums">
                {Math.round(bonus * 100) / 100}
              </p>
            </div>
            <div className="rounded-3xl bg-muted/40 px-4 py-3">
              <p className="text-xs text-muted-foreground">Raw + bonus</p>
              <p className="text-2xl font-semibold tabular-nums">
                {Math.round(rawBonus * 100) / 100}
              </p>
            </div>
          </div>
          {entry.label ? <LabelBadge label={entry.label} /> : null}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          Hit list item — score it once you’ve done the field work.
        </p>
      )}

      {entry.status === "reviewed" ? (
        <Card className="rounded-3xl border-border/70">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Criteria</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-3 text-xs text-muted-foreground">
              Tap Edit on a criterion to change its score or add an optional comment. Changes save when you leave a field or tap Done.
            </p>
            <EntryScoresEditor
              entry={entry}
              category={category}
              onCommit={(next) => addOrUpdateEntry(next)}
            />
          </CardContent>
        </Card>
      ) : null}

      <Card className="rounded-3xl border-border/70">
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 space-y-0 pb-2">
          <CardTitle className="text-base">Photos</CardTitle>
          {editingPhotos ? (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="rounded-xl"
              onClick={() => setEditingPhotos(false)}
            >
              Done
            </Button>
          ) : (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-xl"
              onClick={() => setEditingPhotos(true)}
            >
              Edit photos
            </Button>
          )}
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <EntryDetailPhotoGallery key={`${entry.id}-${photos.length}`} photos={photos} />
          {editingPhotos ? (
            <EntryPhotoPicker
              id="entry-detail-photos"
              showLabel={false}
              hint="Add or remove images — saved on this device right away."
              photoUrls={photos}
              onChange={persistPhotoUrls}
            />
          ) : photos.length === 0 ? (
            <p className="text-sm text-muted-foreground">No photos yet — tap Edit photos to add some.</p>
          ) : null}
        </CardContent>
      </Card>

      <Card className="rounded-3xl border-border/70">
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 space-y-0 pb-2">
          <CardTitle className="text-base">Location & map pin</CardTitle>
          {editingLocation ? (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="rounded-xl"
              onClick={() => setEditingLocation(false)}
            >
              Done
            </Button>
          ) : (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-xl"
              onClick={() => setEditingLocation(true)}
            >
              Edit location
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {editingLocation ? (
            <EntryLocationEditor
              locationName={entry.locationName}
              latitude={entry.latitude ?? null}
              longitude={entry.longitude ?? null}
              onApply={(patch) => {
                const latest = state.entries.find((e) => e.id === entry.id) ?? entry;
                addOrUpdateEntry(applyLocationPatch(latest, patch));
              }}
            />
          ) : (
            <EntryLocationReadOnly
              locationName={entry.locationName}
              latitude={entry.latitude ?? null}
              longitude={entry.longitude ?? null}
            />
          )}
        </CardContent>
      </Card>

      {entry.notes ? (
        <Card className="rounded-3xl border-border/70 bg-[color-mix(in_oklab,var(--niche-mustard)_12%,transparent)]">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm leading-relaxed">{entry.notes}</p>
          </CardContent>
        </Card>
      ) : null}

      {entry.recommendationSource ? (
        <p className="text-sm text-muted-foreground">
          Source: {entry.recommendationSource}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Link
          href={`/categories/${category.id}/criteria`}
          className={cn(buttonVariants({ variant: "outline" }), "rounded-2xl")}
        >
          Edit criteria
        </Link>
        <Link href="/map" className={cn(buttonVariants(), "rounded-2xl")}>
          View on full map
        </Link>
      </div>
    </div>
  );
}
