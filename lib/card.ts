/** True if `card` is a 16-digit card number that passes the Luhn check. */
export function isValidCard(card: string): boolean {
  if (!/^\d{16}$/.test(card)) return false;
  let sum = 0;
  for (let i = 0; i < 16; i++) {
    let digit = Number(card[15 - i]);
    if (i % 2 === 1) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
  }
  return sum % 10 === 0;
}
