import { NextRequest, NextResponse } from "next/server";
import type { GeocodeHit } from "@/types/geocode";

const NOMINATIM_UA = "niche-ranking-app/1.0 (contact: local dev; geocode via OSM Nominatim policy)";

function parseGoogleResults(data: unknown): GeocodeHit[] {
  if (!data || typeof data !== "object" || !("results" in data)) return [];
  const results = (data as { results?: unknown[] }).results;
  if (!Array.isArray(results)) return [];
  const out: GeocodeHit[] = [];
  for (const r of results) {
    if (!r || typeof r !== "object") continue;
    const geo = (r as { geometry?: { location?: { lat?: number; lng?: number } } }).geometry
      ?.location;
    const lat = geo?.lat;
    const lng = geo?.lng;
    if (typeof lat !== "number" || typeof lng !== "number") continue;
    const addr =
      typeof (r as { formatted_address?: string }).formatted_address === "string"
        ? (r as { formatted_address: string }).formatted_address
        : `${lat}, ${lng}`;
    out.push({ lat, lon: lng, displayName: addr, source: "google" });
  }
  return out.slice(0, 8);
}

function parseNominatimResults(data: unknown): GeocodeHit[] {
  if (!Array.isArray(data)) return [];
  const out: GeocodeHit[] = [];
  for (const row of data) {
    if (!row || typeof row !== "object") continue;
    const lat = Number((row as { lat?: string }).lat);
    const lon = Number((row as { lon?: string }).lon);
    const displayName =
      typeof (row as { display_name?: string }).display_name === "string"
        ? (row as { display_name: string }).display_name
        : "";
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;
    out.push({ lat, lon, displayName, source: "nominatim" });
  }
  return out.slice(0, 8);
}

async function geocodeGoogle(q: string, key: string): Promise<GeocodeHit[]> {
  const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
  url.searchParams.set("address", q);
  url.searchParams.set("key", key);
  const res = await fetch(url.toString(), { next: { revalidate: 0 } });
  if (!res.ok) return [];
  const data: unknown = await res.json();
  const status = (data as { status?: string })?.status;
  if (status && status !== "OK" && status !== "ZERO_RESULTS") return [];
  return parseGoogleResults(data);
}

async function geocodeNominatim(q: string): Promise<GeocodeHit[]> {
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", "8");
  url.searchParams.set("q", q);
  const res = await fetch(url.toString(), {
    headers: { "User-Agent": NOMINATIM_UA },
    next: { revalidate: 0 },
  });
  if (!res.ok) return [];
  const data: unknown = await res.json();
  return parseNominatimResults(data);
}

/** Address / place search: Google (if `GOOGLE_MAPS_GEOCODING_API_KEY`) then OpenStreetMap Nominatim. */
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) {
    return NextResponse.json({ error: "Enter at least 2 characters." }, { status: 400 });
  }

  const googleKey = process.env.GOOGLE_MAPS_GEOCODING_API_KEY?.trim();
  let results: GeocodeHit[] = [];
  if (googleKey) {
    try {
      results = await geocodeGoogle(q, googleKey);
    } catch {
      results = [];
    }
  }
  if (results.length === 0) {
    try {
      results = await geocodeNominatim(q);
    } catch {
      return NextResponse.json({ error: "Geocoding failed. Try again in a moment." }, { status: 502 });
    }
  }

  return NextResponse.json({ results });
}
