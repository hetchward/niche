import type { AppState } from "@/types/niche";

export const STORAGE_KEY = "niche:app-state";

/** Bump when persisted shape changes; older data runs through `migrateAppState`. */
export const APP_STATE_VERSION = 5;

export const EMPTY_APP_STATE: AppState = {
  version: APP_STATE_VERSION,
  categories: [],
  entries: [],
};
