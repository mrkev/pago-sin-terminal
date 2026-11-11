import { ImageResponse } from "next/og";
import { type NextRequest, NextResponse } from "next/server";

import { brandingUrl } from "@/lib/branding";
import {
  TIPO_CUENTA_LABEL,
  cuentaBankName,
  formatCuenta,
  tipoCuenta,
} from "@/lib/cuenta";
import { parsePaymentPage, paymentPagePath } from "@/lib/payment-page";
import { qrSvgDataUrl } from "@/lib/qr-svg";
import { asEstilo } from "@/lib/saved-page";
import { SOCIALS, SOCIAL_INFO } from "@/lib/socials";
import { STORY_FILENAME, STORY_HEIGHT, STORY_WIDTH } from "@/lib/story";
import { createClient } from "@/lib/supabase/server";

import { storyFonts } from "./fonts";
import { type StoryData, StoryImage } from "./story-image";

/**
 * A 9:16 story image of a payment page.
 *
 *   /api/historia?slug=<slug>          a saved page
 *   /api/historia?c=<cuenta>&t=…&n=…   a free link (same params as /c/…)
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const origin = request.nextUrl.origin;
  const slug = params.get("slug");

  const data = slug
    ? await savedPageStory(slug, origin)
    : linkStory(params, origin);
  if (!data) {
    return NextResponse.json(
      { error: "Página no encontrada" },
      { status: 404 },
    );
  }

  const text = [
    data.titulo,
    data.nombre,
    data.bank,
    data.cuentaLabel,
    data.linkText,
    ...data.socials.flatMap((s) => [s.network, s.handle]),
    "Transferencia bancaria Nombre Banco Escanea para copiar los datos o entra a Comprobante por WhatsApp",
  ].join(" ");

  return new ImageResponse(<StoryImage data={data} />, {
    width: STORY_WIDTH,
    height: STORY_HEIGHT,
    fonts: await storyFonts(data.estilo, text),
    headers: {
      "Content-Disposition": `inline; filename="${STORY_FILENAME}"`,
      // Free links encode all their data, so the image never changes.
      // Saved pages can be edited at any time.
      "Cache-Control": slug
        ? "no-store"
        : "public, max-age=31536000, immutable",
    },
  });
}

async function savedPageStory(
  slug: string,
  origin: string,
): Promise<StoryData | null> {
  if (!/^[a-z][a-z0-9-]{2,29}$/i.test(slug)) return null;
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("page_by_slug", { p_slug: slug });
  if (error) throw error;
  const page = data[0];
  if (!page) return null;

  const link = `${origin}/${page.slug}`;
  return {
    ...cuentaFields(page.cuenta, page.banco ?? undefined),
    estilo: asEstilo(page.estilo),
    titulo: page.titulo,
    nombre: page.nombre,
    whatsapp: formatPhone(page.whatsapp),
    socials: SOCIALS.flatMap((s) =>
      page[s] ? [{ network: SOCIAL_INFO[s].label, handle: page[s] }] : [],
    ),
    logoUrl: imageUrl(page.logo_path),
    fondoUrl: imageUrl(page.fondo_path),
    qrDataUrl: qrSvgDataUrl(link),
    linkText: stripProtocol(link),
  };
}

function linkStory(params: URLSearchParams, origin: string): StoryData | null {
  const cuenta = params.get("c") ?? "";
  const result = parsePaymentPage(cuenta, Object.fromEntries(params));
  if (!result.success) return null;
  const page = result.data;

  const link = `${origin}${paymentPagePath(page)}`;
  return {
    ...cuentaFields(page.cuenta, page.banco),
    estilo: asEstilo(page.estilo),
    titulo: page.titulo ?? "Datos de pago",
    nombre: page.nombre,
    whatsapp: formatPhone(page.whatsapp),
    socials: [],
    qrDataUrl: qrSvgDataUrl(link),
  };
}

function cuentaFields(cuenta: string, banco?: string) {
  const tipo = tipoCuenta(cuenta);
  return {
    cuenta: formatCuenta(cuenta),
    cuentaLabel: tipo ? TIPO_CUENTA_LABEL[tipo] : "Cuenta",
    bank: cuentaBankName(cuenta, banco),
  };
}

/** Public URL for a stored image, skipping WebP (next/og can't draw it). */
function imageUrl(path: string | null): string | undefined {
  return path && !path.endsWith(".webp") ? brandingUrl(path) : undefined;
}

function formatPhone(phone: string | null | undefined): string | undefined {
  return phone
    ? phone.replace(/^(\d{2})(\d{4})(\d{4})$/, "$1 $2 $3")
    : undefined;
}

function stripProtocol(url: string): string {
  return url.replace(/^https?:\/\//, "");
}
