import type { Estilo } from "@/lib/estilos";

type Font = {
  name: string;
  data: ArrayBuffer;
  weight: 400 | 500 | 600 | 700 | 800;
  style: "normal" | "italic";
};

/**
 * Fetches a Google Font as TTF, subset to `text` so it's small. Google
 * serves TTF (which next/og needs) to clients that don't ask for WOFF2.
 */
async function googleFont(
  family: string,
  weight: Font["weight"],
  style: Font["style"],
  text: string,
): Promise<Font> {
  const axis = style === "italic" ? `ital,wght@1,${weight}` : `wght@${weight}`;
  const url = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:${axis}&text=${encodeURIComponent(text)}`;
  const css = await (await fetch(url)).text();
  const src = css.match(/src: url\((.+?)\) format\('(?:opentype|truetype)'\)/);
  if (!src) throw new Error(`Font not available: ${family} ${weight}`);
  const data = await (await fetch(src[1])).arrayBuffer();
  return { name: family, data, weight, style };
}

/** The fonts each style's story image uses. */
export function storyFonts(estilo: Estilo, text: string): Promise<Font[]> {
  // Always include digits and common punctuation for the account number.
  // Some styles uppercase text with CSS, so include uppercase glyphs too.
  const chars = `${text}${text.toUpperCase()}0123456789 @·.,-/:¿?¡!`;
  switch (estilo) {
    case "elegante":
      return Promise.all([
        googleFont("Cormorant Garamond", 500, "normal", chars),
        googleFont("Cormorant Garamond", 700, "normal", chars),
        googleFont("Cormorant Garamond", 600, "italic", chars),
      ]);
    case "garage":
      return Promise.all([
        googleFont("Inter", 400, "normal", chars),
        googleFont("Inter", 800, "normal", chars),
        googleFont("JetBrains Mono", 700, "normal", chars),
      ]);
    default:
      return Promise.all([
        googleFont("Inter", 400, "normal", chars),
        googleFont("Inter", 700, "normal", chars),
      ]);
  }
}
