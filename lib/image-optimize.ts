const DEFAULT_MAX_DIMENSION = 2048;
const MIN_DIMENSION = 320;
const SCALE_STEP = 0.85;
const QUALITY_STEPS = [0.86, 0.78, 0.7, 0.62, 0.54, 0.5];

type OutputMimeType = "image/webp" | "image/jpeg";

export type OptimizeImageOptions = {
  maxBytes: number;
  maxDimension?: number;
};

export type OptimizeImageResult = {
  dataUrl: string;
  bytes: number;
  mimeType: string;
  optimized: boolean;
};

let preferredOutputMime: OutputMimeType | null = null;

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error ?? new Error("read failed"));
    reader.readAsDataURL(file);
  });
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error ?? new Error("read failed"));
    reader.readAsDataURL(blob);
  });
}

function getPreferredOutputMime(): OutputMimeType {
  if (preferredOutputMime) return preferredOutputMime;
  const probe = document.createElement("canvas");
  probe.width = 1;
  probe.height = 1;
  const maybeWebp = probe.toDataURL("image/webp");
  preferredOutputMime = maybeWebp.startsWith("data:image/webp")
    ? "image/webp"
    : "image/jpeg";
  return preferredOutputMime;
}

function scaleToMaxDimension(width: number, height: number, maxDimension: number) {
  const longest = Math.max(width, height);
  if (longest <= maxDimension) return { width, height };
  const scale = maxDimension / longest;
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error(`Could not decode ${file.name}`));
    };
    image.src = url;
  });
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  mimeType: OutputMimeType,
  quality: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
          return;
        }
        reject(new Error("Could not encode image"));
      },
      mimeType,
      quality,
    );
  });
}

async function renderCompressedBlob(
  source: CanvasImageSource,
  width: number,
  height: number,
  mimeType: OutputMimeType,
  quality: number,
): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unavailable");

  // Fill white before drawing to keep transparent pixels predictable with JPEG.
  if (mimeType === "image/jpeg") {
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, width, height);
  }
  ctx.drawImage(source, 0, 0, width, height);
  return canvasToBlob(canvas, mimeType, quality);
}

function shouldSkipOptimization(file: File): boolean {
  return file.type === "image/gif" || file.type === "image/svg+xml";
}

export async function optimizeImageFileToDataUrl(
  file: File,
  options: OptimizeImageOptions,
): Promise<OptimizeImageResult> {
  if (shouldSkipOptimization(file)) {
    const dataUrl = await readFileAsDataUrl(file);
    return {
      dataUrl,
      bytes: file.size,
      mimeType: file.type || "application/octet-stream",
      optimized: false,
    };
  }

  const maxDimension = options.maxDimension ?? DEFAULT_MAX_DIMENSION;
  const source = await loadImage(file);
  const initialSize = scaleToMaxDimension(source.naturalWidth, source.naturalHeight, maxDimension);
  const outputMime = getPreferredOutputMime();

  if (
    file.size <= options.maxBytes &&
    source.naturalWidth === initialSize.width &&
    source.naturalHeight === initialSize.height &&
    (file.type === outputMime || file.type === "image/jpeg")
  ) {
    const dataUrl = await readFileAsDataUrl(file);
    return {
      dataUrl,
      bytes: file.size,
      mimeType: file.type,
      optimized: false,
    };
  }

  let width = initialSize.width;
  let height = initialSize.height;
  let bestBlob: Blob | null = null;

  while (true) {
    for (const quality of QUALITY_STEPS) {
      const blob = await renderCompressedBlob(source, width, height, outputMime, quality);
      if (!bestBlob || blob.size < bestBlob.size) {
        bestBlob = blob;
      }
      if (blob.size <= options.maxBytes) {
        const dataUrl = await blobToDataUrl(blob);
        return {
          dataUrl,
          bytes: blob.size,
          mimeType: blob.type,
          optimized: true,
        };
      }
    }

    if (Math.max(width, height) <= MIN_DIMENSION) break;
    width = Math.max(MIN_DIMENSION, Math.round(width * SCALE_STEP));
    height = Math.max(MIN_DIMENSION, Math.round(height * SCALE_STEP));
  }

  const fallback = bestBlob;
  if (!fallback) {
    throw new Error(`Could not optimize ${file.name}`);
  }
  const dataUrl = await blobToDataUrl(fallback);
  return {
    dataUrl,
    bytes: fallback.size,
    mimeType: fallback.type || outputMime,
    optimized: true,
  };
}
