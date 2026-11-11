import { describe, expect, it } from "vitest";

import { clabeBankName, clabeControlDigit, isValidClabe } from "./clabe";

describe("isValidClabe", () => {
  it("accepts CLABEs with a correct control digit", () => {
    // Widely published example CLABE.
    expect(isValidClabe("032180000118359719")).toBe(true);
    expect(isValidClabe("012180000000000002")).toBe(true);
  });

  it("rejects a wrong control digit", () => {
    expect(isValidClabe("032180000118359718")).toBe(false);
  });

  it("catches a single mistyped digit", () => {
    const valid = "032180000118359719";
    for (let i = 0; i < 17; i++) {
      const digit = (Number(valid[i]) + 1) % 10;
      const typo = valid.slice(0, i) + digit + valid.slice(i + 1);
      expect(isValidClabe(typo), typo).toBe(false);
    }
  });

  it("rejects anything that isn't exactly 18 digits", () => {
    expect(isValidClabe("")).toBe(false);
    expect(isValidClabe("03218000011835971")).toBe(false);
    expect(isValidClabe("0321800001183597190")).toBe(false);
    expect(isValidClabe("03218000011835971a")).toBe(false);
    expect(isValidClabe("0321 8000 0118 3597 19")).toBe(false);
  });
});

describe("clabeControlDigit", () => {
  it("computes the 18th digit", () => {
    expect(clabeControlDigit("03218000011835971")).toBe(9);
    expect(clabeControlDigit("00000000000000000")).toBe(0);
  });
});

describe("clabeBankName", () => {
  it("looks up the bank from the first three digits", () => {
    expect(clabeBankName("012180000000000002")).toBe("BBVA México");
    expect(clabeBankName("638")).toBe("Nu");
    expect(clabeBankName("722180000000000000")).toBe("Mercado Pago");
  });

  it("returns undefined for unknown or incomplete prefixes", () => {
    expect(clabeBankName("999180000000000000")).toBeUndefined();
    expect(clabeBankName("01")).toBeUndefined();
    expect(clabeBankName("")).toBeUndefined();
  });
});
