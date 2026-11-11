import { SUPABASE_URL } from "./supabase/env";

/**
 * Logos and background photos for saved pages, in the public "branding"
 * Storage bucket under "<user id>/<kind>-<timestamp>.<ext>".
 */
export const BRANDING_BUCKET = "branding";

export type BrandingKind = "logo" | "fondo";

/** Longest side, in pixels, images are resized to before uploading. */
export const BRANDING_MAX_SIZE: Record<BrandingKind, number> = {
  logo: 512,
  fondo: 1600,
};

/** Public URL for a stored image. */
export function brandingUrl(path: string): string {
  return `${SUPABASE_URL}/storage/v1/object/public/${BRANDING_BUCKET}/${path}`;
}

/** A new, unique path in the user's folder. */
export function newBrandingPath(
  userId: string,
  kind: BrandingKind,
  extension: string,
): string {
  return `${userId}/${kind}-${Date.now()}.${extension}`;
}

/**
 * True if `path` is a branding image of this kind in this user's folder.
 * Mirrors the database check constraints on pages.logo_path/fondo_path.
 */
export function isOwnedBrandingPath(
  path: string,
  userId: string,
  kind: BrandingKind,
): boolean {
  const [folder, file, ...rest] = path.split("/");
  return (
    rest.length === 0 &&
    folder === userId &&
    new RegExp(`^${kind}-[0-9]+\\.(webp|png|jpg)$`).test(file ?? "")
  );
}
