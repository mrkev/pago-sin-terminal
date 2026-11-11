import * as z from "zod";

import { ESTILOS, DEFAULT_ESTILO, type Estilo } from "./estilos";
import { tipoCuenta } from "./cuenta";
import { paymentFormFields, requireBankForCards } from "./payment-page";
import { slugSchema } from "./slug";
import { socialSchema } from "./socials";
import type { Tables, TablesInsert } from "./supabase/database.types";

/**
 * Saved pages (accounts only): the free form's fields plus a short link and
 * social handles, stored in the `pages` table and served at `/<slug>`.
 */

/** Editor schema when signed in: everything validated, short link required. */
export const savedPageFormSchema = requireBankForCards(
  z.object({
    ...paymentFormFields,
    slug: slugSchema,
    instagram: socialSchema("instagram"),
    tiktok: socialSchema("tiktok"),
    facebook: socialSchema("facebook"),
  }),
);

/**
 * Editor schema when signed out: the account-only fields exist in the form
 * (their sections are locked) but aren't validated or used.
 */
export const anonEditorSchema = requireBankForCards(
  z.object({
    ...paymentFormFields,
    slug: z.string(),
    instagram: z.string(),
    tiktok: z.string(),
    facebook: z.string(),
  }),
);

/** Everything the editor holds. Blank strings mean "not set". */
export type EditorForm = z.infer<typeof savedPageFormSchema>;

export const EMPTY_EDITOR_FORM: EditorForm = {
  titulo: "",
  cuenta: "",
  banco: "",
  nombre: "",
  whatsapp: "",
  estilo: DEFAULT_ESTILO,
  slug: "",
  instagram: "",
  tiktok: "",
  facebook: "",
};

const EDITOR_FIELDS = Object.keys(EMPTY_EDITOR_FORM) as (keyof EditorForm)[];

/** A comparable snapshot of editor values, for "unsaved changes". */
export function editorSnapshot(values: Partial<EditorForm>): string {
  return JSON.stringify(EDITOR_FIELDS.map((field) => values[field] ?? ""));
}

/** Database row for a validated form; blanks become nulls. */
export function formToPageRow(
  form: EditorForm,
  ownerId: string,
): TablesInsert<"pages"> {
  return {
    owner_id: ownerId,
    slug: form.slug,
    titulo: form.titulo,
    cuenta: form.cuenta,
    // Only cards need a bank; a CLABE encodes its own.
    banco: tipoCuenta(form.cuenta) === "tarjeta" ? form.banco : null,
    nombre: form.nombre,
    whatsapp: form.whatsapp || null,
    estilo: form.estilo,
    instagram: form.instagram || null,
    tiktok: form.tiktok || null,
    facebook: form.facebook || null,
  };
}

/** Editor values for a saved row; nulls become blanks. */
export function pageRowToForm(row: Tables<"pages">): EditorForm {
  return {
    titulo: row.titulo,
    cuenta: row.cuenta,
    banco: row.banco ?? "",
    nombre: row.nombre,
    whatsapp: row.whatsapp ?? "",
    estilo: asEstilo(row.estilo),
    slug: row.slug,
    instagram: row.instagram ?? "",
    tiktok: row.tiktok ?? "",
    facebook: row.facebook ?? "",
  };
}

export function asEstilo(value: string | null | undefined): Estilo {
  return ESTILOS.includes(value as Estilo) ? (value as Estilo) : DEFAULT_ESTILO;
}
