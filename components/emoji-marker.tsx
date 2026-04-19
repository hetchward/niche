import { cn } from "@/lib/utils";

/** Circular emoji badge used inside Leaflet divIcon HTML elsewhere. */
export function EmojiMarker({
  emoji,
  variant,
  className,
}: {
  emoji: string;
  variant: "reviewed" | "watchlist";
  className?: string;
}) {
  const ring =
    variant === "reviewed"
      ? "shadow-[0_0_0_3px_rgba(22,101,52,0.35)]"
      : "shadow-[0_0_0_3px_rgba(2,132,199,0.35)]";
  return (
    <span
      className={cn(
        "inline-flex size-10 items-center justify-center rounded-full border border-black/10 bg-[#fff7ed] text-[22px] leading-none",
        ring,
        className,
      )}
      aria-hidden
    >
      {emoji}
    </span>
  );
}
