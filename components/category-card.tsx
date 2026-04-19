import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { categoryStats } from "@/lib/selectors";
import type { AppState, Category } from "@/types/niche";
import Link from "next/link";

export function CategoryCard({
  state,
  category,
  withLink = true,
}: {
  state: AppState;
  category: Category;
  /** When false, renders a static card (e.g. shared snapshot view). */
  withLink?: boolean;
}) {
  const s = categoryStats(state, category);
  const card = (
    <Card
      className={`overflow-hidden rounded-3xl border-border/70 shadow-sm ${
        withLink ? "transition hover:-translate-y-0.5 hover:shadow-md" : ""
      }`}
    >
        <CardHeader className="flex flex-row items-start gap-3 space-y-0 pb-2">
          <span className="text-4xl leading-none" aria-hidden>
            {category.emoji}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-lg font-semibold tracking-tight">
              {category.name}
            </p>
            {category.description ? (
              <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                {category.description}
              </p>
            ) : null}
          </div>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
          <div>
            <span className="font-medium text-foreground">{s.entryCount}</span>{" "}
            ranked
          </div>
          <div>
            <span className="font-medium text-foreground">{s.watchlistCount}</span>{" "}
            on hit list
          </div>
          <div className="col-span-2 truncate">
            Leader:{" "}
            <span className="font-medium text-foreground">
              {s.leaderTitle ?? "—"}
            </span>
          </div>
          <div className="col-span-2">
            Avg {s.avgLabel}:{" "}
            <span className="font-medium text-foreground">{s.avgScore}</span>
          </div>
        </CardContent>
      </Card>
  );
  if (!withLink) {
    return <div className="block">{card}</div>;
  }
  return (
    <Link href={`/categories/${category.id}`} className="block">
      {card}
    </Link>
  );
}
