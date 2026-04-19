import { APP_STATE_VERSION } from "@/lib/constants";
import { croissantSeedLocationForEntryId } from "@/lib/croissant-seed-geo";
import type {
  AppState,
  Category,
  Criterion,
  Entry,
  EntryScore,
  WeightPreset,
} from "@/types/niche";

function jitter(lat: number, lng: number, key: string): { latitude: number; longitude: number } {
  let h = 0;
  for (let i = 0; i < key.length; i++) {
    h = (Math.imul(31, h) + key.charCodeAt(i)) | 0;
  }
  const a = (Math.abs(h) % 1000) / 50_000;
  const b = (Math.abs(h >> 8) % 1000) / 50_000;
  return { latitude: lat + a - 0.01, longitude: lng + b - 0.01 };
}

function crit(
  id: string,
  name: string,
  displayOrder: number,
  maxScore: number,
  weight: number,
  emoji?: string,
): Criterion {
  return { id, name, displayOrder, maxScore, weight, emoji };
}

const now = "2026-04-19T12:00:00.000Z";

function reviewedEntry(
  partial: Omit<Entry, "status" | "createdAt" | "updatedAt"> & {
    scores: EntryScore[];
  },
): Entry {
  const t = partial.reviewedAt ?? now;
  return {
    ...partial,
    status: "reviewed",
    createdAt: t,
    updatedAt: t,
  };
}

function watchEntry(
  partial: Omit<Entry, "status" | "scores" | "createdAt" | "updatedAt">,
): Entry {
  return {
    ...partial,
    status: "watchlist",
    scores: undefined,
    bonusPoints: undefined,
    createdAt: now,
    updatedAt: now,
  };
}

export function getSeedAppState(): AppState {
  const categories: Category[] = [croissantCategory(), golfCategory(), roastCategory()];
  const entries: Entry[] = [
    ...croissantEntries(),
    ...golfEntries(),
    ...roastEntries(),
    ...golfWatchlist(),
    ...roastWatchlist(),
  ];
  return { version: APP_STATE_VERSION, categories, entries };
}

function singleBalancedPreset(catKey: string): {
  weightPresets: WeightPreset[];
  defaultPresetId: string;
} {
  const id = `preset-balanced-${catKey}`;
  return {
    weightPresets: [{ id, name: "Balanced", weights: {} }],
    defaultPresetId: id,
  };
}

function croissantCategory(): Category {
  const presets = singleBalancedPreset("croissant");
  return {
    id: "cat-croissant",
    name: "Croissant Index",
    emoji: "🥐",
    description: "The Ultimate Croissant Review — structure for the laminated truth.",
    colourTheme: "mustard",
    scoringMode: "equal",
    createdAt: now,
    criteria: [
      crit("crit-cro-pull", "Pull", 1, 5, 1),
      crit("crit-cro-buttery", "Buttery", 2, 5, 1),
      crit("crit-cro-crisp", "Crispness", 3, 5, 1),
      crit("crit-cro-layer", "Layer definition", 4, 5, 1),
      crit("crit-cro-curb", "Curb appeal", 5, 5, 1),
    ],
    ...presets,
  };
}

