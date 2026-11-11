import { describe, expect, it } from "vitest";

import { isValidCard } from "./card";
import { cuentaBankName, formatCuenta, tipoCuenta } from "./cuenta";

// Standard public test card numbers.
const VISA = "4111111111111111";
const MASTERCARD = "5555555555554444";

describe("isValidCard", () => {
  it("accepts numbers that pass the Luhn check", () => {
    expect(isValidCard(VISA)).toBe(true);
    expect(isValidCard(MASTERCARD)).toBe(true);
  });

  it("catches a single mistyped digit", () => {
    for (let i = 0; i < 16; i++) {
      const digit = (Number(MASTERCARD[i]) + 1) % 10;
      const typo = MASTERCARD.slice(0, i) + digit + MASTERCARD.slice(i + 1);
      expect(isValidCard(typo), typo).toBe(false);
    }
  });

  it("only accepts 16 digits", () => {
    expect(isValidCard("411111111111111")).toBe(false);
    expect(isValidCard("41111111111111110")).toBe(false);
    expect(isValidCard("4111 1111 1111 1111")).toBe(false);
  });
});

describe("tipoCuenta", () => {
  it("tells CLABEs and cards apart by length", () => {
    expect(tipoCuenta("012180000000000002")).toBe("clabe");
    expect(tipoCuenta(VISA)).toBe("tarjeta");
    expect(tipoCuenta("12345")).toBeUndefined();
  });
});

describe("cuentaBankName", () => {
  it("reads the bank from a CLABE and ignores the picked one", () => {
    expect(cuentaBankName("012180000000000002", "014")).toBe("BBVA México");
  });

  it("uses the picked bank for cards", () => {
    expect(cuentaBankName(VISA, "014")).toBe("Santander");
    expect(cuentaBankName(VISA)).toBeUndefined();
    expect(cuentaBankName(VISA, "999")).toBeUndefined();
    expect(cuentaBankName(VISA, "toString")).toBeUndefined();
  });
});

describe("formatCuenta", () => {
  it("groups digits in fours", () => {
    expect(formatCuenta(VISA)).toBe("4111 1111 1111 1111");
    expect(formatCuenta("012180000000000002")).toBe("0121 8000 0000 0000 02");
    expect(formatCuenta("01218")).toBe("0121 8");
  });
});
