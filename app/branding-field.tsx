"use client";

import { ImageIcon, LoaderCircle } from "lucide-react";
import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  BRANDING_BUCKET,
  BRANDING_MAX_SIZE,
  type BrandingKind,
  brandingUrl,
  newBrandingPath,
} from "@/lib/branding";
import { resizeImage } from "@/lib/resize-image";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

/** Bigger than any reasonable photo; we resize before uploading anyway. */
const MAX_INPUT_BYTES = 25 * 1024 * 1024;

/**
 * Picks an image, shrinks it in the browser, and uploads it to the user's
 * branding folder. The value is the Storage path ("" for none); it's only
 * attached to the page when the page is saved.
 */
export function BrandingField({
  kind,
  label,
  userId,
  value,
  savedValue,
  onChange,
}: {
  kind: BrandingKind;
  label: string;
  userId: string;
  value: string;
  /** What's currently saved, so we know which uploads are throwaway. */
  savedValue: string;
  onChange: (path: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /** Deletes an upload that was never saved to the page. */
  function discardUnsaved(path: string) {
    if (path && path !== savedValue) {
      void createClient().storage.from(BRANDING_BUCKET).remove([path]);
    }
  }

  async function upload(file: File) {
    setError(null);
    if (!file.type.startsWith("image/")) {
      setError("Elige una imagen.");
      return;
    }
    if (file.size > MAX_INPUT_BYTES) {
      setError("Esa imagen es muy pesada. Prueba con otra.");
      return;
    }
    setUploading(true);
    try {
      const { blob, extension } = await resizeImage(
        file,
        BRANDING_MAX_SIZE[kind],
        // Logos often have transparent backgrounds; photos don't.
        { transparent: kind === "logo" },
      );
      const path = newBrandingPath(userId, kind, extension);
      const { error } = await createClient()
        .storage.from(BRANDING_BUCKET)
        .upload(path, blob, {
          contentType: blob.type,
          // Paths are unique per upload, so cache them for good.
          cacheControl: "31536000",
        });
      if (error) throw error;
      discardUnsaved(value);
      onChange(path);
    } catch (err) {
      console.error(err);
      setError("No pudimos subir la imagen. Intenta con otra.");
    } finally {
      setUploading(false);
    }
  }

  function remove() {
    discardUnsaved(value);
    onChange("");
  }

  return (
    <div className="space-y-2">
      <div className="text-sm font-medium">{label}</div>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        aria-label={
          value
            ? `Cambiar ${label.toLowerCase()}`
            : `Subir ${label.toLowerCase()}`
        }
        className={cn(
          "relative flex h-28 w-full items-center justify-center overflow-hidden rounded-lg border text-sm text-muted-foreground transition-colors hover:bg-accent focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring",
          !value && "border-dashed",
        )}
      >
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element -- user upload preview
          <img
            src={brandingUrl(value)}
            alt=""
            className={cn(
              "h-full w-full",
              kind === "logo" ? "object-contain p-2" : "object-cover",
            )}
          />
        ) : (
          <span className="flex flex-col items-center gap-2">
            <ImageIcon className="size-5" aria-hidden />
            Subir {label.toLowerCase()}
          </span>
        )}
        {uploading && (
          <span className="absolute inset-0 flex items-center justify-center bg-background/70">
            <LoaderCircle className="size-5 animate-spin" aria-hidden />
            <span className="sr-only">Subiendo…</span>
          </span>
        )}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        tabIndex={-1}
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (file) void upload(file);
        }}
      />
      {value && !uploading && (
        <Button
          type="button"
          variant="link"
          size="sm"
          className="h-auto px-0"
          onClick={remove}
        >
          Quitar
        </Button>
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
