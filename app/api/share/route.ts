import { NextResponse } from "next/server";
import { z } from "zod";
import { migrateAppState } from "@/lib/migrate";
import { insertShareSnapshot } from "@/lib/share-server";
import { isSupabaseConfigured } from "@/lib/supabase/admin";
import type { AppState } from "@/types/niche";

const bodySchema = z.object({
  version: z.number(),
  categories: z.array(z.unknown()),
  entries: z.array(z.unknown()),
});

const MAX_BYTES = 900_000;

function parseAppState(raw: unknown): AppState | null {
  const r = bodySchema.safeParse(raw);
  if (!r.success) return null;
  return migrateAppState({
    version: r.data.version,
    categories: r.data.categories as AppState["categories"],
    entries: r.data.entries as AppState["entries"],
  });
}

export async function POST(req: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Sharing is not configured (missing Supabase env vars)." },
      { status: 503 },
    );
  }

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const size = new TextEncoder().encode(JSON.stringify(raw)).length;
  if (size > MAX_BYTES) {
    return NextResponse.json(
      { error: "Snapshot is too large to share (try fewer photos or entries)." },
      { status: 413 },
    );
  }

  const state = parseAppState(raw);
  if (!state) {
    return NextResponse.json({ error: "Invalid app state payload." }, { status: 400 });
  }

  try {
    const { id } = await insertShareSnapshot(state);
    return NextResponse.json({ id });
  } catch (e) {
    console.error("share insert", e);
    return NextResponse.json(
      { error: "Could not save share. Try again in a moment." },
      { status: 500 },
    );
  }
}
