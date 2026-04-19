export type GeocodeHit = {
  lat: number;
  lon: number;
  displayName: string;
  source: "nominatim" | "google";
};
