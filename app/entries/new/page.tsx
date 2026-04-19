import { Suspense } from "react";
import { EntryNewClient } from "@/components/entry-new-client";

export default function NewEntryPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-lg px-4 py-10 text-sm text-muted-foreground">
          Loading…
        </div>
      }
    >
      <EntryNewClient />
    </Suspense>
  );
}
