import type { LeaderboardSort } from "@/lib/scoring";
import { formatLeaderboardSort, getLeaderboardSortValue } from "@/lib/scoring";
import type { Category, Entry } from "@/types/niche";
import { EntryRowThumb } from "@/components/entry-photo-picker";
import { LabelBadge } from "@/components/label-badge";
import { cn } from "@/lib/utils";
import Link from "next/link";

export function LeaderboardList({
  entries,
  category,
  sort,
  startRank = 1,
  linkable = true,
}: {
  entries: Entry[];
  category: Category;
  sort: LeaderboardSort;
  startRank?: number;
  /** When false, rows are not links (e.g. shared snapshot view). */
  linkable?: boolean;
}) {
  const sortLabel = formatLeaderboardSort(category, sort);
  const rowClass = cn(
    "flex items-center gap-3 rounded-2xl border border-border/70 bg-card px-4 py-3 transition",
    linkable && "hover:bg-muted/40",
  );

  return (
    <ol className="flex flex-col gap-2">
      <p className="text-xs text-muted-foreground">{sortLabel}</p>
      {entries.map((e, idx) => {
        const score = getLeaderboardSortValue(e, category, sort);
        const inner = (
          <>
            <span className="w-8 shrink-0 text-sm font-semibold text-muted-foreground">
              #{startRank + idx}
            </span>
            <EntryRowThumb entry={e} />
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{e.title}</p>
              {e.locationName ? (
                <p className="truncate text-xs text-muted-foreground">
                  {e.locationName}
                </p>
              ) : null}
            </div>
            <div className="shrink-0 text-right">
              <p className="text-sm font-semibold tabular-nums">
                {Math.round(score * 100) / 100}
              </p>
              {e.label ? (
                <div className="mt-1 flex justify-end">
                  <LabelBadge label={e.label} />
                </div>
              ) : null}
            </div>
          </>
        );
        return (
          <li key={e.id}>
            {linkable ? (
              <Link href={`/entries/${e.id}`} className={rowClass}>
                {inner}
              </Link>
            ) : (
              <div className={rowClass}>{inner}</div>
            )}
          </li>
        );
      })}
    </ol>
  );
}
