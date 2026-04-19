import { Card, CardContent } from "@/components/ui/card";
import type { LeaderboardSort } from "@/lib/scoring";
import { formatLeaderboardSort, getLeaderboardSortValue } from "@/lib/scoring";
import type { Category, Entry } from "@/types/niche";
import { entryCoverUrl } from "@/components/entry-photo-picker";
import { LabelBadge } from "@/components/label-badge";
import Link from "next/link";

const medals = ["🥇", "🥈", "🥉"];

export function Podium({
  entries,
  category,
  sort,
}: {
  entries: Entry[];
  category: Category;
  sort: LeaderboardSort;
}) {
  if (!entries.length) return null;
  const sortLabel = formatLeaderboardSort(category, sort);
  return (
    <div className="grid grid-cols-3 gap-2">
      <p className="col-span-3 text-xs text-muted-foreground">{sortLabel}</p>
      {entries.map((e, i) => {
        const score = getLeaderboardSortValue(e, category, sort);
        const cover = entryCoverUrl(e);
        return (
          <Link key={e.id} href={`/entries/${e.id}`}>
            <Card className="h-full overflow-hidden rounded-2xl border-border/70">
              {cover ? (
                // eslint-disable-next-line @next/next/no-img-element -- local data URLs
                <img
                  src={cover}
                  alt=""
                  className="aspect-[4/3] w-full object-cover"
                />
              ) : null}
              <CardContent className="flex flex-col gap-2 p-4 text-center">
                <div className="text-2xl">{medals[i] ?? "🏅"}</div>
                <p className="line-clamp-2 text-sm font-semibold leading-snug">
                  {e.title}
                </p>
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">
                    {Math.round(score * 100) / 100}
                  </span>
                </p>
                {e.label ? (
                  <div className="flex justify-center">
                    <LabelBadge label={e.label} />
                  </div>
                ) : null}
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
