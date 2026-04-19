import {
  computeCriteriaScore100,
  getDefaultPresetId,
  resolvePreset,
  sortEntries,
  type LeaderboardSort,
} from "@/lib/scoring";
import type { AppState, Category, Entry } from "@/types/niche";

export type { LeaderboardSort };

export function selectCategory(state: AppState, id: string): Category | undefined {
  return state.categories.find((c) => c.id === id);
}

export function selectEntriesForCategory(state: AppState, categoryId: string): Entry[] {
  return state.entries.filter((e) => e.categoryId === categoryId);
}

export function selectReviewedForCategory(
  state: AppState,
  categoryId: string,
): Entry[] {
  return state.entries.filter(
    (e) => e.categoryId === categoryId && e.status === "reviewed",
  );
}

export function selectWatchlistForCategory(
  state: AppState,
  categoryId: string,
): Entry[] {
  return state.entries.filter(
    (e) => e.categoryId === categoryId && e.status === "watchlist",
  );
}

export function selectLeaderboard(
  state: AppState,
  categoryId: string,
  sort: LeaderboardSort,
): Entry[] {
  const cat = selectCategory(state, categoryId);
  if (!cat) return [];
  const reviewed = selectReviewedForCategory(state, categoryId);
  return sortEntries(reviewed, cat, sort);
}

export function selectPodium(
  state: AppState,
  categoryId: string,
  sort: LeaderboardSort,
): Entry[] {
  return selectLeaderboard(state, categoryId, sort).slice(0, 3);
}

export function selectMapEntries(state: AppState): Entry[] {
  return state.entries.filter(
    (e) => e.latitude != null && e.longitude != null,
  );
}

export function selectRecentActivity(
  state: AppState,
  limit = 6,
): { entry: Entry; category?: Category }[] {
  const sorted = [...state.entries].sort(
    (a, b) =>
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );
  return sorted.slice(0, limit).map((entry) => ({
    entry,
    category: selectCategory(state, entry.categoryId),
  }));
}

export function categoryStats(state: AppState, category: Category) {
  const reviewed = selectReviewedForCategory(state, category.id);
  const watchlist = selectWatchlistForCategory(state, category.id);
  const presetId = getDefaultPresetId(category);
  const preset = resolvePreset(category, presetId);
  const sort: LeaderboardSort = { kind: "preset100", presetId };
  const board = selectLeaderboard(state, category.id, sort);
  const leader = board[0];
  const avg =
    !preset || reviewed.length === 0
      ? 0
      : reviewed.reduce(
          (acc, e) => acc + computeCriteriaScore100(e, category, preset),
          0,
        ) / reviewed.length;
  return {
    entryCount: reviewed.length,
    watchlistCount: watchlist.length,
    leaderTitle: leader?.title,
    avgScore: Math.round(avg * 10) / 10,
    avgLabel: "/100",
  };
}

