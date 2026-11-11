import * as z from "zod";

export const SOCIALS = ["instagram", "tiktok", "facebook"] as const;

export type Social = (typeof SOCIALS)[number];

/** Same rules as the database check constraints. */
const PATTERNS: Record<Social, RegExp> = {
  instagram: /^[A-Za-z0-9._]{1,30}$/,
  tiktok: /^[A-Za-z0-9._]{2,24}$/,
  facebook: /^[A-Za-z0-9.]{5,50}$/,
};

export const SOCIAL_INFO: Record<
  Social,
  { label: string; url: (handle: string) => string }
> = {
  instagram: {
    label: "Instagram",
    url: (h) => `https://www.instagram.com/${h}`,
  },
  tiktok: { label: "TikTok", url: (h) => `https://www.tiktok.com/@${h}` },
  facebook: { label: "Facebook", url: (h) => `https://www.facebook.com/${h}` },
};

/** Optional handle: blank, or valid for that network. */
export function socialSchema(social: Social) {
  return z.string().refine((v) => v === "" || PATTERNS[social].test(v), {
    message: `Revisa tu usuario de ${SOCIAL_INFO[social].label}`,
  });
}

/**
 * Normalizes what people paste or type to a bare handle: drops a leading @,
 * and pulls the handle out of a profile URL.
 */
export function normalizeHandle(input: string): string {
  let value = input.trim();
  const fromUrl = value.match(
    /(?:instagram\.com|tiktok\.com|facebook\.com|fb\.com)\/@?([^/?#\s]+)/i,
  );
  if (fromUrl) value = fromUrl[1];
  return value.replace(/^@+/, "").replace(/\s/g, "");
}
