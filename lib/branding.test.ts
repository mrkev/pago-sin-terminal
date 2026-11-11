import { describe, expect, it } from "vitest";

import { isOwnedBrandingPath, newBrandingPath } from "./branding";

const USER = "6f0c1e1a-3b6e-4d2b-9a54-0d6c9f1f2a11";
const OTHER = "0b7a9e2c-1d4f-4c8e-8f3a-5e6d7c8b9a00";

describe("branding paths", () => {
  it("creates unique paths in the user's folder", () => {
    const path = newBrandingPath(USER, "logo", "webp");
    expect(path).toMatch(new RegExp(`^${USER}/logo-\\d+\\.webp$`));
    expect(isOwnedBrandingPath(path, USER, "logo")).toBe(true);
  });

  it("accepts the user's own images of the right kind", () => {
    expect(isOwnedBrandingPath(`${USER}/logo-1.png`, USER, "logo")).toBe(true);
    expect(isOwnedBrandingPath(`${USER}/fondo-1.jpg`, USER, "fondo")).toBe(
      true,
    );
  });

  it("rejects other users' folders, wrong kinds, and odd paths", () => {
    for (const path of [
      `${OTHER}/logo-1.webp`,
      `${USER}/fondo-1.webp`,
      `${USER}/logo-1.gif`,
      `${USER}/logo-abc.webp`,
      `${USER}/../${OTHER}/logo-1.webp`,
      `${USER}/sub/logo-1.webp`,
      `logo-1.webp`,
      "",
    ]) {
      expect(isOwnedBrandingPath(path, USER, "logo"), path).toBe(false);
    }
  });
});
