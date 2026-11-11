"use client";

import { Check, Download, ExternalLink, Link2, Share2 } from "lucide-react";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import QRCode from "react-qr-code";

import { Button } from "@/components/ui/button";

import { qrToPng } from "./qr-image";

const QR_FILENAME = "clabe-club-qr.png";

const noopSubscribe = () => () => {};

/** The generated QR with ways to share it. */
export function Result({
  path,
  titulo,
  autoScroll = true,
  description = "Este QR abre tu página de pago. Compártelo, descárgalo, imprímelo, lo que quieras.",
}: {
  path: string;
  titulo?: string;
  /** Scroll into view when shown (e.g. right after generating). */
  autoScroll?: boolean;
  description?: string;
}) {
  const origin = useSyncExternalStore(
    noopSubscribe,
    () => window.location.origin,
    () => "",
  );
  const canShare = useSyncExternalStore(
    noopSubscribe,
    () => typeof navigator.share === "function",
    () => false,
  );
  const url = `${origin}${path}`;
  const sectionRef = useRef<HTMLElement>(null);
  const qrRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);

  // On phones the result appears below the fold; bring it into view.
  useEffect(() => {
    if (!autoScroll) return;
    sectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [path, autoScroll]);

  useEffect(() => {
    if (!copied) return;
    const timeout = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timeout);
  }, [copied]);

  async function qrPng() {
    const svg = qrRef.current?.querySelector("svg");
    if (!svg) throw new Error("QR not rendered");
    return qrToPng(svg);
  }

  async function share() {
    const title = titulo || "Datos de pago";
    try {
      const file = new File([await qrPng()], QR_FILENAME, {
        type: "image/png",
      });
      const withQr = { title, text: url, files: [file] };
      await navigator.share(
        navigator.canShare?.(withQr) ? withQr : { title, url },
      );
    } catch (error) {
      // Closing the share sheet rejects with AbortError; that's fine.
      if (!(error instanceof DOMException && error.name === "AbortError")) {
        console.error(error);
      }
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch {
      // Clipboard access can be denied; the link is still visible.
    }
  }

  async function download() {
    const href = URL.createObjectURL(await qrPng());
    const link = document.createElement("a");
    link.download = QR_FILENAME;
    link.href = href;
    link.click();
    URL.revokeObjectURL(href);
  }

  return (
    <section
      ref={sectionRef}
      aria-label="Tu código QR"
      className="scroll-mt-6 flex flex-col items-center gap-4 rounded-2xl border p-6"
    >
      <div className="rounded-lg bg-white p-4" ref={qrRef}>
        <QRCode value={url} size={200} />
      </div>
      <p className="max-w-sm text-center text-sm text-muted-foreground">
        {description}
      </p>
      <p className="w-full truncate rounded-md bg-muted px-3 py-2 text-center font-mono text-xs">
        {url}
      </p>
      <div className="grid w-full gap-2 sm:grid-cols-2">
        {canShare && (
          <Button onClick={share} className="sm:col-span-2">
            <Share2 />
            Compartir
          </Button>
        )}
        <Button variant="outline" onClick={copyLink}>
          {copied ? <Check /> : <Link2 />}
          {copied ? "Enlace copiado" : "Copiar enlace"}
        </Button>
        <Button variant="outline" onClick={download}>
          <Download />
          Descargar QR
        </Button>
        <Button variant="ghost" asChild className="sm:col-span-2">
          <a href={path} target="_blank" rel="noopener noreferrer">
            <ExternalLink />
            Ver página
          </a>
        </Button>
      </div>
    </section>
  );
}