function croissantEntries(): Entry[] {
  const c = "cat-croissant";
  const s = (o: Record<string, number>): EntryScore[] =>
    Object.entries(o).map(([criterionId, score]) => ({ criterionId, score }));
  const croLoc = (entryId: string) => {
    const loc = croissantSeedLocationForEntryId(entryId);
    if (!loc) throw new Error(`Missing croissant seed geo for ${entryId}`);
    return loc;
  };

  return [
    reviewedEntry({
      id: "ent-cro-victoire",
      categoryId: c,
      title: "Victoire",
      reviewedAt: now,
      notes: "54% total in source notes.",
      ...croLoc("ent-cro-victoire"),
      scores: s({
        "crit-cro-pull": 3,
        "crit-cro-buttery": 2,
        "crit-cro-crisp": 3,
        "crit-cro-layer": 3,
        "crit-cro-curb": 2.5,
      }),
    }),
    reviewedEntry({
      id: "ent-cro-dawn",
      categoryId: c,
      title: "Dawn",
      ...croLoc("ent-cro-dawn"),
      scores: s({
        "crit-cro-pull": 2,
        "crit-cro-buttery": 1,
        "crit-cro-crisp": 3.75,
        "crit-cro-layer": 3.5,
        "crit-cro-curb": 5,
      }),
    }),
    reviewedEntry({
      id: "ent-cro-baker",
      categoryId: c,
      title: "My friend the baker",
      notes: "Crispness: good bottom.",
      ...croLoc("ent-cro-baker"),
      scores: s({
        "crit-cro-pull": 4.75,
        "crit-cro-buttery": 3.75,
        "crit-cro-crisp": 4.5,
        "crit-cro-layer": 4.5,
        "crit-cro-curb": 3,
      }),
    }),
    reviewedEntry({
      id: "ent-cro-fabbroca",
      categoryId: c,
      title: "Fabbroca",
      ...croLoc("ent-cro-fabbroca"),
      scores: s({
        "crit-cro-pull": 2,
        "crit-cro-buttery": 4,
        "crit-cro-crisp": 3,
        "crit-cro-layer": 3,
        "crit-cro-curb": 3.75,
      }),
    }),
    reviewedEntry({
      id: "ent-cro-pennyfour",
      categoryId: c,
      title: "Pennyfour",
      notes: "Crispness: nice chew nice caramelisation.",
      ...croLoc("ent-cro-pennyfour"),
      scores: s({
        "crit-cro-pull": 3.25,
        "crit-cro-buttery": 3.5,
        "crit-cro-crisp": 4.75,
        "crit-cro-layer": 3,
        "crit-cro-curb": 3.5,
      }),
    }),
    reviewedEntry({
      id: "ent-cro-home",
      categoryId: c,
      title: "Home Croissanterie",
      ...croLoc("ent-cro-home"),
      scores: s({
        "crit-cro-pull": 4,
        "crit-cro-buttery": 3,
        "crit-cro-crisp": 4.25,
        "crit-cro-layer": 3.5,
        "crit-cro-curb": 5,
      }),
    }),
  ];
}

function golfCategory(): Category {
  const weightPresets: WeightPreset[] = [
    {
      id: "preset-golf-traditionalist",
      name: "Traditionalist",
      weights: {
        "crit-golf-beers": 0.5,
        "crit-golf-lush": 2,
        "crit-golf-scenery": 2.8,
        "crit-golf-variety": 2.2,
        "crit-golf-cart": 1.2,
        "crit-golf-19": 0.6,
        "crit-golf-duck": 0.5,
      },
    },
    {
      id: "preset-golf-drinker",
      name: "Drinker",
      weights: {
        "crit-golf-beers": 3,
        "crit-golf-lush": 1,
        "crit-golf-scenery": 1,
        "crit-golf-variety": 1,
        "crit-golf-cart": 0.8,
        "crit-golf-19": 2.5,
        "crit-golf-duck": 0.7,
      },
    },
  ];
  return {
    id: "cat-golf",
    name: "Official Golf Rankings",
    emoji: "⛳️",
    description: "Beers, lushness, scenery, ducks — the complete fundamentals.",
    colourTheme: "forest",
    scoringMode: "equal",
    createdAt: now,
    criteria: [
      crit("crit-golf-beers", "Beers", 1, 5, 1, "🍺"),
      crit("crit-golf-lush", "Lushness", 2, 5, 1),
      crit("crit-golf-scenery", "Scenery", 3, 5, 1),
      crit("crit-golf-variety", "Variety", 4, 5, 1),
      crit("crit-golf-cart", "Cart availability", 5, 5, 1),
      crit("crit-golf-19", "19th hole", 6, 5, 1),
      crit("crit-golf-duck", "Bonus duck point", 7, 1, 1, "🦆"),
    ],
    weightPresets,
    defaultPresetId: "preset-golf-traditionalist",
  };
}

