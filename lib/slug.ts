import * as z from "zod";

/** Paths the app uses or may need; not available as short links. */
export const RESERVED_SLUGS = new Set([
  "admin",
  "api",
  "app",
  "auth",
  "ayuda",
  "clabe",
  "cuenta",
  "entrar",
  "favicon",
  "login",
  "privacidad",
  "public",
  "robots",
  "salir",
  "sitemap",
  "static",
  "terminos",
  "www",
]);

/** Same rule as the database check constraint on pages.slug. */
const SLUG_PATTERN = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/;

export const slugSchema = z
  .string()
  .min(3, { message: "Mínimo 3 caracteres" })
  .max(30, { message: "Máximo 30 caracteres" })
  .regex(/^[a-z]/, { message: "Tiene que empezar con una letra" })
  .regex(SLUG_PATTERN, {
    message: "Solo letras minúsculas, números y guiones (sin guiones dobles)",
  })
  .refine((slug) => !RESERVED_SLUGS.has(slug), {
    message: "Ese enlace no está disponible",
  });

/**
 * Turns free text into slug characters while typing: lowercase, accents
 * removed, spaces to hyphens, everything else dropped. Keeps a trailing
 * hyphen so the user can keep typing the next word.
 */
export function toSlugInput(text: string): string {
  return text
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[\s_]+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-{2,}/g, "-")
    .replace(/^[-0-9]+/, "")
    .slice(0, 30);
}

/** A finished slug suggestion from a title, e.g. "Café Ejemplar" → "cafe-ejemplar". */
export function suggestSlug(titulo: string): string {
  return toSlugInput(titulo).replace(/-+$/, "");
}
