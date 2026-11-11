import { describe, expect, it } from "vitest";

import { clabePagePath, parseClabePage } from "./clabe-page";

const CLABE = "032180000118359719";

/** Parses a path produced by clabePagePath the way Next.js would. */
function parsePath(path: string) {
  const url = new URL(path, "https://clabe.club");
  const clabe = url.pathname.replace(/^\/c\//, "");
  return parseClabePage(clabe, Object.fromEntries(url.searchParams));
}

describe("clabePagePath", () => {
  it("puts the CLABE in the path and the rest in short params", () => {
    expect(
      clabePagePath({ clabe: CLABE, titulo: "Café Ejemplar", nombre: "Ana" }),
    ).toBe(`/c/${CLABE}?t=Caf%C3%A9+Ejemplar&n=Ana`);
  });

  it("omits missing params", () => {
    expect(clabePagePath({ clabe: CLABE })).toBe(`/c/${CLABE}`);
    expect(clabePagePath({ clabe: CLABE, nombre: "Ana" })).toBe(
      `/c/${CLABE}?n=Ana`,
    );
  });

  it("round-trips through parseClabePage", () => {
    const page = {
      clabe: CLABE,
      // Characters outside Latin-1 used to crash QR generation.
      titulo: "Kevin’s Café — tacos & más 🌮",
      nombre: "José Peña Núñez S.A. de C.V.",
    };
    const result = parsePath(clabePagePath(page));
    expect(result.success).toBe(true);
    expect(result.data).toEqual(page);
  });
});

describe("parseClabePage", () => {
  it("accepts a bare CLABE", () => {
    const result = parseClabePage(CLABE, {});
    expect(result.success).toBe(true);
    expect(result.data).toEqual({ clabe: CLABE });
  });

  it("accepts either param on its own", () => {
    expect(parseClabePage(CLABE, { t: "Hola" }).data).toEqual({
      clabe: CLABE,
      titulo: "Hola",
    });
    expect(parseClabePage(CLABE, { n: "Ana" }).data).toEqual({
      clabe: CLABE,
      nombre: "Ana",
    });
  });

  it("treats blank params as missing", () => {
    expect(parseClabePage(CLABE, { t: "", n: "   " }).data).toEqual({
      clabe: CLABE,
    });
  });

  it("rejects present-but-invalid params instead of dropping them", () => {
    expect(parseClabePage(CLABE, { n: "Ana 🌮" }).success).toBe(false);
  });

  it("rejects a CLABE with a bad control digit", () => {
    const result = parseClabePage("032180000118359718", {
      t: "Hola",
      n: "Ana",
    });
    expect(result.success).toBe(false);
  });

  it("uses the first value of repeated params", () => {
    const result = parseClabePage(CLABE, { t: ["Uno", "Dos"], n: "Ana" });
    expect(result.data?.titulo).toBe("Uno");
  });

  it("trims whitespace", () => {
    const result = parseClabePage(CLABE, { t: "  Hola ", n: " Ana  " });
    expect(result.data).toMatchObject({ titulo: "Hola", nombre: "Ana" });
  });

  it("limits names to letters, numbers, spaces and basic punctuation", () => {
    expect(parseClabePage(CLABE, { t: "Hola", n: "Ana <b>" }).success).toBe(
      false,
    );
    expect(parseClabePage(CLABE, { t: "Hola", n: "Ana 🌮" }).success).toBe(
      false,
    );
  });

  it("enforces length limits", () => {
    const n = "a".repeat(81);
    const t = "a".repeat(61);
    expect(parseClabePage(CLABE, { t: "Hola", n }).success).toBe(false);
    expect(parseClabePage(CLABE, { t, n: "Ana" }).success).toBe(false);
  });
});
