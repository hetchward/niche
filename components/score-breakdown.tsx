import type { Category, Entry, EntryScore } from "@/types/niche";

function scoreNote(scores: EntryScore[] | undefined, criterionId: string) {
  return scores?.find((s) => s.criterionId === criterionId)?.note;
}

export function ScoreBreakdown({
  entry,
  category,
}: {
  entry: Entry;
  category: Category;
}) {
  const byId = new Map((entry.scores ?? []).map((s) => [s.criterionId, s]));
  const criteria = [...category.criteria].sort(
    (a, b) => a.displayOrder - b.displayOrder,
  );
  return (
    <div className="flex flex-col gap-2">
      {criteria.map((c) => {
        const row = byId.get(c.id);
        const score = row?.score ?? 0;
        const note = scoreNote(entry.scores, c.id);
        return (
          <div
            key={c.id}
            className="flex items-start justify-between gap-3 rounded-2xl border border-border/60 bg-muted/20 px-4 py-3"
          >
            <div className="min-w-0">
              <p className="text-sm font-medium">
                {c.emoji ? `${c.emoji} ` : null}
                {c.name}
              </p>
              {note ? (
                <p className="mt-1 text-xs text-muted-foreground">{note}</p>
              ) : null}
            </div>
            <p className="shrink-0 text-sm font-semibold tabular-nums">
              {score}/{c.maxScore}
            </p>
          </div>
        );
      })}
    </div>
  );
}
