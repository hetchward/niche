"use client";

import { useRef } from "react";
import { XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const MAX_PHOTOS = 12;
const MAX_BYTES = 4 * 1024 * 1024;

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error ?? new Error("read failed"));
    reader.readAsDataURL(file);
  });
}

export function EntryPhotoPicker({
  photoUrls,
  onChange,
  id = "entry-photos",
  label = "Photos",
  hint = "One or many — kept on this device. Very large libraries can hit browser storage limits.",
  showLabel = true,
}: {
  photoUrls: string[];
  onChange: (next: string[]) => void;
  id?: string;
  label?: string;
  hint?: string;
  /** When false, omit the field label (e.g. when a parent card already has a title). */
  showLabel?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  const onFiles = async (list: FileList | null) => {
    if (!list?.length) return;
    const room = MAX_PHOTOS - photoUrls.length;
    if (room <= 0) return;
    const files = Array.from(list).slice(0, room);
    const next = [...photoUrls];
    for (const file of files) {
      if (!file.type.startsWith("image/")) continue;
      if (file.size > MAX_BYTES) {
        window.alert(`${file.name} is too large (max 4MB per photo).`);
        continue;
      }
      try {
        next.push(await readFileAsDataUrl(file));
      } catch {
        window.alert(`Could not read ${file.name}.`);
      }
    }
    onChange(next);
  };

  return (
    <div className="space-y-2">
      {showLabel && label ? (
        <Label htmlFor={id}>{label}</Label>
      ) : null}
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      <input
        ref={inputRef}
        id={id}
        type="file"
        accept="image/*"
        multiple
        className="sr-only"
        aria-label={showLabel ? undefined : label || "Photos"}
        onChange={(e) => {
          void onFiles(e.target.files);
          e.target.value = "";
        }}
      />
      <Button
        type="button"
        variant="outline"
        className="rounded-2xl"
        onClick={() => inputRef.current?.click()}
        disabled={photoUrls.length >= MAX_PHOTOS}
      >
        {photoUrls.length ? "Add more photos" : "Add photos"}
      </Button>
      {photoUrls.length > 0 ? (
        <ul className="flex flex-wrap gap-2">
          {photoUrls.map((url, i) => (
            <li key={`${i}-${url.slice(-24)}`} className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element -- local data URLs */}
              <img
                src={url}
                alt=""
                className="h-20 w-20 rounded-xl object-cover ring-1 ring-border/70"
              />
              <button
                type="button"
                className="absolute -right-1 -top-1 flex size-7 items-center justify-center rounded-full border border-border bg-background text-foreground shadow-sm"
                onClick={() => onChange(photoUrls.filter((_, idx) => idx !== i))}
                aria-label={`Remove photo ${i + 1}`}
              >
                <XIcon className="size-3.5" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

export function entryCoverUrl(entry: { photoUrls?: string[] }): string | undefined {
  const u = entry.photoUrls?.[0];
  return u?.trim() || undefined;
}

export function EntryRowThumb({
  entry,
  className,
}: {
  entry: { photoUrls?: string[] };
  className?: string;
}) {
  const url = entryCoverUrl(entry);
  if (url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- local data URLs
      <img
        src={url}
        alt=""
        className={cn(
          "size-12 shrink-0 rounded-xl object-cover ring-1 ring-border/70",
          className,
        )}
      />
    );
  }
  return (
    <div
      className={cn(
        "flex size-12 shrink-0 items-center justify-center rounded-xl bg-muted/50 text-xs text-muted-foreground ring-1 ring-border/40",
        className,
      )}
      aria-hidden
    >
      —
    </div>
  );
}
