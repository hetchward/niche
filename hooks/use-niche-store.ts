"use client";

import { useCallback, useSyncExternalStore } from "react";
import { EMPTY_APP_STATE } from "@/lib/constants";
import {
  deleteEntry,
  loadAppState,
  mergeCategoryAndStripScores,
  saveAppState,
  subscribeAppState,
  upsertCategory,
  upsertEntry,
} from "@/lib/storage";
import type { AppState, Category, Entry } from "@/types/niche";

function getServerSnapshot(): AppState {
  return EMPTY_APP_STATE;
}

export function useNicheStore() {
  const state = useSyncExternalStore(
    subscribeAppState,
    loadAppState,
    getServerSnapshot,
  );

  const setState = useCallback((updater: (prev: AppState) => AppState) => {
    const next = updater(loadAppState());
    saveAppState(next);
  }, []);

  const addOrUpdateCategory = useCallback((category: Category) => {
    setState((s) => upsertCategory(s, category));
  }, [setState]);

  const addOrUpdateEntry = useCallback((entry: Entry) => {
    setState((s) => upsertEntry(s, entry));
  }, [setState]);

  const removeEntry = useCallback((entryId: string) => {
    setState((s) => deleteEntry(s, entryId));
  }, [setState]);

  const saveCategoryWithScoreCleanup = useCallback(
    (category: Category, removedCriterionIds: readonly string[]) => {
      setState((s) => mergeCategoryAndStripScores(s, category, removedCriterionIds));
    },
    [setState],
  );

  return {
    state,
    setState,
    addOrUpdateCategory,
    addOrUpdateEntry,
    removeEntry,
    saveCategoryWithScoreCleanup,
  };
}
