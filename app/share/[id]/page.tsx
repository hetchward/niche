import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ShareSnapshotClient } from "@/components/share-snapshot-client";
import { fetchShareSnapshot, isShareId } from "@/lib/share-server";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  if (!isShareId(id)) return { title: "Share — Niche" };
  return { title: "Shared rankings — Niche" };
}

export default async function SharePage({ params }: Props) {
  const { id } = await params;
  if (!isShareId(id)) notFound();

  let state;
  try {
    state = await fetchShareSnapshot(id);
  } catch {
    throw new Error("Could not load share.");
  }
  if (!state) notFound();

  return <ShareSnapshotClient initialState={state} />;
}
