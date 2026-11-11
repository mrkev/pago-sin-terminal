import { describe, expect, it } from "vitest";

import { redactUrl } from "./analytics";

describe("redactUrl", () => {
  it("removes the account number and personal data from free links", () => {
    expect(
      redactUrl(
        "https://clabe.vercel.app/c/5555555555554444?t=Chaneque&n=Ana+G%C3%B3mez&b=014&w=5512345678&s=elegante",
      ),
    ).toBe("https://clabe.vercel.app/c/[cuenta]");
  });

  it("removes one-time sign-in codes", () => {
    expect(redactUrl("https://clabe.vercel.app/auth/callback?code=abc")).toBe(
      "https://clabe.vercel.app/auth/callback",
    );
    expect(redactUrl("https://clabe.vercel.app/?code=abc#x")).toBe(
      "https://clabe.vercel.app/",
    );
  });

  it("keeps public short links and the home page", () => {
    expect(redactUrl("https://clabe.vercel.app/chaneque-studio")).toBe(
      "https://clabe.vercel.app/chaneque-studio",
    );
    expect(redactUrl("https://clabe.vercel.app/")).toBe(
      "https://clabe.vercel.app/",
    );
  });
});
