import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";

import { PaymentCard } from "@/components/payment-card/payment-card";
import { brandingUrl } from "@/lib/branding";
import { asEstilo } from "@/lib/saved-page";
import { createClient } from "@/lib/supabase/server";

type Props = { params: Promise<{ slug: string }> };

/** A saved page by its short link. Cached so metadata and page share it. */
const loadPage = cache(async (slug: string) => {
  // Cheap reject for anything that can't be a short link (favicon.ico, etc).
  if (!/^[a-z][a-z0-9-]{2,29}$/i.test(slug)) return null;
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("page_by_slug", { p_slug: slug });
  if (error) throw error;
  return data[0] ?? null;
});

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const page = await loadPage((await params).slug);
  return {
    title: page?.titulo ?? "Página no encontrada",
    description: "Usa estos datos para pagar por transferencia.",
    // These pages carry someone's bank details; keep them out of search.
    robots: { index: false, follow: false },
  };
}

export default async function SavedPaymentPage({ params }: Props) {
  const page = await loadPage((await params).slug);
  if (!page) notFound();

  return (
    <PaymentCard
      variant="page"
      cuenta={page.cuenta}
      titulo={page.titulo}
      nombre={page.nombre}
      banco={page.banco ?? undefined}
      whatsapp={page.whatsapp ?? undefined}
      estilo={asEstilo(page.estilo)}
      logoUrl={page.logo_path ? brandingUrl(page.logo_path) : undefined}
      fondoUrl={page.fondo_path ? brandingUrl(page.fondo_path) : undefined}
      socials={{
        instagram: page.instagram ?? undefined,
        tiktok: page.tiktok ?? undefined,
        facebook: page.facebook ?? undefined,
      }}
    />
  );
}
