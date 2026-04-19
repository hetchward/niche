export type ScoringMode = "equal" | "weighted";

export type Criterion = {
  id: string;
  name: string;
  emoji?: string;
  description?: string;
  maxScore: number;
  weight: number;
  displayOrder: number;
};

/** Named weight lens; missing keys use `Criterion.weight`, then 1. */
export type WeightPreset = {
  id: string;
  name: string;
  weights: Partial<Record<string, number>>;
};

export type Category = {
  id: string;
  name: string;
  emoji: string;
  description?: string;
  colourTheme?: string;
  scoringMode: ScoringMode;
  criteria: Criterion[];
  /** Saved sort/display lenses (criteria-only /100 uses these). */
  weightPresets: WeightPreset[];
  /** Used for home averages and default leaderboard /100. */
  defaultPresetId?: string;
  createdAt: string;
};

export type EntryLabel =
  | "Watchlist"
  | "Strong Buy"
  | "Overvalued"
  | "Breakout Candidate"
  | "Blue Chip"
  | "Hidden Gem"
  | "Certified Classic"
  | "Risky Pick"
  | "Flop"
  | "Controversial"
  | "Needs Re-test";

export type EntryScore = {
  criterionId: string;
  score: number;
  note?: string;
};

export type EntryStatus = "reviewed" | "watchlist";

export type Entry = {
  id: string;
  categoryId: string;
  title: string;
  reviewedAt?: string;
  locationName?: string;
  latitude?: number;
  longitude?: number;
  photoUrls?: string[];
  notes?: string;
  scores?: EntryScore[];
  bonusPoints?: number;
  weightedTotalScore?: number;
  unweightedTotalScore?: number;
  label?: EntryLabel;
  tags?: string[];
  weather?: string;
  wouldReturn?: boolean;
  status: EntryStatus;
  recommendationSource?: string;
  createdAt: string;
  updatedAt: string;
};

export type AppState = {
  version: number;
  categories: Category[];
  entries: Entry[];
};
