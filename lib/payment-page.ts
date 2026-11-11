import * as z from "zod";

import { isValidCard } from "./card";
import { isValidClabe } from "./clabe";
import { isBankCode, tipoCuenta } from "./cuenta";
import { DEFAULT_ESTILO, ESTILOS } from "./estilos";

/**
 * A payment page lives at
 *
 *   /c/<cuenta>?t=<título>&n=<nombre>&b=<banco>&w=<whatsapp>&s=<estilo>
 *
 * where <cuenta> is an 18-digit CLABE or a 16-digit debit card, <banco> is
 * a 3-digit bank code (only used for cards; a CLABE encodes its bank),
 * <whatsapp> is a 10-digit Mexican number for receipts, and <estilo> is a
 * style preset. All params are optional. This URL is what
 * gets encoded in printed QR codes, so treat its shape as a public format.
 */

export const tituloSchema = z
  .string()
  .trim()
  .min(1, { message: "El encabezado es requerido" })
  .max(60, { message: "Máximo 60 caracteres" });

export const cuentaSchema = z
  .string()
  .regex(/^(\d{16}|\d{18})$/, {
    message: "Ingresa una CLABE (18 dígitos) o tarjeta de débito (16 dígitos)",
  })
  .superRefine((cuenta, ctx) => {
    const tipo = tipoCuenta(cuenta);
    if (tipo === "clabe" && !isValidClabe(cuenta)) {
      ctx.addIssue({
        code: "custom",
        message: "Esta CLABE no es válida, revisa los dígitos",
      });
    }
    if (tipo === "tarjeta" && !isValidCard(cuenta)) {
      ctx.addIssue({
        code: "custom",
        message: "Este número de tarjeta no es válido, revisa los dígitos",
      });
    }
  });

export const nombreSchema = z
  .string()
  .trim()
  .min(1, { message: "El nombre del beneficiario es requerido" })
  .max(80, { message: "Máximo 80 caracteres" })
  .regex(/^[\p{L}\p{M}\p{N} .,&-]+$/u, {
    message: "Solo letras, números, espacios y . , & -",
  });

export const bancoSchema = z
  .string()
  .refine(isBankCode, { message: "Banco desconocido" });

export const estiloSchema = z.enum(ESTILOS);

const WHATSAPP_MESSAGE = "Ingresa un número de 10 dígitos";

export const whatsappSchema = z
  .string()
  .regex(/^\d{10}$/, { message: WHATSAPP_MESSAGE });

/** The fields the free form collects. */
export const paymentFormFields = {
  titulo: tituloSchema,
  cuenta: cuentaSchema,
  banco: z.string(),
  nombre: nombreSchema,
  // Optional: blank means no WhatsApp button.
  whatsapp: z.string().refine((v) => v === "" || /^\d{10}$/.test(v), {
    message: WHATSAPP_MESSAGE,
  }),
  estilo: estiloSchema,
};

/** Adds the rule that cards (unlike CLABEs) need a bank picked. */
export function requireBankForCards<
  S extends z.ZodType<{ cuenta: string; banco: string }>,
>(schema: S) {
  return schema.refine(
    ({ cuenta, banco }) =>
      tipoCuenta(cuenta) !== "tarjeta" || isBankCode(banco),
    {
      path: ["banco"],
      message: "Elige el banco de tu tarjeta",
      // Check the bank even while other fields still have errors.
      when: ({ value }) =>
        typeof value === "object" &&
        value !== null &&
        "cuenta" in value &&
        "banco" in value,
    },
  );
}

/** What the free form collects. The bank is only required for cards. */
export const paymentFormSchema = requireBankForCards(
  z.object(paymentFormFields),
);

export type PaymentForm = z.infer<typeof paymentFormSchema>;

/** Missing or blank is fine, but if present the value must be valid. */
const optional = <T extends z.ZodType>(schema: T) =>
  z.preprocess(
    (value) =>
      typeof value === "string" && value.trim() === "" ? undefined : value,
    schema.optional(),
  );

/** What a payment page link carries: only the cuenta is required. */
export const paymentLinkSchema = z.object({
  cuenta: cuentaSchema,
  titulo: optional(tituloSchema),
  nombre: optional(nombreSchema),
  banco: optional(bancoSchema),
  whatsapp: optional(whatsappSchema),
  // An unknown style is cosmetic, so fall back instead of failing.
  estilo: estiloSchema.optional().catch(undefined),
});

export type PaymentLink = z.infer<typeof paymentLinkSchema>;

/** The link fields for what the form collected. */
export function formToLink(form: PaymentForm): PaymentLink {
  return {
    cuenta: form.cuenta,
    titulo: form.titulo,
    nombre: form.nombre,
    banco: tipoCuenta(form.cuenta) === "tarjeta" ? form.banco : undefined,
    whatsapp: form.whatsapp || undefined,
    estilo: form.estilo,
  };
}

/** Path (with query) of a payment page, e.g. `/c/0121...?t=...&n=...`. */
export function paymentPagePath({
  cuenta,
  titulo,
  nombre,
  banco,
  whatsapp,
  estilo,
}: PaymentLink): string {
  const params = new URLSearchParams();
  if (titulo) params.set("t", titulo);
  if (nombre) params.set("n", nombre);
  // A CLABE already says which bank it belongs to.
  if (banco && tipoCuenta(cuenta) === "tarjeta") params.set("b", banco);
  if (whatsapp) params.set("w", whatsapp);
  if (estilo && estilo !== DEFAULT_ESTILO) params.set("s", estilo);
  const query = params.toString();
  return `/c/${cuenta}${query ? `?${query}` : ""}`;
}

type SearchParams = Record<string, string | string[] | undefined>;

const first = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

/** Reads and validates a payment page from its route param and query. */
export function parsePaymentPage(cuenta: string, searchParams: SearchParams) {
  return paymentLinkSchema.safeParse({
    cuenta,
    titulo: first(searchParams.t),
    nombre: first(searchParams.n),
    banco: first(searchParams.b),
    whatsapp: first(searchParams.w),
    estilo: first(searchParams.s),
  });
}
