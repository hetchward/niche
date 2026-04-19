"use client";

import { useMemo, useState } from "react";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { selectCategory } from "@/lib/selectors";
import { getWeightPresets } from "@/lib/scoring";
import { useNicheStore } from "@/hooks/use-niche-store";
import type { Category, Criterion, WeightPreset } from "@/types/niche";
import Link from "next/link";

function cloneCategory(c: Category): Category {
  return JSON.parse(JSON.stringify(c)) as Category;
}

function uid() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return String(Date.now());
}

function newCritId(categoryId: string) {
  return `${categoryId}-crit-${uid()}`;
}

function newPresetId(categoryId: string) {
  return `${categoryId}-preset-${uid()}`;
}

export function CategoryCriteriaClient({ categoryId }: { categoryId: string }) {
  const { state, saveCategoryWithScoreCleanup } = useNicheStore();
  const category = selectCategory(state, categoryId);
  const categoryKey = useMemo(
    () => (category ? JSON.stringify(category) : ""),
    [category],
  );

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
    <CategoryCriteriaEditor
      key={categoryKey}
      categoryId={categoryId}
      category={category}
      saveCategoryWithScoreCleanup={saveCategoryWithScoreCleanup}
    />
  );
}

type CategoryCriteriaEditorProps = {
  categoryId: string;
  category: Category;
  saveCategoryWithScoreCleanup: (
    category: Category,
    removedCriterionIds: readonly string[],
  ) => void;
};

