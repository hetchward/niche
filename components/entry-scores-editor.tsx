"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { computeScoreTotals } from "@/lib/scoring";
import type { Category, Entry, EntryScore } from "@/types/niche";

function mergeScoresForCategory(
  scores: EntryScore[] | undefined,
  category: Category,
): EntryScore[] {
  const byId = new Map((scores ?? []).map((s) => [s.criterionId, s]));
  return [...category.criteria]
    .sort((a, b) => a.displayOrder - b.displayOrder)
    .map((c) => {
      const r = byId.get(c.id);
      return {
        criterionId: c.id,
        score: r?.score ?? 0,
        ...(r?.note ? { note: r.note } : {}),
      };
    });
}

type RowProps = {
  criterion: Category["criteria"][number];
  initial: EntryScore;
  onPersist: (criterionId: string, score: number, note: string | undefined) => void;
};

function CriterionRow({ criterion: c, initial, onPersist }: RowProps) {
  const [editing, setEditing] = useState(false);
  const [scoreStr, setScoreStr] = useState(() => String(initial.score));
  const [note, setNote] = useState(() => initial.note ?? "");

  useEffect(() => {
    setScoreStr(String(initial.score));
    setNote(initial.note ?? "");
  }, [initial.score, initial.note, c.id]);

  const flush = useCallback(() => {
    const raw = Number.parseFloat(scoreStr);
    const n = Number.isFinite(raw)
      ? Math.min(c.maxScore, Math.max(0, raw))
      : initial.score;
    const trimmed = note.trim();
    onPersist(c.id, n, trimmed ? trimmed : undefined);
  }, [scoreStr, note, c.id, c.maxScore, initial.score, onPersist]);

  const finishEditing = useCallback(() => {
    flush();
    setEditing(false);
  }, [flush]);

  return (
    <div className="space-y-2 rounded-2xl border border-border/60 bg-muted/15 p-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 flex-1 space-y-1">
          <Label className="text-sm font-medium">
            {c.emoji ? `${c.emoji} ` : null}
            {c.name}
          </Label>
          <span className="text-xs text-muted-foreground tabular-nums">Scale 0–{c.maxScore}</span>
        </div>
        {editing ? (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="shrink-0 rounded-xl"
            onClick={finishEditing}
          >
            Done
          </Button>
        ) : (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="shrink-0 rounded-xl"
            onClick={() => setEditing(true)}
          >
            Edit
          </Button>
        )}
      </div>

      {editing ? (
        <>
          <Input
            inputMode="decimal"
            className="h-10 rounded-xl font-mono text-sm tabular-nums"
            value={scoreStr}
            onChange={(e) => setScoreStr(e.target.value)}
            onBlur={flush}
            aria-label={`Score for ${c.name}`}
          />
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Comment (optional)</Label>
            <Textarea
              className="min-h-[72px] resize-y rounded-xl text-sm"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              onBlur={flush}
              placeholder="Add a note for this criterion…"
              aria-label={`Note for ${c.name}`}
            />
          </div>
        </>
      ) : (
        <div className="space-y-2 text-sm">
          <p>
            <span className="text-muted-foreground">Score: </span>
            <span className="font-mono font-medium tabular-nums">{initial.score}</span>
            <span className="text-muted-foreground"> / {c.maxScore}</span>
          </p>
          <div>
            <p className="text-xs text-muted-foreground">Comment</p>
            {initial.note?.trim() ? (
              <p className="whitespace-pre-wrap leading-relaxed">{initial.note}</p>
            ) : (
              <p className="text-muted-foreground">None — tap Edit to add one.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function EntryScoresEditor({
  entry,
  category,
  onCommit,
}: {
  entry: Entry;
  category: Category;
  onCommit: (next: Entry) => void;
}) {
  const merged = useMemo(
    () => mergeScoresForCategory(entry.scores, category),
    [entry.scores, category],
  );

  const persistOne = useCallback(
    (criterionId: string, score: number, note: string | undefined) => {
      const base = mergeScoresForCategory(entry.scores, category);
      const nextScores = base.map((s) =>
        s.criterionId === criterionId
          ? note
            ? { criterionId, score, note }
            : { criterionId, score }
          : s,
      );
      const draft: Entry = {
        ...entry,
        scores: nextScores,
        updatedAt: new Date().toISOString(),
      };
      const totals = computeScoreTotals(draft, category);
      onCommit({ ...draft, ...totals });
    },
    [entry, category, onCommit],
  );

  const criteria = [...category.criteria].sort((a, b) => a.displayOrder - b.displayOrder);

  return (
    <div className="flex flex-col gap-3">
      {criteria.map((c) => {
        const row = merged.find((s) => s.criterionId === c.id)!;
        return (
          <CriterionRow key={c.id} criterion={c} initial={row} onPersist={persistOne} />
        );
      })}
    </div>
  );
}
