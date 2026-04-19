import "server-only";

import { migrateAppState } from "@/lib/migrate";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import type { AppState } from "@/types/niche";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isShareId(id: string): boolean {
  return UUID_RE.test(id.trim());
}

export async function insertShareSnapshot(
  payload: AppState,
): Promise<{ id: string }> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("niche_share")
    .insert({ payload })
    .select("id")
    .single();
  if (error) throw error;
  if (!data?.id) throw new Error("Share insert returned no id");
  return { id: data.id as string };
}

export async function fetchShareSnapshot(id: string): Promise<AppState | null> {
  if (!isShareId(id)) return null;
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("niche_share")
    .select("payload")
    .eq("id", id.trim())
    .maybeSingle();
  if (error) throw error;
  const raw = data?.payload;
  if (!raw || typeof raw !== "object") return null;
  const base = raw as AppState;
  if (typeof base.version !== "number") return null;
  if (!Array.isArray(base.categories) || !Array.isArray(base.entries)) {
    return null;
  }
  return migrateAppState(base);
}
