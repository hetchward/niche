"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LocationPickerMap } from "@/components/location-picker-map";
import type { GeocodeHit } from "@/types/geocode";
import type { EntryLocationApply } from "@/types/entry-location";

export type { EntryLocationApply };

type Props = {
  locationName?: string;
  latitude?: number | null;
  longitude?: number | null;
  onApply: (patch: EntryLocationApply) => void;
};

function googleMapsSearchUrl(query: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

function googleMapsPinUrl(lat: number, lng: number) {
  return `https://www.google.com/maps?q=${lat},${lng}`;
}

function openStreetMapUrl(lat: number, lng: number) {
  return `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=16/${lat}/${lng}`;
}

const fieldFill =
  "border-0 bg-muted/45 shadow-none ring-0 outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-0";

export function EntryLocationEditor({
  locationName: locationNameProp,
  latitude: latProp,
  longitude: lngProp,
  onApply,
}: Props) {
  const [locationName, setLocationName] = useState(locationNameProp ?? "");
  const [latText, setLatText] = useState(
    latProp != null && Number.isFinite(latProp) ? String(latProp) : "",
  );
  const [lngText, setLngText] = useState(
    lngProp != null && Number.isFinite(lngProp) ? String(lngProp) : "",
  );
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<GeocodeHit[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    setLocationName(locationNameProp ?? "");
  }, [locationNameProp]);

  useEffect(() => {
    setLatText(latProp != null && Number.isFinite(latProp) ? String(latProp) : "");
    setLngText(lngProp != null && Number.isFinite(lngProp) ? String(lngProp) : "");
  }, [latProp, lngProp]);

  const applyCoords = useCallback(
    (lat: number, lng: number, nameHint?: string) => {
      setLatText(String(lat));
      setLngText(String(lng));
      const shortName = nameHint
        ? nameHint.split(",").map((s) => s.trim())[0]?.slice(0, 100)
        : undefined;
      if (shortName != null) {
        setLocationName(shortName);
        onApply({ latitude: lat, longitude: lng, locationName: shortName });
      } else {
        onApply({ latitude: lat, longitude: lng });
      }
    },
    [onApply],
  );

  const flushLocationName = useCallback(() => {
    const t = locationName.trim();
    onApply({ locationName: t || undefined });
  }, [locationName, onApply]);

  const flushCoordsFromInputs = useCallback(() => {
    const lat = Number.parseFloat(latText);
    const lng = Number.parseFloat(lngText);
    if (latText.trim() === "" && lngText.trim() === "") {
      setError(null);
      return;
    }
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      setError("Latitude and longitude must be valid numbers.");
      return;
    }
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      setError("Latitude must be −90…90 and longitude −180…180.");
      return;
    }
    setError(null);
    onApply({ latitude: lat, longitude: lng });
  }, [latText, lngText, onApply]);

  const onLookup = async () => {
    const q = query.trim() || `${locationName.trim()} ${latText} ${lngText}`.trim();
    if (q.length < 2) {
      setError("Type a place or address to search (at least 2 characters).");
      return;
    }
    setLoading(true);
    setError(null);
    setHits([]);
    try {
      const res = await fetch(`/api/geocode?q=${encodeURIComponent(q)}`);
      const data = (await res.json()) as { results?: GeocodeHit[]; error?: string };
      if (!res.ok) {
        setError(data.error ?? "Search failed.");
        return;
      }
      const list = data.results ?? [];
      setHits(list);
      if (list.length === 0) setError("No results — try a different spelling or add a suburb/country.");
    } catch {
      setError("Network error — try again.");
    } finally {
      setLoading(false);
    }
  };

  const latNum = Number.parseFloat(latText);
  const lngNum = Number.parseFloat(lngText);
  const hasValidPin =
    Number.isFinite(latNum) &&
    Number.isFinite(lngNum) &&
    latNum >= -90 &&
    latNum <= 90 &&
    lngNum >= -180 &&
    lngNum <= 180;

  const mapQuery = query.trim() || locationName.trim() || "coffee";

  return (
    <div className="flex flex-col gap-4">
      <div className="space-y-2">
        <Label htmlFor="loc-name">Place label</Label>
        <Input
          id="loc-name"
          value={locationName}
          onChange={(e) => setLocationName(e.target.value)}
          onBlur={flushLocationName}
          className={`h-11 rounded-2xl px-3 ${fieldFill}`}
          placeholder="Rozelle, Sydney"
        />
        <p className="text-xs text-muted-foreground">
          Shown on the entry and map popup — not used for search unless you leave the search box empty.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="loc-search">Look up address or venue</Label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            id="loc-search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className={`h-11 rounded-2xl px-3 sm:flex-1 ${fieldFill}`}
            placeholder="660 Darling St Rozelle, or club name…"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                void onLookup();
              }
            }}
          />
          <Button
            type="button"
            variant="secondary"
            className="rounded-2xl"
            disabled={loading}
            onClick={() => void onLookup()}
          >
            {loading ? "Searching…" : "Search"}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Uses OpenStreetMap search by default. Add{" "}
          <code className="rounded bg-muted px-1">GOOGLE_MAPS_GEOCODING_API_KEY</code> to{" "}
          <code className="rounded bg-muted px-1">.env.local</code> to try Google first.
        </p>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        {hits.length > 0 ? (
          <ul className="max-h-48 space-y-1 overflow-y-auto rounded-2xl bg-muted/25 p-2 text-sm">
            {hits.map((h, i) => (
              <li key={`${h.lat}-${h.lon}-${i}`}>
                <button
                  type="button"
                  className="w-full rounded-xl px-2 py-2 text-left hover:bg-muted/80"
                  onClick={() => {
                    applyCoords(h.lat, h.lon, h.displayName);
                    setHits([]);
                    setQuery("");
                  }}
                >
                  <span className="text-[10px] font-medium uppercase text-muted-foreground">
                    {h.source}
                  </span>
                  <span className="mt-0.5 line-clamp-2 block text-foreground">{h.displayName}</span>
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="loc-lat">Latitude</Label>
          <Input
            id="loc-lat"
            inputMode="decimal"
            className={`h-11 rounded-2xl px-3 font-mono text-sm ${fieldFill}`}
            value={latText}
            onChange={(e) => setLatText(e.target.value)}
            onBlur={flushCoordsFromInputs}
            placeholder="-33.86"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="loc-lng">Longitude</Label>
          <Input
            id="loc-lng"
            inputMode="decimal"
            className={`h-11 rounded-2xl px-3 font-mono text-sm ${fieldFill}`}
            value={lngText}
            onChange={(e) => setLngText(e.target.value)}
            onBlur={flushCoordsFromInputs}
            placeholder="151.17"
          />
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" size="sm" className="rounded-xl" onClick={flushCoordsFromInputs}>
          Apply lat / long
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="rounded-xl"
          disabled={!hasValidPin}
          onClick={() => {
            setLatText("");
            setLngText("");
            onApply({ clearCoords: true });
            setError(null);
          }}
        >
          Remove pin
        </Button>
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
        <a
          className="text-primary underline-offset-4 hover:underline"
          href={googleMapsSearchUrl(mapQuery)}
          target="_blank"
          rel="noreferrer"
        >
          Open search in Google Maps
        </a>
        {hasValidPin ? (
          <>
            <a
              className="text-primary underline-offset-4 hover:underline"
              href={googleMapsPinUrl(latNum, lngNum)}
              target="_blank"
              rel="noreferrer"
            >
              Google Maps at pin
            </a>
            <a
              className="text-primary underline-offset-4 hover:underline"
              href={openStreetMapUrl(latNum, lngNum)}
              target="_blank"
              rel="noreferrer"
            >
              OpenStreetMap at pin
            </a>
          </>
        ) : null}
      </div>

      {hasValidPin ? (
        <div className="space-y-2">
          <Label>Adjust on map</Label>
          <p className="text-xs text-muted-foreground">Drag the marker or tap the map to move the pin.</p>
          <LocationPickerMap
            latitude={latNum}
            longitude={lngNum}
            onPositionChange={(lat, lng) => applyCoords(lat, lng)}
          />
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          Enter valid coordinates or pick a search result to show the map and fine-tune the pin.
        </p>
      )}
    </div>
  );
}

/** Read-only summary for entry detail — map is view-only; use `EntryLocationEditor` to change pin. */
export function EntryLocationReadOnly({
  locationName,
  latitude,
  longitude,
}: {
  locationName?: string;
  latitude?: number | null;
  longitude?: number | null;
}) {
  const label = locationName?.trim() || null;
  const latNum = latitude != null && Number.isFinite(latitude) ? latitude : NaN;
  const lngNum = longitude != null && Number.isFinite(longitude) ? longitude : NaN;
  const hasValidPin =
    Number.isFinite(latNum) &&
    Number.isFinite(lngNum) &&
    latNum >= -90 &&
    latNum <= 90 &&
    lngNum >= -180 &&
    lngNum <= 180;
  const mapQuery = label || "place";

  return (
    <div className="flex flex-col gap-4">
      <div className="space-y-1">
        <Label className="text-muted-foreground">Place label</Label>
        <p className="text-sm">{label ?? "—"}</p>
      </div>

      <div className="space-y-1">
        <Label className="text-muted-foreground">Coordinates</Label>
        <p className="font-mono text-sm tabular-nums">
          {hasValidPin ? (
            <>
              {latNum.toFixed(5)}, {lngNum.toFixed(5)}
            </>
          ) : (
            <span className="text-muted-foreground">No pin set</span>
          )}
        </p>
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
        <a
          className="text-primary underline-offset-4 hover:underline"
          href={googleMapsSearchUrl(mapQuery)}
          target="_blank"
          rel="noreferrer"
        >
          Open search in Google Maps
        </a>
        {hasValidPin ? (
          <>
            <a
              className="text-primary underline-offset-4 hover:underline"
              href={googleMapsPinUrl(latNum, lngNum)}
              target="_blank"
              rel="noreferrer"
            >
              Google Maps at pin
            </a>
            <a
              className="text-primary underline-offset-4 hover:underline"
              href={openStreetMapUrl(latNum, lngNum)}
              target="_blank"
              rel="noreferrer"
            >
              OpenStreetMap at pin
            </a>
          </>
        ) : null}
      </div>

      {hasValidPin ? (
        <div className="space-y-2">
          <Label className="text-muted-foreground">Map pin</Label>
          <LocationPickerMap
            latitude={latNum}
            longitude={lngNum}
            interactive={false}
            onPositionChange={() => {}}
          />
        </div>
      ) : null}
    </div>
  );
}
