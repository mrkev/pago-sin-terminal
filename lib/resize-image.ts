export type ResizedImage = { blob: Blob; extension: string };

/**
 * Shrinks an image in the browser so its longest side is at most `maxSize`
 * and re-encodes it, so uploads stay small (phone photos are often 5+ MB).
 *
 * Logos become PNG (keeps transparency) and photos JPEG. Not WebP: the
 * story image renderer (next/og) silently drops WebP images, and older
 * Safari can't encode it.
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
  if (!transparent) {
    // JPEG has no alpha; fill so transparent areas don't turn black.
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  const [type, extension] = transparent
    ? (["image/png", "png"] as const)
    : (["image/jpeg", "jpg"] as const);
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, type, 0.85),
  );
  if (!blob) throw new Error("Could not encode image");
  return { blob, extension };
}
