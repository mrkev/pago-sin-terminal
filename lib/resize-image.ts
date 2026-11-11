/** Formats we can produce, by preference. */
const OUTPUTS = [
  { type: "image/webp", extension: "webp" },
  { type: "image/png", extension: "png" },
  { type: "image/jpeg", extension: "jpg" },
] as const;

export type ResizedImage = { blob: Blob; extension: string };

/**
 * Shrinks an image in the browser so its longest side is at most `maxSize`
 * and re-encodes it, so uploads stay small (phone photos are often 5+ MB).
 * Prefers WebP; browsers that can't encode it (older Safari) fall back to
 * PNG for logos (keeps transparency) or JPEG for photos.
 */
export async function resizeImage(
  file: File,
  maxSize: number,
  { transparent }: { transparent: boolean },
): Promise<ResizedImage> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context unavailable");
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  const candidates = transparent
    ? [OUTPUTS[0], OUTPUTS[1]]
    : [OUTPUTS[0], OUTPUTS[2]];
  for (const output of candidates) {
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, output.type, 0.85),
    );
    // toBlob silently falls back to PNG for types it can't encode.
    if (blob && blob.type === output.type) {
      return { blob, extension: output.extension };
    }
  }
  throw new Error("Could not encode image");
}
