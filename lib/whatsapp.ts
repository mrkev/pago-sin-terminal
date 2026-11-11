/**
 * Normalizes a Mexican phone number as typed or pasted to its 10 digits,
 * dropping separators and a +52 (or old-style +521) country prefix.
 */
export function normalizeMxPhone(raw: string): string {
  let digits = raw.replace(/\D/g, "");
  if (digits.length > 10 && digits.startsWith("521")) digits = digits.slice(3);
  else if (digits.length > 10 && digits.startsWith("52"))
    digits = digits.slice(2);
  return digits.slice(0, 10);
}

/** A link that opens a WhatsApp chat with `phone` and `text` pre-filled. */
export function whatsappLink(phone: string, text: string): string {
  return `https://wa.me/52${phone}?text=${encodeURIComponent(text)}`;
}

/** The message a payer sends along with their receipt. */
export function comprobanteMessage(titulo?: string): string {
  return `Hola${titulo ? `, ${titulo}` : ""}. Te envío mi comprobante de pago.`;
}
