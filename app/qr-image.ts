/** Pixel size of the QR in exported PNGs, not counting the margin. */
const QR_SIZE = 1024;
/** Blank margin around a QR code, in modules, needed for reliable scans. */
const QUIET_ZONE_MODULES = 4;

/**
 * Renders a react-qr-code SVG to a print-quality PNG with a white margin.
 */
export async function qrToPng(svg: SVGSVGElement): Promise<Blob> {
  // react-qr-code sets the viewBox to the QR's size in modules.
  const modules = svg.viewBox.baseVal.width;
  const margin = Math.round((QR_SIZE / modules) * QUIET_ZONE_MODULES);

  const img = new Image();
  const svgData = new XMLSerializer().serializeToString(svg);
  img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgData)}`;
  await img.decode();

  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = QR_SIZE + margin * 2;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context unavailable");
  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, margin, margin, QR_SIZE, QR_SIZE);

  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("PNG export failed"))),
      "image/png",
    ),
  );
}