function golfEntries(): Entry[] {
  const c = "cat-golf";
  const geo = (name: string, lat: number, lng: number) => ({
    locationName: name,
    ...jitter(lat, lng, name),
  });

  const row = (
    id: string,
    title: string,
    loc: ReturnType<typeof geo>,
    scores: Record<string, number>,
    extra?: Partial<Entry>,
  ): Entry =>
    reviewedEntry({
      id,
      categoryId: c,
      title,
      ...loc,
      scores: Object.entries(scores).map(([criterionId, score]) => ({
        criterionId,
        score,
      })),
      ...extra,
    });

  return [
    row(
      "ent-golf-marrickville",
      "Marrickville",
      geo("Marrickville", -33.91762, 151.14003),
      {
        "crit-golf-beers": 5,
        "crit-golf-lush": 2.5,
        "crit-golf-scenery": 2,
        "crit-golf-variety": 2.5,
        "crit-golf-cart": 5,
        "crit-golf-19": 5,
        "crit-golf-duck": 1,
      },
      { bonusPoints: 10, notes: "Bonus +10 as is the OG ✨" },
    ),
    row(
      "ent-golf-queenstown",
      "Queenstown",
      geo("Queenstown NZ", -45.04143, 168.66699),
      {
        "crit-golf-beers": 0,
        "crit-golf-lush": 4,
        "crit-golf-scenery": 5,
        "crit-golf-variety": 3.75,
        "crit-golf-cart": 5,
        "crit-golf-19": 2.25,
        "crit-golf-duck": 1,
      },
      { notes: "19th hole: closer for renovations" },
    ),
    row(
      "ent-golf-gibraltar",
      "Gibraltar Golf Course",
      geo("Southern Highlands NSW", -34.4672, 150.413),
      {
        "crit-golf-beers": 4,
        "crit-golf-lush": 4.5,
        "crit-golf-scenery": 3.25,
        "crit-golf-variety": 4.5,
        "crit-golf-cart": 3,
        "crit-golf-19": 1.5,
        "crit-golf-duck": 1,
      },
      {
        reviewedAt: "2025-01-15T12:00:00.000Z",
        notes: "Too many trees (not because he is incompetent at golf)",
      },
    ),
    row(
      "ent-golf-hurstville",
      "Hurstville Golf course",
      geo("Hurstville", -33.97245, 151.0609),
      {
        "crit-golf-beers": 2,
        "crit-golf-lush": 2.75,
        "crit-golf-scenery": 2,
        "crit-golf-variety": 3,
        "crit-golf-cart": 0,
        "crit-golf-19": 1.25,
        "crit-golf-duck": 1,
      },
    ),
    row(
      "ent-golf-blackheath",
      "Blackheath",
      geo("Blackheath", -33.6483327, 150.2878599),
      {
        "crit-golf-beers": 0,
        "crit-golf-lush": 3.25,
        "crit-golf-scenery": 3,
        "crit-golf-variety": 3.75,
        "crit-golf-cart": 0,
        "crit-golf-19": 1.5,
        "crit-golf-duck": 1,
      },
    ),
    row(
      "ent-golf-turramurra",
      "North Turramurra",
      geo("North Turramurra", -33.70786, 151.15883),
      {
        "crit-golf-beers": 3,
        "crit-golf-lush": 3,
        "crit-golf-scenery": 3.5,
        "crit-golf-variety": 3,
        "crit-golf-cart": 5,
        "crit-golf-19": 1.25,
        "crit-golf-duck": 1,
      },
    ),
    row(
      "ent-golf-cootamundra",
      "Cootamundra",
      geo("Cootamundra", -34.6346015, 148.0099371),
      {
        "crit-golf-beers": 0,
        "crit-golf-lush": 3.5,
        "crit-golf-scenery": 3.25,
        "crit-golf-variety": 3.75,
        "crit-golf-cart": 5,
        "crit-golf-19": 1.5,
        "crit-golf-duck": 1,
      },
      { notes: "Scenery: Train. Bonus duck: 🦆 🦘🦎" },
    ),
    row(
      "ent-golf-narooma",
      "Narooma Golf Course",
      geo("Narooma", -36.2279299, 150.1357432),
      {
        "crit-golf-beers": 4.5,
        "crit-golf-lush": 4.5,
        "crit-golf-scenery": 5,
        "crit-golf-variety": 5,
        "crit-golf-cart": 5,
        "crit-golf-19": 4,
        "crit-golf-duck": 0,
      },
    ),
    row(
      "ent-golf-hawkes-nest",
      "Hawkes Nest Golf Course",
      geo("Hawks Nest", -32.6692173, 152.1817005),
      {
        "crit-golf-beers": 0,
        "crit-golf-lush": 5,
        "crit-golf-scenery": 2,
        "crit-golf-variety": 1,
        "crit-golf-cart": 5,
        "crit-golf-19": 3.75,
        "crit-golf-duck": 1,
      },
      {
        reviewedAt: "2024-12-08T12:00:00.000Z",
        notes: "Very straight and extremely lush, and amazing hybrid in the club hire",
      },
    ),
    row(
      "ent-golf-gordon",
      "Gordon",
      geo("Gordon", -33.7600115, 151.1461315),
      {
        "crit-golf-beers": 2.5,
        "crit-golf-lush": 3,
        "crit-golf-scenery": 3,
        "crit-golf-variety": 3.5,
        "crit-golf-cart": 5,
        "crit-golf-19": 3.5,
        "crit-golf-duck": 1,
      },
      { notes: "Beers: unknown" },
    ),
    row(
      "ent-golf-strathfield",
      "Strathfield",
      geo("Strathfield South", -33.8843629, 151.0696534),
      {
        "crit-golf-beers": 0,
        "crit-golf-lush": 4.75,
        "crit-golf-scenery": 3,
        "crit-golf-variety": 3,
        "crit-golf-cart": 5,
        "crit-golf-19": 3.5,
        "crit-golf-duck": 1,
      },
      {
        reviewedAt: "2024-12-23T12:00:00.000Z",
        notes: "Scenery: bonus point for freight trains",
      },
    ),
    row(
      "ent-golf-gosford",
      "Gosford",
      geo("Gosford", -33.4180244, 151.3401692),
      {
        "crit-golf-beers": 4,
        "crit-golf-lush": 2.75,
        "crit-golf-scenery": 3.25,
        "crit-golf-variety": 2,
        "crit-golf-cart": 5,
        "crit-golf-19": 2.5,
        "crit-golf-duck": 1,
      },
      {
        reviewedAt: "2024-12-28T12:00:00.000Z",
        notes: "Rated with Greg, Pat, H, M. Palm trees under heated debate.",
      },
    ),
    row(
      "ent-golf-kangaroo-valley",
      "Kangaroo Valley Golf Course",
      geo("Kangaroo Valley", -34.7396965, 150.5116542),
      {
        "crit-golf-beers": 0,
        "crit-golf-lush": 3,
        "crit-golf-scenery": 5,
        "crit-golf-variety": 4.75,
        "crit-golf-cart": 5,
        "crit-golf-19": 2.75,
        "crit-golf-duck": 1,
      },
      { reviewedAt: "2025-01-02T12:00:00.000Z" },
    ),
    row(
      "ent-golf-asquith",
      "Asquith Golf Course",
      geo("Asquith", -33.6826776, 151.1159283),
      {
        "crit-golf-beers": 5,
        "crit-golf-lush": 3.5,
        "crit-golf-scenery": 3.25,
        "crit-golf-variety": 4.75,
        "crit-golf-cart": 5,
        "crit-golf-19": 4.75,
        "crit-golf-duck": 1,
      },
      {
        reviewedAt: "2025-01-02T12:00:00.000Z",
        notes: "So many ducks they stepped into Josh’s shot. Free beer except Asahi (-0.25 in spirit).",
      },
    ),
    row(
      "ent-golf-thredbo",
      "Thredbo Golf Course",
      geo("Thredbo", -36.5075261, 148.2969846),
      {
        "crit-golf-beers": 0,
        "crit-golf-lush": 2.75,
        "crit-golf-scenery": 4,
        "crit-golf-variety": 2.5,
        "crit-golf-cart": 0,
        "crit-golf-19": 4,
        "crit-golf-duck": 1,
      },
      {
        reviewedAt: "2025-01-26T12:00:00.000Z",
        notes: "Very squelchy greens — only 9 holes.",
      },
    ),
    row(
      "ent-golf-montafon",
      "Golf Club Montafon",
      geo("Tschagguns AT", 47.063154, 9.929737),
      {
        "crit-golf-beers": 0,
        "crit-golf-lush": 4,
        "crit-golf-scenery": 3.75,
        "crit-golf-variety": 1,
        "crit-golf-cart": 5,
        "crit-golf-19": 4,
        "crit-golf-duck": 1,
      },
      { reviewedAt: "2025-07-17T12:00:00.000Z", notes: "Beers: unknown / no" },
    ),
    row(
      "ent-golf-sedrun",
      "Sedrun Golf Club",
      geo("Sedrun CH", 46.6574258, 8.7174311),
      {
        "crit-golf-beers": 0,
        "crit-golf-lush": 4.75,
        "crit-golf-scenery": 5,
        "crit-golf-variety": 4,
        "crit-golf-cart": 5,
        "crit-golf-19": 2.5,
        "crit-golf-duck": 1,
      },
      {
        reviewedAt: "2025-08-21T12:00:00.000Z",
        notes: "Manager lent clubs; Matt’s bag was Black Watch tartan.",
      },
    ),
  ];
}

