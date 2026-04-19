"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useNicheStore } from "@/hooks/use-niche-store";
import type { Category, Criterion, ScoringMode } from "@/types/niche";
import Link from "next/link";

function newId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `cat-${crypto.randomUUID()}`;
  }
  return `cat-${Date.now()}`;
}

export function CategoryNewClient() {
  const router = useRouter();
  const { state, addOrUpdateCategory } = useNicheStore();
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("🧷");
  const [description, setDescription] = useState("");
  const [criteriaText, setCriteriaText] = useState(
    "Vibe, Value, Chaos, Lore, Repeatability",
  );
  const [scoringMode, setScoringMode] = useState<ScoringMode>("equal");

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const id = newId();
    const names = criteriaText
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const criteria: Criterion[] = names.map((n, i) => ({
      id: `${id}-crit-${i}`,
      name: n,
      maxScore: 5,
      weight: 1,
      displayOrder: i + 1,
    }));
    const defaultPresetId = `${id}-preset-balanced`;
    const cat: Category = {
      id,
      name: name.trim(),
      emoji: emoji.trim() || "🧷",
      description: description.trim() || undefined,
      scoringMode,
      criteria,
      weightPresets: [
        { id: defaultPresetId, name: "Balanced", weights: {} },
      ],
      defaultPresetId,
      createdAt: new Date().toISOString(),
    };
    addOrUpdateCategory(cat);
    router.push(`/categories/${cat.id}`);
  };

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-6 px-4 py-6">
      <Link href="/" className="text-sm text-muted-foreground">
        ← Home
      </Link>
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Create category</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Name it, emoji it, list criteria (comma-separated). Weights can come later.
        </p>
      </header>

      <Card className="rounded-3xl border-border/70">
        <CardHeader>
          <CardTitle className="text-base">New niche</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="flex flex-col gap-4" onSubmit={onSubmit}>
            <div className="space-y-2">
              <Label htmlFor="cname">Name</Label>
              <Input
                id="cname"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="rounded-2xl"
                placeholder="Pub Fireplace Rankings"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cemoji">Emoji</Label>
              <Input
                id="cemoji"
                value={emoji}
                onChange={(e) => setEmoji(e.target.value)}
                className="rounded-2xl"
                maxLength={8}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cdesc">Description</Label>
              <Textarea
                id="cdesc"
                className="min-h-[90px] rounded-2xl"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cmode">Scoring mode</Label>
              <select
                id="cmode"
                className="h-11 w-full rounded-2xl border border-input bg-background px-3 text-sm"
                value={scoringMode}
                onChange={(e) => setScoringMode(e.target.value as ScoringMode)}
              >
                <option value="equal">Equal</option>
                <option value="weighted">Weighted</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="crit">Criteria (comma-separated)</Label>
              <Textarea
                id="crit"
                className="min-h-[100px] rounded-2xl"
                value={criteriaText}
                onChange={(e) => setCriteriaText(e.target.value)}
              />
            </div>

            <Button type="submit" className="rounded-2xl" disabled={!name.trim()}>
              Save ({state.categories.length + 1} total)
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
