import { describe, expect, it } from "vitest";

import { qrSvgDataUrl } from "./qr-svg";
import { linkStoryImagePath, savedStoryImagePath } from "./story";

describe("story image paths", () => {
  it("uses the slug for saved pages", () => {
    expect(savedStoryImagePath("chaneque-studio")).toBe(
      "/api/historia?slug=chaneque-studio",
    );
  });

  it("carries a free link's params plus the cuenta", () => {
    expect(
      linkStoryImagePath({
        cuenta: "5555555555554444",
        titulo: "Café",
        banco: "014",
        estilo: "garage",
      }),
    ).toBe("/api/historia?c=5555555555554444&t=Caf%C3%A9&b=014&s=garage");
    expect(linkStoryImagePath({ cuenta: "012180000000000002" })).toBe(
      "/api/historia?c=012180000000000002",
    );
  });
});

describe("qrSvgDataUrl", () => {
  it("returns an SVG data URL with a quiet zone", () => {
    const url = qrSvgDataUrl("https://clabe.vercel.app/chaneque-studio");
    expect(url.startsWith("data:image/svg+xml;base64,")).toBe(true);
    const svg = Buffer.from(url.split(",")[1], "base64").toString();
    const size = Number(svg.match(/viewBox="0 0 (\d+) \1"/)?.[1]);
    // Version 3 (29 modules) or so, plus 4 modules of margin on each side.
    expect(size).toBeGreaterThanOrEqual(21 + 8);
    // No dark module in the quiet zone.
    expect(svg).not.toMatch(/M[0-3] /);
  });
});