function golfWatchlist(): Entry[] {
  const c = "cat-golf";
  const items: {
    id: string;
    title: string;
    notes?: string;
    locationName: string;
    lat: number;
    lng: number;
  }[] = [
    {
      id: "wl-golf-bonville",
      title: "Bonville golf course",
      notes: "Stay on course",
      locationName: "Bonville NSW",
      lat: -30.3623193,
      lng: 153.0261716,
    },
    {
      id: "wl-golf-hamilton",
      title: "Hamilton Island",
      locationName: "Dent Island QLD",
      lat: -20.35791,
      lng: 148.935999,
    },
    {
      id: "wl-golf-tasmania",
      title: "Tasmania",
      locationName: "Tasmania",
      lat: -42.0,
      lng: 146.5,
    },
    {
      id: "wl-golf-gerringong",
      title: "Gerringong",
      notes: "Chill but great view",
      locationName: "Gerringong NSW",
      lat: -34.7634438,
      lng: 150.8225242,
    },
    {
      id: "wl-golf-mollymook",
      title: "Mollymook hilltop course",
      notes: "Very good",
      locationName: "Mollymook NSW",
      lat: -35.331958,
      lng: 150.4642179,
    },
    {
      id: "wl-golf-mt-broughton",
      title: "Mt Broughton",
      locationName: "Sutton Forest NSW",
      lat: -34.5710855,
      lng: 150.3467014,
    },
    {
      id: "wl-golf-liverpool",
      title: "Liverpool",
      notes: "Good easy option",
      locationName: "Lansvale NSW",
      lat: -33.9054111,
      lng: 150.9726309,
    },
    {
      id: "wl-golf-norfolk",
      title: "Norfolk Island",
      locationName: "Kingston, Norfolk Island",
      lat: -29.0590768,
      lng: 167.9654131,
    },
    {
      id: "wl-golf-canterbury",
      title: "Canterbury",
      notes: "Don’t need to book — only 9 holes",
      locationName: "Hurlstone Park NSW",
      lat: -33.9068916,
      lng: 151.1265747,
    },
    {
      id: "wl-golf-northbridge",
      title: "Northbridge",
      locationName: "Northbridge NSW",
      lat: -33.8112877,
      lng: 151.221423,
    },
    {
      id: "wl-golf-rosebud",
      title: "Rosebud country club",
      locationName: "Rosebud VIC",
      lat: -38.3827797,
      lng: 144.8982739,
    },
    {
      id: "wl-golf-gerroa",
      title: "Gerringong Gerroa",
      locationName: "Gerroa NSW",
      lat: -34.7634438,
      lng: 150.8225242,
    },
    {
      id: "wl-golf-shelly",
      title: "Shelly beach",
      locationName: "Shelly Beach NSW",
      lat: -33.3693745,
      lng: 151.4869165,
    },
    {
      id: "wl-golf-riverside",
      title: "Riverside Oaks",
      locationName: "Cattai NSW",
      lat: -33.5264704,
      lng: 150.9159561,
    },
  ];
  return items.map((it) =>
    watchEntry({
      id: it.id,
      categoryId: c,
      title: it.title,
      notes: it.notes,
      locationName: it.locationName,
      ...jitter(it.lat, it.lng, it.id),
    }),
  );
}

