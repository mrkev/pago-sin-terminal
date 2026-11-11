import { describe, expect, it } from "vitest";

import {
  formToLink,
  parsePaymentPage,
  paymentFormSchema,
  paymentPagePath,
} from "./payment-page";

const CLABE = "032180000118359719";
const CARD = "5555555555554444";

/** Parses a path produced by paymentPagePath the way Next.js would. */
function parsePath(path: string) {
  const url = new URL(path, "https://clabe.club");
  const cuenta = url.pathname.replace(/^\/c\//, "");
  return parsePaymentPage(cuenta, Object.fromEntries(url.searchParams));
}

describe("paymentPagePath", () => {
  it("puts the cuenta in the path and the rest in short params", () => {
    expect(
      paymentPagePath({
        cuenta: CLABE,
        titulo: "Café Ejemplar",
        nombre: "Ana",
      }),
    ).toBe(`/c/${CLABE}?t=Caf%C3%A9+Ejemplar&n=Ana`);
  });

  it("omits missing params and the default style", () => {
    expect(paymentPagePath({ cuenta: CLABE })).toBe(`/c/${CLABE}`);
    expect(paymentPagePath({ cuenta: CLABE, estilo: "neutral" })).toBe(
      `/c/${CLABE}`,
    );
    expect(paymentPagePath({ cuenta: CLABE, estilo: "garage" })).toBe(
      `/c/${CLABE}?s=garage`,
    );
  });

  it("only includes the bank for cards", () => {
    expect(paymentPagePath({ cuenta: CARD, banco: "014" })).toBe(
      `/c/${CARD}?b=014`,
    );
    expect(paymentPagePath({ cuenta: CLABE, banco: "014" })).toBe(
      `/c/${CLABE}`,
    );
  });

  it("round-trips through parsePaymentPage", () => {
    const pages = [
      {
        cuenta: CLABE,
        // Characters outside Latin-1 used to crash QR generation.
        titulo: "Kevin’s Café — tacos & más 🌮",
        nombre: "José Peña Núñez S.A. de C.V.",
        estilo: "elegante" as const,
      },
      { cuenta: CARD, titulo: "Chaneque", nombre: "Ana", banco: "014" },
    ];
    for (const page of pages) {
      const result = parsePath(paymentPagePath(page));
      expect(result.success).toBe(true);
      expect(result.data).toEqual(page);
    }
  });
});

describe("parsePaymentPage", () => {
  it("accepts a bare CLABE or card", () => {
    expect(parsePaymentPage(CLABE, {}).data).toEqual({ cuenta: CLABE });
    expect(parsePaymentPage(CARD, {}).data).toEqual({ cuenta: CARD });
  });

  it("accepts each param on its own", () => {
    expect(parsePaymentPage(CLABE, { t: "Hola" }).data).toEqual({
      cuenta: CLABE,
      titulo: "Hola",
    });
    expect(parsePaymentPage(CLABE, { n: "Ana" }).data).toEqual({
      cuenta: CLABE,
      nombre: "Ana",
    });
  });

  it("treats blank params as missing", () => {
    expect(
      parsePaymentPage(CLABE, { t: "", n: "   ", b: "", s: "" }).data,
    ).toEqual({ cuenta: CLABE });
  });

  it("rejects present-but-invalid params instead of dropping them", () => {
    expect(parsePaymentPage(CLABE, { n: "Ana 🌮" }).success).toBe(false);
    expect(parsePaymentPage(CARD, { b: "999" }).success).toBe(false);
  });

  it("falls back to the default style for unknown styles", () => {
    const result = parsePaymentPage(CLABE, { s: "comic-sans" });
    expect(result.success).toBe(true);
    expect(result.data?.estilo).toBeUndefined();
  });

  it("rejects bad check digits", () => {
    expect(parsePaymentPage("032180000118359718", {}).success).toBe(false);
    expect(parsePaymentPage("5555555555554445", {}).success).toBe(false);
  });

  it("uses the first value of repeated params", () => {
    const result = parsePaymentPage(CLABE, { t: ["Uno", "Dos"], n: "Ana" });
    expect(result.data?.titulo).toBe("Uno");
  });

  it("trims whitespace", () => {
    const result = parsePaymentPage(CLABE, { t: "  Hola ", n: " Ana  " });
    expect(result.data).toMatchObject({ titulo: "Hola", nombre: "Ana" });
  });

  it("limits names to letters, numbers, spaces and basic punctuation", () => {
    expect(parsePaymentPage(CLABE, { n: "Ana <b>" }).success).toBe(false);
  });

  it("enforces length limits", () => {
    expect(parsePaymentPage(CLABE, { n: "a".repeat(81) }).success).toBe(false);
    expect(parsePaymentPage(CLABE, { t: "a".repeat(61) }).success).toBe(false);
  });
});

describe("paymentFormSchema", () => {
  const form = {
    titulo: "Chaneque",
    cuenta: CARD,
    banco: "",
    nombre: "Ana",
    estilo: "neutral" as const,
  };

  it("requires a bank for cards", () => {
    const result = paymentFormSchema.safeParse(form);
    expect(result.success).toBe(false);
    expect(result.error?.issues.map((i) => i.path.join("."))).toEqual([
      "banco",
    ]);
    expect(paymentFormSchema.safeParse({ ...form, banco: "014" }).success).toBe(
      true,
    );
  });

  it("flags a missing bank even while other fields are invalid", () => {
    const result = paymentFormSchema.safeParse({ ...form, nombre: "" });
    const paths = new Set(result.error?.issues.map((i) => i.path.join(".")));
    expect([...paths].sort()).toEqual(["banco", "nombre"]);
  });

  it("doesn't need a bank for a CLABE", () => {
    const result = paymentFormSchema.safeParse({ ...form, cuenta: CLABE });
    expect(result.success).toBe(true);
    expect(formToLink(result.data!).banco).toBeUndefined();
  });
});
