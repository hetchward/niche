"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useNicheStore } from "@/hooks/use-niche-store";
import type { Entry, EntryLabel } from "@/types/niche";
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

function newId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `wl-${crypto.randomUUID()}`;
  }
  return `wl-${Date.now()}`;
}

export function WatchlistNewClient() {
  const router = useRouter();
  const params = useSearchParams();
  const presetCategoryId = params.get("categoryId") ?? "";
  const { state, addOrUpdateEntry } = useNicheStore();

  const [categoryId, setCategoryId] = useState(presetCategoryId);
  const [title, setTitle] = useState("");
  const [locationName, setLocationName] = useState("");
  const [notes, setNotes] = useState("");
  const [source, setSource] = useState("");
  const [label, setLabel] = useState<EntryLabel | "">("");
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryId || !title.trim()) return;
    const t = new Date().toISOString();
    const entry: Entry = {
      id: newId(),
      categoryId,
      title: title.trim(),
      locationName: locationName.trim() || undefined,
      notes: notes.trim() || undefined,
      recommendationSource: source.trim() || undefined,
      label: label || undefined,
      status: "watchlist",
      ...(photoUrls.length ? { photoUrls: [...photoUrls] } : {}),
      createdAt: t,
      updatedAt: t,
      ...(latitude != null && longitude != null ? { latitude, longitude } : {}),
    };
    addOrUpdateEntry(entry);
    router.push(`/entries/${entry.id}`);
  };

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-6 px-4 py-6">
      <Link href="/" className="text-sm text-muted-foreground">
        ← Home
      </Link>
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Add watchlist item</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Plot the next audit — no scores required.
        </p>
      </header>

      <Card className="rounded-3xl border-border/70">
        <CardHeader>
          <CardTitle className="text-base">Hit list</CardTitle>
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
              <Label htmlFor="wtitle">Title</Label>
              <Input
                id="wtitle"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="rounded-2xl"
                placeholder="Bonville golf course"
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
              <Label htmlFor="src">Source / recommendation</Label>
              <Input
                id="src"
                value={source}
                onChange={(e) => setSource(e.target.value)}
                className="rounded-2xl"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="wnotes">Notes</Label>
              <Textarea
                id="wnotes"
                className="min-h-[100px] rounded-2xl"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <EntryPhotoPicker photoUrls={photoUrls} onChange={setPhotoUrls} id="wl-photos" />

            <Button type="submit" className="rounded-2xl" disabled={!categoryId || !title.trim()}>
              Save
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