function roastCategory(): Category {
  const presets = singleBalancedPreset("roast");
  return {
    id: "cat-roast",
    name: "Radical Roast Report",
    emoji: "🥔",
    description: "🥔🥕🍗 Sunday audits with Yorkshire accountability.",
    colourTheme: "tomato",
    scoringMode: "equal",
    createdAt: now,
    criteria: [
      crit("crit-roast-meat", "Meat", 1, 5, 1),
      crit("crit-roast-york", "Yorkshire Pudding", 2, 5, 1),
      crit("crit-roast-gravy", "Gravy", 3, 5, 1),
      crit("crit-roast-trim", "Trimmings", 4, 5, 1),
      crit("crit-roast-potato", "Potatoes", 5, 5, 1),
      crit("crit-roast-amb", "Ambiance", 6, 5, 1),
      crit("crit-roast-vfm", "Value for Money", 7, 5, 1),
      crit("crit-roast-crack", "Crackling", 8, 5, 1),
    ],
    ...presets,
  };
}

function roastEntries(): Entry[] {
  const c = "cat-roast";
  const london = (name: string) => jitter(51.524, -0.087, name);

  const R = (
    id: string,
    title: string,
    reviewedAt: string,
    weather: string | undefined,
    scores: Record<string, number>,
    notes?: string,
    extra?: Partial<Entry>,
  ): Entry =>
    reviewedEntry({
      id,
      categoryId: c,
      title,
      locationName: "London",
      reviewedAt,
      weather,
      notes,
      ...london(title),
      scores: Object.entries(scores).map(([criterionId, score]) => ({
        criterionId,
        score,
      })),
      ...extra,
    });

  return [
    R(
      "ent-roast-princess-shoreditch",
      "The Princess of Shoreditch",
      "2025-10-12T12:00:00.000Z",
      undefined,
      {
        "crit-roast-meat": 3,
        "crit-roast-york": 4,
        "crit-roast-gravy": 2,
        "crit-roast-trim": 3.5,
        "crit-roast-potato": 2.5,
        "crit-roast-amb": 3.75,
        "crit-roast-vfm": 1.5,
        "crit-roast-crack": 0,
      },
      "Tenderness; pick out by teeth.",
    ),
    R(
      "ent-roast-crown-vp",
      "The Crown Victoria Park",
      "2025-10-19T12:00:00.000Z",
      "🌧️",
      {
        "crit-roast-meat": 3.5,
        "crit-roast-york": 2.75,
        "crit-roast-gravy": 2,
        "crit-roast-trim": 3.75,
        "crit-roast-potato": 3,
        "crit-roast-amb": 4.5,
        "crit-roast-vfm": 3.5,
        "crit-roast-crack": 0,
      },
      "Crackling didn’t crackle.",
    ),
    R(
      "ent-roast-boathouse",
      "Bistro at the Boathouse",
      "2025-10-26T12:00:00.000Z",
      "☁️",
      {
        "crit-roast-meat": 3,
        "crit-roast-york": 3.5,
        "crit-roast-gravy": 3.75,
        "crit-roast-trim": 3.5,
        "crit-roast-potato": 2.5,
        "crit-roast-amb": 3.75,
        "crit-roast-vfm": 0.5,
        "crit-roast-crack": 0,
      },
      "£24 for roast; stuffing was good; greens not cooked with flavour.",
    ),
    R(
      "ent-roast-exmoor",
      "The Exmoor Forest Inn",
      "2025-11-09T12:00:00.000Z",
      "🌧️",
      {
        "crit-roast-meat": 4.5,
        "crit-roast-york": 2.75,
        "crit-roast-gravy": 4,
        "crit-roast-trim": 4.25,
        "crit-roast-potato": 2.5,
        "crit-roast-amb": 5,
        "crit-roast-vfm": 5,
        "crit-roast-crack": 0,
      },
      "Pork roll well seasoned; crackling very good; £19 for roast.",
    ),
    R(
      "ent-roast-princess-wales",
      "The Princess of Wales",
      "2025-11-23T12:00:00.000Z",
      undefined,
      {
        "crit-roast-meat": 2.25,
        "crit-roast-york": 1.5,
        "crit-roast-gravy": 4.75,
        "crit-roast-trim": 3,
        "crit-roast-potato": 2.5,
        "crit-roast-amb": 4.75,
        "crit-roast-vfm": 3.5,
        "crit-roast-crack": 0,
      },
      "Gravy nice and dark — would get 5 if gravy boat.",
    ),
    R(
      "ent-roast-scolts",
      "The Scolts Head",
      "2026-01-04T12:00:00.000Z",
      undefined,
      {
        "crit-roast-meat": 3.5,
        "crit-roast-york": 3.25,
        "crit-roast-gravy": 4,
        "crit-roast-trim": 4,
        "crit-roast-potato": 2.25,
        "crit-roast-amb": 5,
        "crit-roast-vfm": 5,
        "crit-roast-crack": 1.5,
      },
      "£19 pounds.",
    ),
    R(
      "ent-roast-white-cross",
      "The White Cross Richmond",
      "2026-01-25T12:00:00.000Z",
      undefined,
      {
        "crit-roast-meat": 3,
        "crit-roast-york": 4.5,
        "crit-roast-gravy": 2,
        "crit-roast-trim": 3,
        "crit-roast-potato": 3.75,
        "crit-roast-amb": 5,
        "crit-roast-vfm": 3,
        "crit-roast-crack": 0,
      },
      "No crackling; chicken great. Gravy not enough or thick enough.",
    ),
    R(
      "ent-roast-hemmingway",
      "The Hemmingway",
      "2026-03-15T12:00:00.000Z",
      undefined,
      {
        "crit-roast-meat": 4,
        "crit-roast-york": 5,
        "crit-roast-gravy": 2,
        "crit-roast-trim": 3.5,
        "crit-roast-potato": 3,
        "crit-roast-amb": 4.5,
        "crit-roast-vfm": 3.5,
        "crit-roast-crack": 0,
      },
      "Would bring people here for a roast. Crackling great (folded into meat score in notes).",
      { wouldReturn: true },
    ),
  ];
}

function roastWatchlist(): Entry[] {
  const c = "cat-roast";
  const L = (title: string) => ({
    title,
    ...jitter(51.524, -0.087, title),
    locationName: "London",
  });
  return [
    watchEntry({
      id: "wl-roast-pig",
      categoryId: c,
      ...L("The Pig and Butcher"),
      notes: "Islington",
    }),
    watchEntry({
      id: "wl-roast-albion",
      categoryId: c,
      ...L("The Albion"),
      notes: "Over rated — Albion",
    }),
    watchEntry({
      id: "wl-roast-tredegar",
      categoryId: c,
      ...L("Lord Tredegar"),
      notes: "Boe",
    }),
    watchEntry({
      id: "wl-roast-faltering",
      categoryId: c,
      ...L("Faltering Fullback"),
      notes: "Finsbury Park",
    }),
    watchEntry({
      id: "wl-roast-tony",
      categoryId: c,
      ...L("Tony carvery"),
    }),
  ];
}
