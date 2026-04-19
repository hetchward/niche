import type { EntryLocationApply } from "@/types/entry-location";
import type { Entry } from "@/types/niche";

/** Merge location fields from the editor into an entry (immutable). */
export function applyLocationPatch(entry: Entry, patch: EntryLocationApply): Entry {
  const t = new Date().toISOString();
  if (patch.clearCoords) {
    const next = { ...entry, updatedAt: t };
    delete (next as { latitude?: number }).latitude;
    delete (next as { longitude?: number }).longitude;
    return next;
  }
  const next: Entry = { ...entry, updatedAt: t };
  if ("locationName" in patch) next.locationName = patch.locationName;
  if (patch.latitude !== undefined) next.latitude = patch.latitude;
  if (patch.longitude !== undefined) next.longitude = patch.longitude;
  return next;
}
