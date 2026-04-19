import { Suspense } from "react";
import { WatchlistNewClient } from "@/components/watchlist-new-client";

export default function NewWatchlistPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-lg px-4 py-10 text-sm text-muted-foreground">
          Loading…
        </div>
      }
    >
      <WatchlistNewClient />
    </Suspense>
  );
}
