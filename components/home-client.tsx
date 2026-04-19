"use client";

import { useCallback, useMemo, useState } from "react";
import { CategoryCard } from "@/components/category-card";
import { EmptyState } from "@/components/empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { selectRecentActivity } from "@/lib/selectors";
import { useNicheStore } from "@/hooks/use-niche-store";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { EntryRowThumb } from "@/components/entry-photo-picker";

export function HomeClient() {
  const { state } = useNicheStore();
  const [q, setQ] = useState("");
  const [shareBusy, setShareBusy] = useState(false);
  const [shareMessage, setShareMessage] = useState<string | null>(null);

  const copyShareLink = useCallback(async () => {
    setShareMessage(null);
    setShareBusy(true);
    try {
      const res = await fetch("/api/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(state),
      });
      const data = (await res.json().catch(() => null)) as { id?: string; error?: string } | null;
      if (!res.ok) {
        setShareMessage(data?.error ?? "Could not create share link.");
        return;
      }
      if (!data?.id) {
        setShareMessage("Unexpected response from server.");
        return;
      }
      const url = `${window.location.origin}/share/${data.id}`;
      await navigator.clipboard.writeText(url);
      setShareMessage("Link copied — paste it to friends.");
    } catch {
      setShareMessage("Network error — try again.");
    } finally {
      setShareBusy(false);
    }
  }, [state]);
  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return state.categories;
    return state.categories.filter(
      (c) =>
        c.name.toLowerCase().includes(query) ||
        c.description?.toLowerCase().includes(query),
    );
  }, [q, state.categories]);

  const recent = selectRecentActivity(state, 5);

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-6 px-4 py-6">
      <header className="space-y-2">
        <p className="text-sm font-medium text-[var(--niche-tomato)]">Niche</p>
        <h1 className="text-3xl font-semibold tracking-tight">
          Your oddly specific universe
        </h1>
        <p className="text-sm text-muted-foreground">
          Rating app for those with oddly specific tastes.
        </p>
      </header>

      <Input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search categories…"
        className="h-12 rounded-2xl border-border/80 bg-card"
      />

      <div className="flex flex-col gap-2">
        <div className="flex gap-2">
          <Link
            href="/entries/new"
            className={cn(buttonVariants({ size: "lg" }), "flex-1 rounded-2xl text-center")}
          >
            Quick add entry
          </Link>
          <Link
            href="/map"
            className={cn(
              buttonVariants({ variant: "secondary", size: "lg" }),
              "rounded-2xl text-center",
            )}
          >
            Map
          </Link>
        </div>
        <Button
          type="button"
          variant="outline"
          size="lg"
          className="w-full rounded-2xl border-border/80"
          disabled={shareBusy || state.categories.length === 0}
          onClick={() => void copyShareLink()}
        >
          {shareBusy ? "Creating link…" : "Copy link to share rankings"}
        </Button>
        {shareMessage ? (
          <p className="text-center text-xs text-muted-foreground">{shareMessage}</p>
        ) : null}
      </div>

      <Card className="rounded-3xl border-border/70 bg-card/80 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Map preview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            {state.entries.filter((e) => e.latitude != null).length} pinned places
            across {state.categories.length} niches.
          </p>
          <Link
            href="/map"
            className={cn(
              buttonVariants({ variant: "outline" }),
              "inline-flex w-full justify-center rounded-2xl",
            )}
          >
            Open full map
          </Link>
        </CardContent>
      </Card>

      <section className="space-y-3">
        <div className="flex items-baseline justify-between gap-2">
          <h2 className="text-lg font-semibold">Categories</h2>
          <Link
            href="/categories/new"
            className="text-sm font-medium text-[var(--niche-forest)]"
          >
            New
          </Link>
        </div>
        {filtered.length === 0 ? (
          <EmptyState
            title="No matches (yet)"
            description="Try another search — or start a category for the thing you won’t shut up about."
            actionHref="/categories/new"
            actionLabel="Create category"
          />
        ) : (
          <div className="flex flex-col gap-3">
            {filtered.map((c) => (
              <CategoryCard key={c.id} state={state} category={c} />
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Recent activity</h2>
        {recent.length === 0 ? (
          <EmptyState
            title="No rankings yet"
            description="Time to get deeply specific."
            actionHref="/entries/new"
            actionLabel="Add an entry"
          />
        ) : (
          <ul className="flex flex-col gap-2">
            {recent.map(({ entry, category }) => (
              <li key={entry.id}>
                <Link
                  href={`/entries/${entry.id}`}
                  className="flex items-center gap-3 rounded-2xl border border-border/70 bg-card px-4 py-3 text-sm transition hover:bg-muted/40"
                >
                  <EntryRowThumb entry={entry} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{entry.title}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {category?.emoji} {category?.name ?? "Category"}
                    </p>
                  </div>
                  <span className="shrink-0 text-lg">{category?.emoji}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
