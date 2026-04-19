import { EntryDetailClient } from "@/components/entry-detail-client";

export default async function EntryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <EntryDetailClient entryId={id} />;
}
