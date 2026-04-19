"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { computeScoreTotals } from "@/lib/scoring";
import { selectCategory } from "@/lib/selectors";
import { useNicheStore } from "@/hooks/use-niche-store";
import type { Entry, EntryLabel, EntryScore } from "@/types/niche";
import Link from "next/link";
import { EntryPhotoPicker } from "@/components/entry-photo-picker";
import { EntryLocationEditor } from "@/components/entry-location-editor";

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

function newId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}`;
}

export function EntryNewClient() {
  const router = useRouter();
  const params = useSearchParams();
  const presetCategoryId = params.get("categoryId") ?? "";
  const { state, addOrUpdateEntry } = useNicheStore();

  const [categoryId, setCategoryId] = useState(presetCategoryId);
  const [title, setTitle] = useState("");
  const [locationName, setLocationName] = useState("");
  const [notes, setNotes] = useState("");
  const [bonusPoints, setBonusPoints] = useState("0");
  const [label, setLabel] = useState<EntryLabel | "">("");
  const [reviewedAt, setReviewedAt] = useState(
    () => new Date().toISOString().slice(0, 10),
  );

  const category = selectCategory(state, categoryId);
  const criteria = useMemo(
    () =>
      category
        ? [...category.criteria].sort((a, b) => a.displayOrder - b.displayOrder)
        : [],
    [category],
  );

  const [scores, setScores] = useState<Record<string, string>>({});
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!category || !title.trim()) return;
    const scoreRows: EntryScore[] = criteria.map((c) => ({
      criterionId: c.id,
      score: Number(scores[c.id] ?? 0) || 0,
    }));
    const bonus = Number(bonusPoints) || 0;
    const draft: Entry = {
      id: newId("ent"),
      categoryId: category.id,
      title: title.trim(),
      locationName: locationName.trim() || undefined,
      notes: notes.trim() || undefined,
      bonusPoints: bonus,
      label: label || undefined,
      status: "reviewed",
      reviewedAt: new Date(reviewedAt).toISOString(),
      scores: scoreRows,
      ...(photoUrls.length ? { photoUrls: [...photoUrls] } : {}),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...(latitude != null && longitude != null
        ? { latitude, longitude }
        : {}),
    };
    const totals = computeScoreTotals(draft, category);
    addOrUpdateEntry({
      ...draft,
      unweightedTotalScore: totals.unweightedTotalScore,
      weightedTotalScore: totals.weightedTotalScore,
    });
    router.push(`/entries/${draft.id}`);
  };

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-6 px-4 py-6">
      <Link href="/" className="text-sm text-muted-foreground">
        ← Home
      </Link>
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Add entry</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Score a visit. Everything stays on-device for this MVP.
        </p>
      </header>

      <Card className="rounded-3xl border-border/70">
        <CardHeader>
          <CardTitle className="text-base">Review</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="flex flex-col gap-4" onSubmit={onSubmit}>
            <div className="space-y-2">
              <Label>Category</Label>
              <select
                required
                className="h-11 w-full rounded-2xl border border-input bg-background px-3 text-sm"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
              >
                <option value="" disabled>
                  Choose…
                </option>
                {state.categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.emoji} {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="rounded-2xl"
                placeholder="The Hemmingway"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Date visited</Label>
              <Input
                id="date"
                type="date"
                value={reviewedAt}
                onChange={(e) => setReviewedAt(e.target.value)}
                className="rounded-2xl"
              />
            </div>

            <div className="rounded-2xl border border-border/70 bg-muted/10 p-4">
              <p className="mb-3 text-sm font-medium">Map pin (optional)</p>
              <EntryLocationEditor
                locationName={locationName}
                latitude={latitude}
                longitude={longitude}
                onApply={(patch) => {
                  if (patch.clearCoords) {
                    setLatitude(null);
                    setLongitude(null);
                    return;
                  }
                  if ("locationName" in patch) setLocationName(patch.locationName ?? "");
                  if (patch.latitude !== undefined) setLatitude(patch.latitude);
                  if (patch.longitude !== undefined) setLongitude(patch.longitude);
                }}
              />
            </div>

            {criteria.length ? (
              <div className="space-y-3">
                <p className="text-sm font-medium">Scores</p>
                <div className="grid grid-cols-1 gap-3">
                  {criteria.map((c) => (
                    <div key={c.id} className="flex items-center gap-3">
                      <Label className="w-40 shrink-0 text-xs">
                        {c.emoji ? `${c.emoji} ` : null}
                        {c.name}
                      </Label>
                      <Input
                        inputMode="decimal"
                        className="rounded-2xl"
                        value={scores[c.id] ?? ""}
                        placeholder={`0–${c.maxScore}`}
                        onChange={(e) =>
                          setScores((prev) => ({
                            ...prev,
                            [c.id]: e.target.value,
                          }))
                        }
                      />
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="space-y-2">
              <Label htmlFor="bonus">Bonus points</Label>
              <Input
                id="bonus"
                inputMode="decimal"
                className="rounded-2xl"
                value={bonusPoints}
                onChange={(e) => setBonusPoints(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Label</Label>
              <select
                className="h-11 w-full rounded-2xl border border-input bg-background px-3 text-sm"
                value={label}
                onChange={(e) => setLabel((e.target.value as EntryLabel) || "")}
              >
                <option value="">None</option>
                {LABELS.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                className="min-h-[120px] rounded-2xl"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Crackling didn’t crackle…"
              />
            </div>

            <EntryPhotoPicker photoUrls={photoUrls} onChange={setPhotoUrls} id="entry-photos" />

            <Button
              type="submit"
              className="rounded-2xl"
              disabled={!categoryId || !title.trim()}
            >
              Save & view
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
