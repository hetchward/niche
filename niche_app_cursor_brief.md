# Niche

**Tagline:** rating app for those with oddly specific tastes

## Product concept
Niche is a mobile-first app where users create categories for their niche passions and rank items within them using custom scoring criteria, optional weights, notes, and playful labels.

The app is not about productivity or self-improvement. It is about celebrating unusual expertise and personal taste with structure, humour, and pride.

Examples of categories:
- Radical Roast Report
- Official Golf Rankings
- Croissant Index
- Sticky Toffee Pudding Board
- Pub Fireplace Rankings
- Ramen Leaderboard

Examples of entries:
- The Pig and Butcher = Watchlist
- Asquith Golf Course = Strong Buy
- The Albion = Overvalued
- The Hemmingway = Breakout candidate

## Core design direction
### Overall vibe
- Playful and warm
- Emoji-led and personality-heavy
- Polished but not corporate
- Mobile-first
- Feels like a shrine to oddly specific opinions

### Inspiration
- Letterboxd warmth
- Notes app intimacy
- Scrapbook energy
- Light leaderboard drama
- Tiny bit of financial language for fun labels

### Visual language
- Category cards with emojis
- Soft rounded corners
- Cream / tomato / forest / mustard / sky palette
- Playful badges and tags
- Warm typography
- Strong spacing and easy thumb use on mobile

### Tone of voice
- Funny but not cringe
- Affectionate
- Structured
- Proudly opinionated
- Serious UI for unserious rankings

## Key product principles
1. Users can create a category for almost anything
2. Every category can have its own scoring philosophy
3. Users should be able to customise weighted criteria or use equal scoring
4. The leaderboard reveal should feel satisfying
5. Notes and weird commentary matter as much as numbers
6. Watchlist and labels should create future excitement, not only record history
7. The map should make the collection feel alive and explorable

## MVP feature set
### 1. Categories
Users can create custom categories.

Each category includes:
- id
- name
- emoji
- description
- default marker emoji for map
- scoring mode: equal or weighted
- max score per criterion
- category colour theme (optional)

Examples:
- 🥔 Radical Roast Report
- ⛳ Official Golf Rankings
- 🥐 Croissant Index

### 2. Criteria
Each category has custom criteria.

Each criterion includes:
- id
- name
- maxScore
- weight
- optional emoji/icon
- optional description
- displayOrder

Examples for roasts:
- Meat
- Yorkshire Pudding
- Gravy
- Trimmings
- Potatoes
- Ambiance
- Value for Money
- Crackling

Examples for golf:
- Beers
- Lushness
- Scenery
- Variety
- Cart availability
- 19th hole
- Bonus duck point

### 3. Entries
Each reviewed item belongs to a category.

Each entry includes:
- id
- categoryId
- title
- dateVisited or reviewedAt
- location name
- latitude
- longitude
- photos
- notes
- scores by criterion
- bonusPoints
- weightedTotalScore
- unweightedTotalScore
- ranking label
- tags
- weather or vibe note (optional)
- wouldReturn boolean (optional)

### 4. Ranking labels
These are playful qualitative layers that sit alongside the numeric score.

Each entry can optionally have one ranking label from a controlled set.

Initial label set:
- Watchlist
- Strong Buy
- Overvalued
- Breakout Candidate
- Blue Chip
- Hidden Gem
- Certified Classic
- Risky Pick
- Flop
- Controversial
- Needs Re-test

Purpose:
- Gives users another expressive layer beyond the score
- Allows fun filtering and groupings
- Adds the stock-language wink without making the app feel like a finance tool

Example usage:
- The Pig and Butcher = Watchlist
- Asquith Golf Course = Strong Buy
- The Albion = Overvalued
- The Hemmingway = Breakout Candidate

### 5. Leaderboards
Each category has a leaderboard.

Leaderboard should support:
- Sort by weighted score
- Sort by unweighted score
- Filter by label
- Filter by date range
- Show top 3 podium
- Show movement indicators later if needed

