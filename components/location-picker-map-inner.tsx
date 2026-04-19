"use client";

import { useEffect, useMemo } from "react";
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

/** Leaflet’s default marker image breaks under Next bundling; use a div icon instead. */
function usePickerPinIcon() {
  return useMemo(
    () =>
      L.divIcon({
        html: `<div style="width:40px;height:40px;border-radius:999px;background:#fff;border:2px solid rgba(21,128,61,0.85);box-shadow:0 2px 10px rgba(0,0,0,0.18);display:flex;align-items:center;justify-content:center;font-size:22px;line-height:1" aria-hidden="true">📍</div>`,
        className: "niche-picker-pin",
        iconSize: [40, 40],
        iconAnchor: [20, 40],
      }),
    [],
  );
}

function Recenter({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], map.getZoom() > 4 ? map.getZoom() : 14, { animate: true });
  }, [lat, lng, map]);
  return null;
}

function MapClickPlace({
  onPlace,
}: {
  onPlace: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(e) {
      onPlace(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function LocationPickerMapInner({
  latitude,
  longitude,
  onPositionChange,
  interactive = true,
}: {
  latitude: number;
  longitude: number;
  onPositionChange: (lat: number, lng: number) => void;
  /** When false, show pin and pan/zoom only — no drag or map tap to move. */
  interactive?: boolean;
}) {
  const pinIcon = usePickerPinIcon();

  return (
    <MapContainer
      center={[latitude, longitude]}
      zoom={14}
      className="h-[220px] w-full rounded-2xl border border-border/70"
      scrollWheelZoom
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Recenter lat={latitude} lng={longitude} />
      {interactive ? <MapClickPlace onPlace={onPositionChange} /> : null}
      <Marker
        position={[latitude, longitude]}
        icon={pinIcon}
        draggable={interactive}
        eventHandlers={
          interactive
            ? {
                dragend: (e) => {
                  const p = (e.target as L.Marker).getLatLng();
                  onPositionChange(p.lat, p.lng);
                },
              }
            : undefined
        }
      />
    </MapContainer>
  );
}
