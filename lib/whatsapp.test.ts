import { describe, expect, it } from "vitest";

import { comprobanteMessage, normalizeMxPhone, whatsappLink } from "./whatsapp";

describe("normalizeMxPhone", () => {
  it("keeps 10 digits and drops separators", () => {
    expect(normalizeMxPhone("55 1234 5678")).toBe("5512345678");
    expect(normalizeMxPhone("(55) 1234-5678")).toBe("5512345678");
  });

  it("drops a +52 or +521 country prefix", () => {
    expect(normalizeMxPhone("+52 55 1234 5678")).toBe("5512345678");
    expect(normalizeMxPhone("+52 1 55 1234 5678")).toBe("5512345678");
  });

  it("doesn't strip a 52 that is part of a 10-digit number", () => {
    expect(normalizeMxPhone("5212345678")).toBe("5212345678");
  });

  it("works while the number is being typed", () => {
    expect(normalizeMxPhone("+52 55")).toBe("5255");
    expect(normalizeMxPhone("+52 55 1234 567")).toBe("551234567");
  });
});

describe("whatsappLink", () => {
  it("opens a chat with the message pre-filled", () => {
    expect(
      whatsappLink("5512345678", comprobanteMessage("Café Ejemplar")),
    ).toBe(
      "https://wa.me/525512345678?text=Hola%2C%20Caf%C3%A9%20Ejemplar.%20Te%20env%C3%ADo%20mi%20comprobante%20de%20pago.",
    );
  });

  it("works without a title", () => {
    expect(comprobanteMessage()).toBe("Hola. Te envío mi comprobante de pago.");
  });
});