### 6. Watchlist / Hit List
Users can add places or items they want to try later.

Fields:
- id
- categoryId
- title
- optional location
- optional notes
- optional label
- optional savedFrom or recommendation source
- latitude
- longitude

Examples:
- The Pig and Butcher
- Lord Tredegar
- Bonville Golf Course
- Hamilton Island

### 7. Map view
Map view is a key differentiator.

The map should show:
- reviewed entries
- watchlist items
- markers based on category emoji

Rules:
- Each category uses its emoji as the map marker or marker badge
- If map markers need a fallback visual, use coloured circular pins with the emoji centred inside
- Reviewed entries and watchlist items should be visually different
- Tapping a marker opens a mini card with item name, category, score or label, and quick action to view detail

Examples:
- Roast entries appear as 🥔 markers
- Golf entries appear as ⛳ markers
- Croissant entries appear as 🥐 markers

Map filters:
- All categories
- Single category
- Reviewed only
- Watchlist only
- Top rated only
- By label

## Suggested app structure
### Screen 1: Home
Purpose:
Show all categories and give a quick sense of the user’s world of niche rankings.

Content:
- App title and fun subtitle
- Search bar
- Category cards
- Recent activity
- Quick add button
- Map preview card

Each category card shows:
- emoji
- name
- entry count
- watchlist count
- current leader
- average score

### Screen 2: Category detail
Purpose:
Main hub for a single niche.

Sections:
- Category header with emoji and description
- Criteria list and weight summary
- Top 3 podium
- Leaderboard list
- Watchlist section
- Map preview for that category
- Add entry CTA
- Add watchlist CTA

### Screen 3: Entry detail
Purpose:
View one review in full.

Content:
- title
- date
- score badge
- ranking label badge
- per-criterion breakdown
- notes
- photos
- location
- map snippet
- edit button

### Screen 4: Add entry
Purpose:
Create a new scored review.

Flow:
1. Choose category
2. Enter title and location
3. Pick or confirm map location
4. Add date
5. Score criteria
6. Add optional bonus points
7. Add ranking label
8. Add notes
9. Save and reveal leaderboard placement

### Screen 5: Add watchlist item
Purpose:
Add a future target without a score.

Fields:
- category
- title
- location
- notes
- optional label
- source/recommendation

### Screen 6: Create category
Purpose:
Set up a new ranking system.

Fields:
- category name
- emoji
- description
- choose colour theme
- scoring mode equal or weighted
- add criteria
- set max score per criterion
- set weights
- optional default labels

### Screen 7: Map
Purpose:
Explore all reviewed and saved places visually.

Content:
- full-screen map
- category chips with emojis
- toggles for reviewed / watchlist / top rated
- marker tap cards
- open detail action

## Data model

```ts
export type Category = {
  id: string;
  name: string;
  emoji: string;
  description?: string;
  colourTheme?: string;
  scoringMode: 'equal' | 'weighted';
  criteria: Criterion[];
  createdAt: string;
};

export type Criterion = {
  id: string;
  name: string;
  emoji?: string;
  description?: string;
  maxScore: number;
  weight: number;
  displayOrder: number;
};

export type EntryLabel =
  | 'Watchlist'
  | 'Strong Buy'
  | 'Overvalued'
  | 'Breakout Candidate'
  | 'Blue Chip'
  | 'Hidden Gem'
  | 'Certified Classic'
  | 'Risky Pick'
  | 'Flop'
  | 'Controversial'
  | 'Needs Re-test';

export type EntryScore = {
  criterionId: string;
  score: number;
  note?: string;
};

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
  status: 'reviewed' | 'watchlist';
  createdAt: string;
  updatedAt: string;
};
```

## Weighted scoring logic
### Equal mode
Total score = sum of all criterion scores

### Weighted mode
Weighted total score = sum of (criterion score / criterion max score) x criterion weight

Optional:
- show raw score and weighted score
- support bonus points applied after weighted calculation
- support rank recalculation after save

