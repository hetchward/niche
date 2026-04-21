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

const SCORE_STEP = 0.05;

/** Filled fields, no default border — separation comes from grey fills, not outlines. */
const fieldFill =
  "border-0 bg-muted/45 shadow-none ring-0 outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-0";

function newId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}`;
}

function normalizeScore(rawValue: number, maxScore: number) {
  if (!Number.isFinite(rawValue)) return 0;
  const clamped = Math.min(Math.max(rawValue, 0), maxScore);
  return Number((Math.round(clamped / SCORE_STEP) * SCORE_STEP).toFixed(2));
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

  const [scores, setScores] = useState<Record<string, number>>({});
  const [scoreNotes, setScoreNotes] = useState<Record<string, string>>({});
  /** Per-criterion note field hidden until user taps Add note. */
  const [scoreNoteOpen, setScoreNoteOpen] = useState<Record<string, boolean>>({});
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);

  const adjustScore = (criterionId: string, maxScore: number, delta: number) => {
    setScores((prev) => {
      const current = prev[criterionId] ?? 0;
      const next = normalizeScore(current + delta, maxScore);
      return {
        ...prev,
        [criterionId]: next,
      };
    });
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!category || !title.trim()) return;
    const scoreRows: EntryScore[] = criteria.map((c) => {
      const score = normalizeScore(scores[c.id] ?? 0, c.maxScore);
      const trimmedNote = (scoreNotes[c.id] ?? "").trim();
      return {
        criterionId: c.id,
        score,
        ...(trimmedNote ? { note: trimmedNote } : {}),
      };
    });
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

      <Card className="rounded-3xl border-0 bg-card shadow-sm ring-0">
        <CardHeader>
          <CardTitle className="text-base">Review</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="flex flex-col gap-5" onSubmit={onSubmit}>
            <div className="space-y-2">
              <Label>Category</Label>
              <select
                required
                className={`h-11 w-full appearance-none rounded-2xl px-3 text-sm ${fieldFill}`}
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
                className={`h-11 rounded-2xl px-3 ${fieldFill}`}
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
                className={`h-11 rounded-2xl px-3 ${fieldFill}`}
              />
            </div>

            <div className="rounded-2xl bg-muted/30 p-4">
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
              <div className="space-y-2">
                <p className="text-sm font-medium">Scores</p>
                <div className="grid grid-cols-1 gap-2">
                  {criteria.map((c) => {
                    const noteOpen = scoreNoteOpen[c.id] ?? false;
                    return (
                      <div key={c.id} className="rounded-2xl bg-muted/30 px-3 py-2.5">
                        <div className="flex min-w-0 items-center gap-2">
                          <Label className="min-w-0 flex-1 truncate text-xs">
                            {c.emoji ? `${c.emoji} ` : null}
                            {c.name}
                          </Label>
                          <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                            {(scores[c.id] ?? 0).toFixed(2)}/{c.maxScore}
                          </span>
                          {!noteOpen ? (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-7 shrink-0 px-2 text-xs"
                              onClick={() =>
                                setScoreNoteOpen((prev) => ({ ...prev, [c.id]: true }))
                              }
                            >
                              Add note
                            </Button>
                          ) : (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-7 shrink-0 px-2 text-xs text-muted-foreground"
                              onClick={() => {
                                setScoreNotes((prev) => {
                                  const next = { ...prev };
                                  delete next[c.id];
                                  return next;
                                });
                                setScoreNoteOpen((prev) => {
                                  const next = { ...prev };
                                  delete next[c.id];
                                  return next;
                                });
                              }}
                            >
                              Remove note
                            </Button>
                          )}
                        </div>
                        <div className="mt-2 flex min-w-0 items-center gap-2">
                          <button
                            type="button"
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muted/55 text-sm text-foreground transition hover:bg-muted/75"
                            onClick={() => adjustScore(c.id, c.maxScore, -SCORE_STEP)}
                            aria-label={`Decrease score for ${c.name}`}
                          >
                            -
                          </button>
                          <input
                            type="range"
                            min={0}
                            max={c.maxScore}
                            step={SCORE_STEP}
                            value={scores[c.id] ?? 0}
                            onChange={(e) => {
                              const next = normalizeScore(Number(e.target.value), c.maxScore);
                              setScores((prev) => ({
                                ...prev,
                                [c.id]: next,
                              }));
                            }}
                            className="h-2 min-w-0 flex-1 cursor-pointer appearance-none rounded-lg bg-muted accent-primary"
                            aria-label={`Score slider for ${c.name}`}
                          />
                          <button
                            type="button"
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muted/55 text-sm text-foreground transition hover:bg-muted/75"
                            onClick={() => adjustScore(c.id, c.maxScore, SCORE_STEP)}
                            aria-label={`Increase score for ${c.name}`}
                          >
                            +
                          </button>
                        </div>
                        {noteOpen ? (
                          <Textarea
                            className={`mt-2 min-h-[56px] rounded-2xl px-3 py-2 text-sm ${fieldFill}`}
                            value={scoreNotes[c.id] ?? ""}
                            onChange={(e) =>
                              setScoreNotes((prev) => ({
                                ...prev,
                                [c.id]: e.target.value,
                              }))
                            }
                            placeholder="Optional note for this score…"
                            autoFocus
                          />
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : null}

            <div className="space-y-2">
              <Label htmlFor="bonus">Bonus points</Label>
              <Input
                id="bonus"
                inputMode="decimal"
                className={`h-11 rounded-2xl px-3 ${fieldFill}`}
                value={bonusPoints}
                onChange={(e) => setBonusPoints(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Label</Label>
              <select
                className={`h-11 w-full appearance-none rounded-2xl px-3 text-sm ${fieldFill}`}
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
                className={`min-h-[120px] rounded-2xl px-3 py-2 ${fieldFill}`}
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
