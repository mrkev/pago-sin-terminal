import { BANKS } from "./banks";

const WEIGHTS = [3, 7, 1];

/** Computes the control digit for the first 17 digits of a CLABE. */
export function clabeControlDigit(first17: string): number {
  let sum = 0;
  for (let i = 0; i < 17; i++) {
    sum += (Number(first17[i]) * WEIGHTS[i % 3]) % 10;
  }
  return (10 - (sum % 10)) % 10;
}

/** True if `clabe` is 18 digits and its control digit checks out. */
export function isValidClabe(clabe: string): boolean {
  return (
    /^\d{18}$/.test(clabe) &&
    clabeControlDigit(clabe.slice(0, 17)) === Number(clabe[17])
  );
}

/** The bank a CLABE belongs to, from its first three digits, if known. */
export function clabeBankName(clabe: string): string | undefined {
  return /^\d{3}/.test(clabe) ? BANKS[clabe.slice(0, 3)] : undefined;
}
