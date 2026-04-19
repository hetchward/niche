import { APP_STATE_VERSION, EMPTY_APP_STATE, STORAGE_KEY } from "@/lib/constants";
import {
  healLegacyEntryCoordinates,
  healMissingWeightPresets,
  migrateAppState,
} from "@/lib/migrate";
import type { AppState, Category, Entry } from "@/types/niche";
import { getSeedAppState } from "@/lib/sample-data";

const listeners = new Set<() => void>();

/** Stable reference for `useSyncExternalStore` when disk content unchanged. */
let snapshotCache: AppState | null = null;
let snapshotRaw: string | null = null;

function invalidateSnapshotCache(): void {
  snapshotCache = null;
  snapshotRaw = null;
}

function onStorageEvent(e: StorageEvent): void {
  if (e.key !== null && e.key !== STORAGE_KEY) return;
  invalidateSnapshotCache();
  listeners.forEach((l) => l());
}

export function subscribeAppState(listener: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  listeners.add(listener);
  if (listeners.size === 1) {
    window.addEventListener("storage", onStorageEvent);
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      window.removeEventListener("storage", onStorageEvent);
    }
  };
}

function emitAppState(): void {
  listeners.forEach((l) => l());
}

function safeParse(raw: string | null): AppState | null {
  if (!raw) return null;
  try {
    const v = JSON.parse(raw) as AppState;
    if (!Array.isArray(v.categories) || !Array.isArray(v.entries)) return null;
    return v;
  } catch {
    return null;
  }
}

export function loadAppState(): AppState {
  if (typeof window === "undefined") return EMPTY_APP_STATE;
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw && raw === snapshotRaw && snapshotCache) {
    return snapshotCache;
  }
  const parsed = safeParse(raw);
  if (!parsed) {
    const seed = getSeedAppState();
    saveAppState(seed);
    if (!snapshotCache) return seed;
    return snapshotCache;
  }
  if (parsed.version !== APP_STATE_VERSION) {
    const migrated = migrateAppState(parsed);
    saveAppState(migrated);
    if (!snapshotCache) return migrated;
    return snapshotCache;
  }
  let healed = healMissingWeightPresets(parsed);
  if (healed.changed) {
    saveAppState(healed.state);
    if (!snapshotCache) return healed.state;
    return snapshotCache;
  }
  const geoHealed = healLegacyEntryCoordinates(healed.state);
  if (geoHealed.changed) {
    saveAppState(geoHealed.state);
    if (!snapshotCache) return geoHealed.state;
    return snapshotCache;
  }
  snapshotCache = geoHealed.state;
  snapshotRaw = raw;
  return geoHealed.state;
}

export function saveAppState(state: AppState): void {
  if (typeof window === "undefined") return;
  const next: AppState = { ...state, version: APP_STATE_VERSION };
  const serialized = JSON.stringify(next);
  localStorage.setItem(STORAGE_KEY, serialized);
  snapshotCache = next;
  snapshotRaw = serialized;
  emitAppState();
}

export function resetToSeed(): AppState {
  const seed = getSeedAppState();
  saveAppState(seed);
  return seed;
}

export function upsertCategory(state: AppState, category: Category): AppState {
  const idx = state.categories.findIndex((c) => c.id === category.id);
  const categories =
    idx === -1
      ? [...state.categories, category]
      : state.categories.map((c, i) => (i === idx ? category : c));
  return { ...state, categories };
}

export function upsertEntry(state: AppState, entry: Entry): AppState {
  const idx = state.entries.findIndex((e) => e.id === entry.id);
  const entries =
    idx === -1
      ? [...state.entries, entry]
      : state.entries.map((e, i) => (i === idx ? entry : e));
  return { ...state, entries };
}

export function deleteEntry(state: AppState, entryId: string): AppState {
  return {
    ...state,
    entries: state.entries.filter((e) => e.id !== entryId),
  };
}

/** Upsert category and drop entry scores for removed criterion ids (same category only). */
export function mergeCategoryAndStripScores(
  state: AppState,
  category: Category,
  removedCriterionIds: readonly string[],
): AppState {
  let entries = state.entries;
  if (removedCriterionIds.length) {
    const rm = new Set(removedCriterionIds);
    entries = state.entries.map((e) => {
      if (e.categoryId !== category.id || !e.scores) return e;
      return {
        ...e,
        scores: e.scores.filter((s) => !rm.has(s.criterionId)),
      };
    });
  }
  return upsertCategory({ ...state, entries }, category);
}
