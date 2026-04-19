export type EntryLocationApply = {
  locationName?: string;
  latitude?: number;
  longitude?: number;
  /** When true, strip coordinates from the entry. */
  clearCoords?: boolean;
};