function CategoryCriteriaEditor({
  categoryId,
  category,
  saveCategoryWithScoreCleanup,
}: CategoryCriteriaEditorProps) {
  const [draft, setDraft] = useState(() => cloneCategory(category));

  const sortedCriteria = useMemo(
    () =>
      [...(draft.criteria ?? [])].sort((a, b) => a.displayOrder - b.displayOrder),
    [draft],
  );

  const save = () => {
    const next = cloneCategory(draft);
    const oldIds = new Set((category.criteria ?? []).map((c) => c.id));
    const newIds = new Set((next.criteria ?? []).map((c) => c.id));
    const removed = [...oldIds].filter((id) => !newIds.has(id));
    if (!getWeightPresets(next).length) {
      const pid = newPresetId(next.id);
      next.weightPresets = [{ id: pid, name: "Balanced", weights: {} }];
      next.defaultPresetId = pid;
    }
    const presets = getWeightPresets(next);
    if (
      !next.defaultPresetId ||
      !presets.some((p) => p.id === next.defaultPresetId)
    ) {
      next.defaultPresetId = presets[0]!.id;
    }
    saveCategoryWithScoreCleanup(next, removed);
  };

  const updateCriterion = (id: string, patch: Partial<Criterion>) => {
    setDraft((d) => {
      if (!d) return d;
      return {
        ...d,
        criteria: (d.criteria ?? []).map((c) =>
          c.id === id ? { ...c, ...patch } : c,
        ),
      };
    });
  };

  const moveCriterion = (id: string, dir: -1 | 1) => {
    setDraft((d) => {
      if (!d) return d;
      const sorted = [...(d.criteria ?? [])].sort(
        (a, b) => a.displayOrder - b.displayOrder,
      );
      const idx = sorted.findIndex((c) => c.id === id);
      const j = idx + dir;
      if (idx < 0 || j < 0 || j >= sorted.length) return d;
      const a = sorted[idx]!;
      const b = sorted[j]!;
      const next = (d.criteria ?? []).map((c) => {
        if (c.id === a.id) return { ...c, displayOrder: b.displayOrder };
        if (c.id === b.id) return { ...c, displayOrder: a.displayOrder };
        return c;
      });
      return { ...d, criteria: next };
    });
  };

  const deleteCriterion = (id: string) => {
    if (!confirm("Remove this criterion? Scores for it will be deleted from entries."))
      return;
    setDraft((d) => {
      if (!d) return d;
      const presets = getWeightPresets(d).map((p) => {
        const w = { ...p.weights };
        delete w[id];
        return { ...p, weights: w };
      });
      return {
        ...d,
        criteria: (d.criteria ?? []).filter((c) => c.id !== id),
        weightPresets: presets,
      };
    });
  };

  const addCriterion = () => {
    setDraft((d) => {
      if (!d) return d;
      const maxOrder = Math.max(
        0,
        ...(d.criteria ?? []).map((c) => c.displayOrder),
      );
      const c: Criterion = {
        id: newCritId(d.id),
        name: "New criterion",
        maxScore: 5,
        weight: 1,
        displayOrder: maxOrder + 1,
      };
      return { ...d, criteria: [...(d.criteria ?? []), c] };
    });
  };

  const addPreset = () => {
    setDraft((d) => {
      if (!d) return d;
      const p: WeightPreset = {
        id: newPresetId(d.id),
        name: "New preset",
        weights: {},
      };
      return { ...d, weightPresets: [...getWeightPresets(d), p] };
    });
  };

  const deletePreset = (pid: string) => {
    if (getWeightPresets(draft).length <= 1) return;
    if (!confirm("Delete this preset?")) return;
    setDraft((d) => {
      if (!d) return d;
      const next = getWeightPresets(d).filter((p) => p.id !== pid);
      let defaultPresetId = d.defaultPresetId;
      if (defaultPresetId === pid) {
        defaultPresetId = next[0]?.id;
      }
      return { ...d, weightPresets: next, defaultPresetId };
    });
  };

  const updatePresetName = (presetId: string, name: string) => {
    setDraft((d) => {
      if (!d) return d;
      return {
        ...d,
        weightPresets: getWeightPresets(d).map((p) =>
          p.id === presetId ? { ...p, name } : p,
        ),
      };
    });
  };

  const updatePresetWeight = (
    presetId: string,
    criterionId: string,
    value: string,
  ) => {
    setDraft((d) => {
      if (!d) return d;
      return {
        ...d,
        weightPresets: getWeightPresets(d).map((p) => {
          if (p.id !== presetId) return p;
          const w = { ...p.weights };
          if (value.trim() === "") {
            delete w[criterionId];
          } else {
            const n = Number(value);
            w[criterionId] = Number.isFinite(n) ? Math.max(0, n) : 0;
          }
          return { ...p, weights: w };
        }),
      };
    });
  };

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-6 px-4 py-6">
      <Link
        href={`/categories/${categoryId}`}
        className="text-sm text-muted-foreground"
      >
        ← {draft.emoji} {draft.name}
      </Link>
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Criteria & presets</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Add criteria, weights, and named lenses. /100 uses presets only; bonus stays
          separate.
        </p>
      </header>

      <Card className="rounded-3xl border-border/70">
        <CardHeader>
          <CardTitle className="text-base">Criteria</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {sortedCriteria.map((c) => (
            <div
              key={c.id}
              className="flex flex-col gap-2 rounded-2xl border border-border/60 bg-muted/20 p-3"
            >
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="rounded-lg"
                  onClick={() => moveCriterion(c.id, -1)}
                >
                  Up
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="rounded-lg"
                  onClick={() => moveCriterion(c.id, 1)}
                >
                  Down
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="destructive"
                  className="rounded-lg"
                  onClick={() => deleteCriterion(c.id)}
                >
                  Remove
                </Button>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label className="text-xs">Name</Label>
                  <Input
                    value={c.name}
                    onChange={(e) => updateCriterion(c.id, { name: e.target.value })}
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Emoji</Label>
                  <Input
                    value={c.emoji ?? ""}
                    onChange={(e) =>
                      updateCriterion(c.id, { emoji: e.target.value || undefined })
                    }
                    className="rounded-xl"
                    maxLength={8}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Max score</Label>
                  <Input
                    type="number"
                    inputMode="decimal"
                    value={c.maxScore}
                    onChange={(e) =>
                      updateCriterion(c.id, {
                        maxScore: Math.max(0.01, Number(e.target.value) || 1),
                      })
                    }
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Base weight</Label>
                  <Input
                    type="number"
                    inputMode="decimal"
                    value={c.weight}
                    onChange={(e) =>
                      updateCriterion(c.id, {
                        weight: Math.max(0, Number(e.target.value) || 0),
                      })
                    }
                    className="rounded-xl"
                  />
                </div>
              </div>
            </div>
          ))}
          <Button type="button" variant="secondary" className="rounded-2xl" onClick={addCriterion}>
            Add criterion
          </Button>
        </CardContent>
      </Card>

      <Card className="rounded-3xl border-border/70">
        <CardHeader>
          <CardTitle className="text-base">Weight presets</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <Button type="button" variant="secondary" className="rounded-2xl" onClick={addPreset}>
            Add preset
          </Button>
          {getWeightPresets(draft).map((preset) => (
            <div key={preset.id} className="space-y-3 rounded-2xl border border-border/60 p-3">
              <div className="flex flex-wrap items-center gap-3">
                <Input
                  value={preset.name}
                  onChange={(e) => updatePresetName(preset.id, e.target.value)}
                  className="max-w-xs rounded-xl"
                />
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="defaultPreset"
                    checked={draft.defaultPresetId === preset.id}
                    onChange={() =>
                      setDraft((d) => (d ? { ...d, defaultPresetId: preset.id } : d))
                    }
                  />
                  Default for home /100
                </label>
                <Button
                  type="button"
                  size="sm"
                  variant="destructive"
                  className="rounded-lg"
                  disabled={getWeightPresets(draft).length <= 1}
                  onClick={() => deletePreset(preset.id)}
                >
                  Delete preset
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Weights are relative (any positive scale); empty uses each criterion’s base
                weight.
              </p>
              <div className="grid gap-2">
                {sortedCriteria.map((c) => (
                  <div key={c.id} className="flex items-center gap-2 text-sm">
                    <span className="w-40 shrink-0 truncate">
                      {c.emoji ? `${c.emoji} ` : null}
                      {c.name}
                    </span>
                    <Input
                      type="number"
                      inputMode="decimal"
                      className="max-w-[6rem] rounded-xl"
                      placeholder={`${c.weight}`}
                      value={
                        preset.weights[c.id] !== undefined ? preset.weights[c.id] : ""
                      }
                      onChange={(e) =>
                        updatePresetWeight(preset.id, c.id, e.target.value)
                      }
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Separator />

      <div className="flex flex-wrap gap-2 pb-10">
        <Button type="button" className="rounded-2xl" onClick={save}>
          Save changes
        </Button>
        <Button
          type="button"
          variant="outline"
          className="rounded-2xl"
          onClick={() => setDraft(cloneCategory(category))}
        >
          Discard edits
        </Button>
      </div>
    </div>
  );
}