## UX details that matter
### Leaderboard reveal
When a user saves a new entry, show:
- score
- rank position
- label
- who it beat or where it sits

Example:
- “The Hemmingway enters at #3 in Radical Roast Report”
- “Strong Buy status unlocked”

### Notes style
Notes should be prominent and charming, not hidden.
Users often remember lines like:
- “crackling didn’t crackle”
- “too many trees, not because he is incompetent at golf”
- “would bring people here for a roast”

This voice is core to the product.

### Empty states
Examples:
- “No rankings yet. Time to get deeply specific.”
- “Your watchlist is suspiciously empty.”
- “Start a category for the thing you won’t shut up about.”

## MVP technical recommendation for Cursor
### Stack
- Next.js App Router
- TypeScript
- Tailwind CSS
- shadcn/ui for primitives
- Local storage for MVP
- React Hook Form + Zod for forms
- Mapbox or Leaflet for map view

### Why local storage first
- Fastest MVP
- No auth required yet
- Easy to test with your real roast, golf, and croissant data
- Can migrate to Supabase or Firebase later

## Folder suggestion
```txt
app/
  page.tsx
  categories/
    [id]/page.tsx
    new/page.tsx
  entries/
    new/page.tsx
    [id]/page.tsx
  watchlist/
    new/page.tsx
  map/page.tsx
components/
  category-card.tsx
  leaderboard-list.tsx
  podium.tsx
  score-breakdown.tsx
  entry-form.tsx
  watchlist-form.tsx
  label-badge.tsx
  emoji-marker.tsx
  map-view.tsx
  empty-state.tsx
lib/
  storage.ts
  scoring.ts
  sample-data.ts
  constants.ts
  utils.ts
types/
  niche.ts
```

## MVP sample categories to seed
### Radical Roast Report
Emoji: 🥔
Criteria:
- Meat
- Yorkshire Pudding
- Gravy
- Trimmings
- Potatoes
- Ambiance
- Value for Money
- Crackling

### Official Golf Rankings
Emoji: ⛳
Criteria:
- Beers
- Lushness
- Scenery
- Variety
- Cart availability
- 19th hole
- Bonus duck point

### Croissant Index
Emoji: 🥐
Criteria to confirm later from user data

## Cursor build request
Paste this into Cursor as the main implementation brief:

Build a mobile-first web app called Niche.

Tagline: rating app for those with oddly specific tastes.

The concept:
Users create categories for niche passions, define custom scoring criteria and optional weights, add reviewed entries with notes and scores, maintain watchlists, and see a leaderboard per category. The app should feel warm, playful, emoji-led, and personality-heavy.

Core requirements:
- Create custom categories with emoji, description, criteria, and scoring mode
- Support equal or weighted scoring
- Add reviewed entries with title, location, date, notes, per-criterion scores, bonus points, and an optional qualitative label
- Add watchlist items without scores
- Show a leaderboard for each category
- Show top 3 podium per category
- Include a full map view for reviewed and watchlist items
- Use the category emoji as the map marker style
- Support labels like Watchlist, Strong Buy, Overvalued, Breakout Candidate, Blue Chip, Hidden Gem, Certified Classic, Risky Pick, Flop, Controversial, Needs Re-test
- Highlight notes and commentary, not only scores

Design direction:
- Mobile-first
- Warm and playful
- Soft cards and rounded corners
- Emoji-rich
- Serious structure for unserious rankings
- Pleasant enough to use every day

Technical requirements:
- Next.js
- TypeScript
- Tailwind
- shadcn/ui
- Store all data locally for MVP
- Architect code cleanly so a real database can be added later

Please output first:
1. information architecture
2. data model
3. page-by-page wireframes in text
4. component list
5. implementation plan
Then build the MVP.

## Next inputs to add
The following real data sets will be provided separately by the user and should be used to create sample data and test ranking logic:
- Roast rankings
- Golf rankings
- Croissant rankings

When those are added, the app should seed those categories and entries automatically for testing.

