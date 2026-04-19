"use client";

import { useMemo } from "react";
import { CategoryCard } from "@/components/category-card";
import { LeaderboardList } from "@/components/leaderboard-list";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getDefaultPresetId } from "@/lib/scoring";
import type { LeaderboardSort } from "@/lib/scoring";
import { selectLeaderboard } from "@/lib/selectors";
import type { AppState } from "@/types/niche";

export function ShareSnapshotClient({
  initialState,
}: {
  initialState: AppState;
}) {
  const state = initialState;
  const sortByCategory = useMemo(() => {
    const map = new Map<string, LeaderboardSort>();
    for (const c of state.categories) {
      const presetId = getDefaultPresetId(c);
      map.set(c.id, { kind: "preset100", presetId });
    }
    return map;
  }, [state.categories]);

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-6 px-4 py-6">
      <header className="space-y-2">
        <p className="text-sm font-medium text-[var(--niche-tomato)]">Shared snapshot</p>
        <h1 className="text-3xl font-semibold tracking-tight">Niche rankings</h1>
        <p className="text-sm text-muted-foreground">
          A read-only view of someone&apos;s oddly specific universe.
        </p>
      </header>

      {state.categories.length === 0 ? (
        <Card className="rounded-3xl border-border/70 bg-card/80">
          <CardHeader>
            <CardTitle className="text-base">Nothing here</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            This share link has no categories.
          </CardContent>
        </Card>
      ) : (
        <section className="flex flex-col gap-8">
          {state.categories.map((category) => {
            const sort = sortByCategory.get(category.id) ?? { kind: "raw" as const };
            const board = selectLeaderboard(state, category.id, sort).slice(0, 25);
            return (
              <div key={category.id} className="space-y-3">
                <CategoryCard state={state} category={category} withLink={false} />
                {board.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No reviewed entries yet.</p>
                ) : (
                  <LeaderboardList
                    entries={board}
                    category={category}
                    sort={sort}
                    linkable={false}
                  />
                )}
              </div>
            );
          })}
        </section>
      )}
    </div>
  );
}
