import { Badge } from "@/components/ui/badge";
import type { EntryLabel } from "@/types/niche";

const styles: Partial<Record<EntryLabel, string>> = {
  "Strong Buy": "bg-emerald-600/15 text-emerald-900 border-emerald-700/20",
  Watchlist: "bg-sky-600/15 text-sky-900 border-sky-700/20",
  Overvalued: "bg-amber-600/15 text-amber-950 border-amber-700/25",
  "Breakout Candidate": "bg-violet-600/15 text-violet-950 border-violet-700/25",
  "Blue Chip": "bg-slate-600/15 text-slate-900 border-slate-700/20",
  "Hidden Gem": "bg-teal-600/15 text-teal-950 border-teal-700/25",
  "Certified Classic": "bg-rose-600/15 text-rose-950 border-rose-700/25",
  "Risky Pick": "bg-orange-600/15 text-orange-950 border-orange-700/25",
  Flop: "bg-red-600/15 text-red-950 border-red-700/25",
  Controversial: "bg-fuchsia-600/15 text-fuchsia-950 border-fuchsia-700/25",
  "Needs Re-test": "bg-neutral-500/15 text-neutral-900 border-neutral-700/20",
};

export function LabelBadge({ label }: { label: EntryLabel }) {
  const cls = styles[label] ?? "bg-muted text-foreground border-border";
  return (
    <Badge variant="outline" className={`rounded-full border ${cls}`}>
      {label}
    </Badge>
  );
}
