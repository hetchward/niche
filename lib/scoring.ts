import type { Category, Entry, EntryScore, WeightPreset } from "@/types/niche";

export type ScoreTotals = {
  unweightedTotalScore: number;
  weightedTotalScore: number;
};

function sumCriterionScores(scores: EntryScore[] | undefined): number {
  if (!scores?.length) return 0;
  return scores.reduce((acc, s) => acc + s.score, 0);
}

/**
 * Legacy totals for persistence / backward compatibility.
 * Equal: raw sum; weighted + bonus on weightedTotalScore.
 */
export function computeScoreTotals(
  entry: Pick<Entry, "scores" | "bonusPoints">,
  category: Category,
): ScoreTotals {
  const bonus = entry.bonusPoints ?? 0;
  const scores = entry.scores ?? [];
  const byCriterion = new Map(scores.map((s) => [s.criterionId, s]));

  let unweighted = 0;
  let weighted = 0;

  if (category.scoringMode === "equal") {
    unweighted = sumCriterionScores(scores);
    weighted = unweighted + bonus;
    return {
      unweightedTotalScore: unweighted,
      weightedTotalScore: weighted,
    };
  }

  for (const c of [...(category.criteria ?? [])].sort(
    (a, b) => a.displayOrder - b.displayOrder,
  )) {
    const row = byCriterion.get(c.id);
    const score = row?.score ?? 0;
    const max = c.maxScore > 0 ? c.maxScore : 1;
    unweighted += score;
    weighted += (score / max) * c.weight;
  }

  const weightedWithBonus = weighted + bonus;

  return {
    unweightedTotalScore: unweighted,
    weightedTotalScore: weightedWithBonus,
  };
}

/** Safe accessor — older localStorage may omit `weightPresets`. */
export function getWeightPresets(category: Category): WeightPreset[] {
  return category.weightPresets ?? [];
}

export function resolvePreset(
  category: Category,
  presetId: string,
): WeightPreset | undefined {
  return getWeightPresets(category).find((p) => p.id === presetId);
}

export function getDefaultPresetId(category: Category): string {
  const presets = getWeightPresets(category);
  if (!presets.length) return "";
  if (
    category.defaultPresetId &&
    presets.some((p) => p.id === category.defaultPresetId)
  ) {
    return category.defaultPresetId;
  }
  return presets[0]!.id;
}

/** Sum of raw criterion scores for criteria in this category. */
export function computeRawSum(
  entry: Pick<Entry, "scores">,
  category: Category,
): number {
  const by = new Map((entry.scores ?? []).map((s) => [s.criterionId, s.score]));
  let sum = 0;
  for (const c of category.criteria ?? []) {
    sum += by.get(c.id) ?? 0;
  }
  return sum;
}

export function computeRawSumWithBonus(
  entry: Pick<Entry, "scores" | "bonusPoints">,
  category: Category,
): number {
  return computeRawSum(entry, category) + (entry.bonusPoints ?? 0);
}

/**
 * Criteria-only 0–100: 100 * Σ (score/max) * W_norm where W comes from preset
 * (missing keys → criterion.weight → 1), normalized to sum 1.
 */
export function computeCriteriaScore100(
  entry: Pick<Entry, "scores">,
  category: Category,
  preset: WeightPreset,
): number {
  const by = new Map((entry.scores ?? []).map((s) => [s.criterionId, s.score]));
  const criteria = [...(category.criteria ?? [])].sort(
    (a, b) => a.displayOrder - b.displayOrder,
  );
  const pw = preset.weights ?? {};
  const rawWeights = criteria.map((c) => {
    const w = pw[c.id] ?? c.weight ?? 1;
    return Math.max(0, w);
  });
  const sumW = rawWeights.reduce((a, b) => a + b, 0) || 1;
  let total = 0;
  criteria.forEach((c, i) => {
    const score = by.get(c.id) ?? 0;
    const max = c.maxScore > 0 ? c.maxScore : 1;
    const W = rawWeights[i]! / sumW;
    total += (score / max) * W;
  });
  return Math.round(total * 1000) / 10;
}

export type LeaderboardSort =
  | { kind: "raw" }
  | { kind: "rawWithBonus" }
  | { kind: "preset100"; presetId: string };

export function formatLeaderboardSort(
  category: Category,
  sort: LeaderboardSort,
): string {
  switch (sort.kind) {
    case "raw":
      return "Raw sum";
    case "rawWithBonus":
      return "Raw + bonus";
    case "preset100": {
      const n = resolvePreset(category, sort.presetId)?.name ?? "Preset";
      return `/100 · ${n}`;
    }
  }
}

export function getLeaderboardSortValue(
  entry: Entry,
  category: Category,
  sort: LeaderboardSort,
): number {
  if (entry.status !== "reviewed") return 0;
  switch (sort.kind) {
    case "raw":
      return computeRawSum(entry, category);
    case "rawWithBonus":
      return computeRawSumWithBonus(entry, category);
    case "preset100": {
      const p = resolvePreset(category, sort.presetId);
      if (!p) return 0;
      return computeCriteriaScore100(entry, category, p);
    }
  }
}

export function sortEntries(
  entries: Entry[],
  category: Category,
  sort: LeaderboardSort,
): Entry[] {
  return [...entries].sort(
    (a, b) =>
      getLeaderboardSortValue(b, category, sort) -
      getLeaderboardSortValue(a, category, sort),
  );
}

/** @deprecated Use `sortEntries` with `LeaderboardSort`. */
export function sortEntriesByScore(
  entries: Entry[],
  category: Category,
  mode: "weighted" | "unweighted",
): Entry[] {
  const sort: LeaderboardSort =
    mode === "weighted"
      ? { kind: "rawWithBonus" }
      : { kind: "raw" };
  return sortEntries(entries, category, sort);
}

export function withComputedScores(
  entry: Entry,
  category: Category | undefined,
): Entry {
  if (!category || entry.status !== "reviewed") {
    return {
      ...entry,
      weightedTotalScore: undefined,
      unweightedTotalScore: undefined,
    };
  }
  const raw = computeRawSum(entry, category);
  const totals = computeScoreTotals(entry, category);
  return {
    ...entry,
    unweightedTotalScore: raw,
    weightedTotalScore: totals.weightedTotalScore,
  };
}
