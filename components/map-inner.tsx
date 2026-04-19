"use client";

import { useEffect, useMemo } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Category, Entry, EntryLabel } from "@/types/niche";

/** Optional corner badge on reviewed pins (equity-style “ranking” label). */
const LABEL_MARKER_EMOJI: Partial<Record<EntryLabel, string>> = {
  "Strong Buy": "📈",
  Overvalued: "⚠️",
  "Breakout Candidate": "🚀",
  "Blue Chip": "💎",
  "Hidden Gem": "✨",
  "Certified Classic": "🏆",
  "Risky Pick": "🎲",
  Flop: "💀",
  Controversial: "⚡",
  "Needs Re-test": "🔁",
};
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  computeCriteriaScore100,
  computeRawSumWithBonus,
  getDefaultPresetId,
  resolvePreset,
} from "@/lib/scoring";

function FitBounds({ points }: { points: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (!points.length) return;
    const b = L.latLngBounds(points);
    map.fitBounds(b, { padding: [36, 36], maxZoom: 12 });
  }, [map, points]);
  return null;
}

function emojiMarkerIcon(
  categoryEmoji: string,
  variant: "reviewed" | "watchlist",
  labelEmoji: string | null,
) {
  const ring =
    variant === "reviewed"
      ? "0 0 0 3px rgba(22,101,52,0.35)"
      : "0 0 0 3px rgba(2,132,199,0.35)";
  const badge = labelEmoji
    ? `<span style="position:absolute;bottom:-2px;right:-4px;font-size:15px;line-height:1;text-shadow:0 0 2px #fff,0 0 2px #fff">${labelEmoji}</span>`
    : "";
  const html = `<div style="position:relative;width:48px;height:48px"><div style="width:48px;height:48px;border-radius:999px;background:#fff7ed;border:1px solid rgba(0,0,0,0.1);box-shadow:${ring};display:flex;align-items:center;justify-content:center;font-size:30px;line-height:1">${categoryEmoji}</div>${badge}</div>`;
  return L.divIcon({
    html,
    className: "niche-leaflet-divicon",
    iconSize: [48, 48],
    iconAnchor: [24, 48],
    popupAnchor: [0, -40],
  });
}

export default function MapInner({
  entries,
  categories,
  categoryId,
  reviewedOnly,
  watchlistOnly,
  topRatedOnly,
  labelFilter,
}: {
  entries: Entry[];
  categories: Category[];
  categoryId?: string | null;
  reviewedOnly?: boolean;
  watchlistOnly?: boolean;
  topRatedOnly?: boolean;
  labelFilter?: string | null;
}) {
  const catById = useMemo(
    () => new Map(categories.map((c) => [c.id, c] as const)),
    [categories],
  );

  const visible = useMemo(() => {
    let list = entries.filter((e) => e.latitude != null && e.longitude != null);
    if (categoryId) list = list.filter((e) => e.categoryId === categoryId);
    if (reviewedOnly) list = list.filter((e) => e.status === "reviewed");
    if (watchlistOnly) list = list.filter((e) => e.status === "watchlist");
    if (labelFilter)
      list = list.filter((e) => e.label === labelFilter);
    if (topRatedOnly) {
      const byCat = new Map<string, Entry[]>();
      for (const e of list.filter((x) => x.status === "reviewed")) {
        const arr = byCat.get(e.categoryId) ?? [];
        arr.push(e);
        byCat.set(e.categoryId, arr);
      }
      const keep = new Set<string>();
      for (const [cid, arr] of byCat) {
        const cat = catById.get(cid);
        if (!cat) continue;
        const preset = resolvePreset(cat, getDefaultPresetId(cat));
        const sorted = [...arr].sort((a, b) => {
          if (!preset) return 0;
          const wa = computeCriteriaScore100(a, cat, preset);
          const wb = computeCriteriaScore100(b, cat, preset);
          return wb - wa;
        });
        sorted.slice(0, 3).forEach((e) => keep.add(e.id));
      }
      list = list.filter((e) => keep.has(e.id));
    }
    return list;
  }, [
    entries,
    categoryId,
    reviewedOnly,
    watchlistOnly,
    topRatedOnly,
    labelFilter,
    catById,
  ]);

  const points: [number, number][] = visible.map((e) => [
    e.latitude as number,
    e.longitude as number,
  ]);

  const center: [number, number] = points[0] ?? [-25.2744, 133.7751];
  const pinnedTotal = entries.filter((e) => e.latitude != null && e.longitude != null).length;

  return (
    <div className="space-y-2">
      <div className="relative h-[min(70vh,560px)] w-full overflow-hidden rounded-3xl border border-border/70">
        <MapContainer
          center={center}
          zoom={4}
          className="h-full w-full"
          scrollWheelZoom
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {points.length ? <FitBounds points={points} /> : null}
          {visible.map((e) => {
        const cat = catById.get(e.categoryId);
        const categoryEmoji = cat?.emoji ?? "📍";
        const variant = e.status === "watchlist" ? "watchlist" : "reviewed";
        const labelEmoji =
          e.status === "reviewed" && e.label && e.label !== "Watchlist"
            ? (LABEL_MARKER_EMOJI[e.label] ?? "🏷️")
            : null;
        const icon = emojiMarkerIcon(categoryEmoji, variant, labelEmoji);
        return (
          <Marker
            key={e.id}
            title={e.title}
            position={[e.latitude as number, e.longitude as number]}
            icon={icon}
          >
            <Popup>
              <div className="min-w-[10rem] space-y-2 p-1">
                <div>
                  <p className="text-sm font-semibold">{e.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {categoryEmoji} {cat?.name}
                  </p>
                </div>
                {e.status === "reviewed" && cat ? (
                  <div className="space-y-1 text-xs">
                    {(() => {
                      const preset = resolvePreset(cat, getDefaultPresetId(cat));
                      const h = preset
                        ? computeCriteriaScore100(e, cat, preset)
                        : null;
                      const rb = computeRawSumWithBonus(e, cat);
                      return (
                        <>
                          {h != null ? (
                            <p>
                              /100:{" "}
                              <span className="font-semibold">{h}</span>
                            </p>
                          ) : null}
                          <p className="text-muted-foreground">
                            Raw+bonus:{" "}
                            <span className="font-medium text-foreground">
                              {Math.round(rb * 100) / 100}
                            </span>
                          </p>
                        </>
                      );
                    })()}
                  </div>
                ) : e.status === "reviewed" ? (
                  <p className="text-xs text-muted-foreground">Score: —</p>
                ) : (
                  <p className="text-xs text-muted-foreground">On watchlist</p>
                )}
                <Link
                  href={`/entries/${e.id}`}
                  className={cn(
                    buttonVariants({ size: "sm" }),
                    "inline-flex w-full justify-center rounded-xl",
                  )}
                >
                  View
                </Link>
              </div>
            </Popup>
          </Marker>
        );
      })}
        </MapContainer>
      </div>
      {visible.length === 0 ? (
        <p className="px-1 text-center text-sm text-muted-foreground">
          {pinnedTotal === 0 && entries.length > 0
            ? "Nothing has map coordinates yet. Reload the page once: older saves used a different field name and are fixed automatically on load."
            : "No places match these filters. Try “All”, clear Reviewed / Watchlist only, or set Label to All labels."}
        </p>
      ) : null}
    </div>
  );
}
