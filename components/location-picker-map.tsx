"use client";

import dynamic from "next/dynamic";

const Inner = dynamic(() => import("@/components/location-picker-map-inner"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[220px] w-full items-center justify-center rounded-2xl border border-dashed border-border/80 bg-muted/30 text-sm text-muted-foreground">
      Loading map…
    </div>
  ),
});

export function LocationPickerMap(props: {
  latitude: number;
  longitude: number;
  onPositionChange: (lat: number, lng: number) => void;
  interactive?: boolean;
}) {
  return <Inner {...props} />;
}
