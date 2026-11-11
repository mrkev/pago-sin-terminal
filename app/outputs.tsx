"use client";

import {
  Check,
  Download,
  ExternalLink,
  Link2,
  LoaderCircle,
  Share2,
} from "lucide-react";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import QRCode from "react-qr-code";

import { Button } from "@/components/ui/button";
import { STORY_FILENAME } from "@/lib/story";

import { qrToPng } from "./qr-image";

const QR_FILENAME = "clabe-club-qr.png";

const noopSubscribe = () => () => {};

function useOrigin() {
  return useSyncExternalStore(
    noopSubscribe,
    () => window.location.origin,
    () => "",
  );
}

function useCanShare() {
  return useSyncExternalStore(
    noopSubscribe,
    () => typeof navigator.share === "function",
    () => false,
  );
}

/** Shares a file through the system share sheet, falling back to a link. */
async function shareFile(file: File, title: string, url: string) {
  try {
    const withFile = { title, text: url, files: [file] };
    await navigator.share(
      navigator.canShare?.(withFile) ? withFile : { title, url },
    );
  } catch (error) {
    // Closing the share sheet rejects with AbortError; that's fine.
    if (!(error instanceof DOMException && error.name === "AbortError")) {
      console.error(error);
    }
  }
}

function downloadBlob(blob: Blob, filename: string) {
  const href = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.download = filename;
  link.href = href;
  link.click();
  URL.revokeObjectURL(href);
}

function CopyLinkButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timeout = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timeout);
  }, [copied]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch {
      // Clipboard access can be denied; the link is still visible.
    }
  }

  return (
    <Button variant="outline" onClick={copy}>
      {copied ? <Check /> : <Link2 />}
      {copied ? "Enlace copiado" : "Copiar enlace"}
    </Button>
  );
}

/** The QR code for a page, with ways to share it. */
export function QrPanel({ path, titulo }: { path: string; titulo: string }) {
  const origin = useOrigin();
  const canShare = useCanShare();
  const url = `${origin}${path}`;
  const qrRef = useRef<HTMLDivElement>(null);

  async function qrPng() {
    const svg = qrRef.current?.querySelector("svg");
    if (!svg) throw new Error("QR not rendered");
    return qrToPng(svg);
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="rounded-lg bg-white p-4" ref={qrRef}>
        <QRCode value={url} size={200} />
      </div>
      <p className="w-full truncate rounded-md bg-muted px-3 py-2 text-center font-mono text-xs">
        {url}
      </p>
      <div className="grid w-full gap-2 sm:grid-cols-2">
        {canShare && (
          <Button
            className="sm:col-span-2"
            onClick={async () =>
              shareFile(
                new File([await qrPng()], QR_FILENAME, { type: "image/png" }),
                titulo,
                url,
              )
            }
          >
            <Share2 />
            Compartir
          </Button>
        )}
        <CopyLinkButton url={url} />
        <Button
          variant="outline"
          onClick={async () => downloadBlob(await qrPng(), QR_FILENAME)}
        >
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
    </div>
  );
}

/** The 9:16 story image for a page, with ways to share it. */
export function StoryPanel({
  imagePath,
  pagePath,
  titulo,
  shortLink,
}: {
  imagePath: string;
  pagePath: string;
  titulo: string;
  /** For saved pages: the short link, for an Instagram link sticker. */
  shortLink?: string;
}) {
  const origin = useOrigin();
  const canShare = useCanShare();
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const [busy, setBusy] = useState(false);

  async function storyFile() {
    const response = await fetch(imagePath);
    if (!response.ok) throw new Error(`Story image: ${response.status}`);
    const blob = await response.blob();
    return new File([blob], STORY_FILENAME, { type: "image/png" });
  }

  async function run(action: (file: File) => Promise<void> | void) {
    setBusy(true);
    try {
      await action(await storyFile());
    } catch (error) {
      console.error(error);
      setFailed(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative aspect-[9/16] h-[min(55vh,32rem)] overflow-hidden rounded-lg border bg-muted">
        {/* eslint-disable-next-line @next/next/no-img-element -- generated image */}
        <img
          src={imagePath}
          alt={`Imagen para historias de ${titulo}`}
          className="h-full w-full object-cover"
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
        />
        {!loaded && !failed && (
          <div className="absolute inset-0 flex items-center justify-center">
            <LoaderCircle className="size-6 animate-spin text-muted-foreground" />
            <span className="sr-only">Generando imagen…</span>
          </div>
        )}
      </div>
      {failed ? (
        <p className="text-center text-sm text-destructive">
          No pudimos generar la imagen. Intenta de nuevo en un momento.
        </p>
      ) : (
        shortLink && (
          <p className="max-w-sm text-center text-sm text-muted-foreground">
            En Instagram, agrega un sticker de enlace con {shortLink} para que
            puedan tocarlo.
          </p>
        )
      )}
      <div className="grid w-full gap-2 sm:grid-cols-2">
        {canShare && (
          <Button
            className="sm:col-span-2"
            disabled={busy || !loaded}
            onClick={() =>
              run((file) => shareFile(file, titulo, `${origin}${pagePath}`))
            }
          >
            {busy ? <LoaderCircle className="animate-spin" /> : <Share2 />}
            Compartir
          </Button>
        )}
        <Button
          variant="outline"
          className={canShare ? "" : "sm:col-span-2"}
          disabled={busy || !loaded}
          onClick={() => run((file) => downloadBlob(file, STORY_FILENAME))}
        >
          <Download />
          Descargar imagen
        </Button>
        {canShare && <CopyLinkButton url={`${origin}${pagePath}`} />}
      </div>
    </div>
  );
}
