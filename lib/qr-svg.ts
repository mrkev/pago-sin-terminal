import QRCode from "qrcode";

/** Blank margin around the code, in modules, needed for reliable scans. */
const QUIET_ZONE = 4;

/**
 * A QR code as an SVG data URL, for places that can't run React components
 * (like next/og images). Black on white, with a quiet zone.
 */
export function qrSvgDataUrl(text: string): string {
  const { modules } = QRCode.create(text, { errorCorrectionLevel: "M" });
  const size = modules.size + QUIET_ZONE * 2;
  let path = "";
  for (let y = 0; y < modules.size; y++) {
    for (let x = 0; x < modules.size; x++) {
      if (modules.get(x, y))
        path += `M${x + QUIET_ZONE} ${y + QUIET_ZONE}h1v1h-1z`;
    }
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" shape-rendering="crispEdges"><rect width="${size}" height="${size}" fill="#fff"/><path d="${path}" fill="#000"/></svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}
