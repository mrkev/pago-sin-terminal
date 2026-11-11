import { BANKS } from "./banks";
import { clabeBankName } from "./clabe";

/**
 * A "cuenta" is where the payment goes: an 18-digit CLABE or a 16-digit
 * debit card number. SPEI transfers accept either.
 */
export type TipoCuenta = "clabe" | "tarjeta";

export const TIPO_CUENTA_LABEL: Record<TipoCuenta, string> = {
  clabe: "CLABE",
  tarjeta: "Tarjeta de débito",
};

export function tipoCuenta(cuenta: string): TipoCuenta | undefined {
  if (/^\d{18}$/.test(cuenta)) return "clabe";
  if (/^\d{16}$/.test(cuenta)) return "tarjeta";
  return undefined;
}

export function isBankCode(code: string): boolean {
  return Object.hasOwn(BANKS, code);
}

/**
 * The bank for a cuenta. A CLABE encodes its bank; a card number doesn't
 * reliably, so cards use the bank the owner picked.
 */
export function cuentaBankName(
  cuenta: string,
  banco?: string,
): string | undefined {
  if (tipoCuenta(cuenta) === "clabe") return clabeBankName(cuenta);
  return banco && isBankCode(banco) ? BANKS[banco] : undefined;
}

/** Groups digits in fours for reading, e.g. "0121 8000 0000 0000 02". */
export function formatCuenta(cuenta: string): string {
  return cuenta.replace(/(\d{4})(?=\d)/g, "$1 ");
}

/** Banks most people will look for first in the picker. */
export const COMMON_BANK_CODES = [
  "012", // BBVA México
  "014", // Santander
  "072", // Banorte
  "002", // Banamex
  "021", // HSBC
  "044", // Scotiabank
  "127", // Banco Azteca
  "137", // BanCoppel
  "036", // Inbursa
  "638", // Nu
  "722", // Mercado Pago
  "167", // Hey Banco
  "728", // Spin by OXXO
];
