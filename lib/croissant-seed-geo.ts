/** Shared bases (Nominatim / documented addresses) + jitter for Croissant Index seed + v5 migration. */

export function croissantJitter(
  lat: number,
  lng: number,
  key: string,
): { latitude: number; longitude: number } {
  let h = 0;
  for (let i = 0; i < key.length; i++) {
    h = (Math.imul(31, h) + key.charCodeAt(i)) | 0;
  }
  const a = (Math.abs(h) % 1000) / 50_000;
  const b = (Math.abs(h >> 8) % 1000) / 50_000;
  return { latitude: lat + a - 0.01, longitude: lng + b - 0.01 };
}

type Row = {
  id: string;
  locationName: string;
  /** WGS84 from OSM Nominatim (street-level where available). */
  lat: number;
  lng: number;
  jitterKey: string;
};

const CROISSANT_GEO_ROWS: Row[] = [
  {
    id: "ent-cro-victoire",
    locationName: "Rozelle",
    lat: -33.8594262,
    lng: 151.1719554,
    jitterKey: "Victoire",
  },
  {
    id: "ent-cro-dawn",
    locationName: "Rozelle",
    lat: -33.8639823,
    lng: 151.1741937,
    jitterKey: "Dawn",
  },
  {
    id: "ent-cro-baker",
    locationName: "Rozelle",
    lat: -33.8615,
    lng: 151.1708,
    jitterKey: "baker",
  },
  {
    id: "ent-cro-fabbroca",
    locationName: "Rozelle",
    lat: -33.8642564,
    lng: 151.1694914,
    jitterKey: "Fabbroca",
  },
  {
    id: "ent-cro-pennyfour",
    locationName: "Balmain",
    lat: -33.8580622,
    lng: 151.1833166,
    jitterKey: "Pennyfour",
  },
  {
    id: "ent-cro-home",
    locationName: "Balmain",
    lat: -33.8572055,
    lng: 151.1803576,
    jitterKey: "Home",
  },
];

const byId = new Map(CROISSANT_GEO_ROWS.map((r) => [r.id, r]));

/** Location fields for a croissant seed entry, or undefined if not a pinned croissant id. */
export function croissantSeedLocationForEntryId(id: string):
  | { locationName: string; latitude: number; longitude: number }
  | undefined {
  const row = byId.get(id);
  if (!row) return undefined;
  const { latitude, longitude } = croissantJitter(row.lat, row.lng, row.jitterKey);
  return { locationName: row.locationName, latitude, longitude };
}
