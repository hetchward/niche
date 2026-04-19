import { APP_STATE_VERSION } from "@/lib/constants";
import { croissantSeedLocationForEntryId } from "@/lib/croissant-seed-geo";
import type { AppState, Category, Entry, WeightPreset } from "@/types/niche";

const GOLF_DUCK_CRITERION_ID = "crit-golf-duck";

function migrateCategoryPresets(cat: Category): Category {
  if (Array.isArray(cat.weightPresets) && cat.weightPresets.length > 0) {
    const defaultPresetId =
      cat.defaultPresetId &&
      cat.weightPresets.some((p) => p.id === cat.defaultPresetId)
        ? cat.defaultPresetId
        : cat.weightPresets[0]!.id;
    return { ...cat, defaultPresetId };
  }
  const preset: WeightPreset = {
    id: `preset-default-${cat.id}`,
    name: "Default",
    weights: {},
  };
  return {
    ...cat,
    weightPresets: [preset],
    defaultPresetId: preset.id,
  };
}

/** Normalize persisted state to current `APP_STATE_VERSION`. */
export function migrateAppState(state: AppState): AppState {
  let next: AppState = { ...state };

  if (next.version < 2) {
    next = {
      ...next,
      categories: next.categories.map(migrateCategoryPresets),
      version: 2,
    };
  }

  if (next.version < 3) {
    next = {
      ...next,
      categories: next.categories.map((cat) => ({
        ...cat,
        criteria: cat.criteria.map((c) =>
          c.id === GOLF_DUCK_CRITERION_ID ? { ...c, maxScore: 1 } : c,
        ),
      })),
      entries: next.entries.map((e): Entry => {
        if (!e.scores?.length) return e;
        return {
          ...e,
          scores: e.scores.map((s) =>
            s.criterionId === GOLF_DUCK_CRITERION_ID
              ? { ...s, score: Math.min(Math.max(0, s.score), 1) }
              : s,
          ),
        };
      }),
      version: 3,
    };
  }

  if (next.version < 4) {
    next = {
      ...next,
      entries: next.entries.map((e): Entry => {
        const o = e as Record<string, unknown>;
        const latOk = typeof o.latitude === "number" && Number.isFinite(o.latitude);
        const lngOk = typeof o.longitude === "number" && Number.isFinite(o.longitude);
        if (latOk && lngOk) return e;
        const lat =
          typeof o.lat === "number" && Number.isFinite(o.lat)
            ? o.lat
            : latOk
              ? (o.latitude as number)
              : undefined;
        const lng =
          typeof o.lng === "number" && Number.isFinite(o.lng)
            ? o.lng
            : lngOk
              ? (o.longitude as number)
              : undefined;
        if (lat == null || lng == null) return e;
        const { lat: _dropLat, lng: _dropLng, ...rest } = o;
        return { ...rest, latitude: lat, longitude: lng } as Entry;
      }),
      version: 4,
    };
  }

  if (next.version < 5) {
    next = {
      ...next,
      entries: next.entries.map((e): Entry => {
        const loc = croissantSeedLocationForEntryId(e.id);
        if (!loc) return e;
        return {
          ...e,
          locationName: loc.locationName,
          latitude: loc.latitude,
          longitude: loc.longitude,
        };
      }),
      version: 5,
    };
  }

  return { ...next, version: APP_STATE_VERSION };
}

/**
 * Repair categories saved without `weightPresets` (e.g. partial v2 writes).
 * Returns a new state only when something changed.
 */
/** Copy legacy `lat`/`lng` into `latitude`/`longitude` and strip old keys (e.g. pre–v4 seed saves). */
export function healLegacyEntryCoordinates(state: AppState): {
  state: AppState;
  changed: boolean;
} {
  let changed = false;
  const entries = state.entries.map((e) => {
    const o = e as Record<string, unknown>;
    const hasLL =
      typeof o.latitude === "number" &&
      typeof o.longitude === "number" &&
      Number.isFinite(o.latitude) &&
      Number.isFinite(o.longitude);
    if (hasLL && ("lat" in o || "lng" in o)) {
      changed = true;
      const { lat: _a, lng: _b, ...rest } = o;
      return { ...rest } as Entry;
    }
    if (hasLL) return e;
    const lat = typeof o.lat === "number" && Number.isFinite(o.lat) ? o.lat : undefined;
    const lng = typeof o.lng === "number" && Number.isFinite(o.lng) ? o.lng : undefined;
    if (lat == null || lng == null) return e;
    changed = true;
    const { lat: _a, lng: _b, ...rest } = o;
    return { ...rest, latitude: lat, longitude: lng } as Entry;
  });
  return changed ? { state: { ...state, entries }, changed: true } : { state, changed: false };
}

export function healMissingWeightPresets(state: AppState): {
  state: AppState;
  changed: boolean;
} {
  let changed = false;
  const categories = state.categories.map((cat) => {
    if (Array.isArray(cat.weightPresets) && cat.weightPresets.length > 0) {
      return cat;
    }
    changed = true;
    return migrateCategoryPresets({
      ...cat,
      criteria: Array.isArray(cat.criteria) ? cat.criteria : [],
    } as Category);
  });
  return changed
    ? { state: { ...state, categories }, changed: true }
    : { state, changed: false };
}
