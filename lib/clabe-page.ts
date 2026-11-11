import * as z from "zod";

import { isValidClabe } from "./clabe";

/**
 * A CLABE page lives at `/c/<clabe>?t=<título>&n=<nombre>`. Both params are
 * optional; a bare `/c/<clabe>` shows just the CLABE and its bank. This URL
 * is what gets encoded in printed QR codes, so treat its shape as a public
 * format.
 */

export const tituloSchema = z
  .string()
  .trim()
  .min(1, { message: "El encabezado es requerido" })
  .max(60, { message: "Máximo 60 caracteres" });

export const clabeSchema = z
  .string()
  .regex(/^\d{18}$/, { message: "La CLABE debe tener 18 dígitos" })
  .refine(isValidClabe, {
    message: "Esta CLABE no es válida, revisa los dígitos",
  });

export const nombreSchema = z
  .string()
  .trim()
  .min(1, { message: "El nombre del beneficiario es requerido" })
  .max(80, { message: "Máximo 80 caracteres" })
  .regex(/^[\p{L}\p{M}\p{N} .,&-]+$/u, {
    message: "Solo letras, números, espacios y . , & -",
  });

/** What the form collects: everything is required. */
export const clabePageSchema = z.object({
  titulo: tituloSchema,
  clabe: clabeSchema,
  nombre: nombreSchema,
});

export type ClabePage = z.infer<typeof clabePageSchema>;

/** Missing or blank is fine, but if present the value must be valid. */
const optional = <T extends z.ZodType>(schema: T) =>
  z.preprocess(
    (value) =>
      typeof value === "string" && value.trim() === "" ? undefined : value,
    schema.optional(),
  );

/** What a CLABE page link carries: only the CLABE is required. */
export const clabeLinkSchema = z.object({
  clabe: clabeSchema,
  titulo: optional(tituloSchema),
  nombre: optional(nombreSchema),
});

export type ClabeLink = z.infer<typeof clabeLinkSchema>;

/** Path (with query) of the page for a CLABE, e.g. `/c/0121...?t=...&n=...`. */
export function clabePagePath({ clabe, titulo, nombre }: ClabeLink): string {
  const params = new URLSearchParams();
  if (titulo) params.set("t", titulo);
  if (nombre) params.set("n", nombre);
  const query = params.toString();
  return `/c/${clabe}${query ? `?${query}` : ""}`;
}

type SearchParams = Record<string, string | string[] | undefined>;

const first = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

/** Reads and validates a CLABE page from its route param and query. */
export function parseClabePage(clabe: string, searchParams: SearchParams) {
  return clabeLinkSchema.safeParse({
    clabe,
    titulo: first(searchParams.t),
    nombre: first(searchParams.n),
  });
}
