import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PaymentCard } from "@/components/payment-card/payment-card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { parsePaymentPage } from "@/lib/payment-page";

type Props = {
  params: Promise<{ cuenta: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

async function load({ params, searchParams }: Props) {
  const { cuenta } = await params;
  // Anything not shaped like a CLABE or card number isn't a payment page.
  if (!/^(\d{16}|\d{18})$/.test(cuenta)) notFound();
  return parsePaymentPage(cuenta, await searchParams);
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const result = await load(props);
  return {
    title: (result.success && result.data.titulo) || "Datos de pago",
    description: "Usa estos datos para pagar por transferencia.",
    // These pages carry someone's bank details; keep them out of search.
    robots: { index: false, follow: false },
  };
}

export default async function PaymentPage(props: Props) {
  const result = await load(props);

  if (!result.success) {
    return (
      <main className="flex min-h-dvh items-start justify-center px-4 py-10">
        <Alert variant="destructive" className="max-w-md">
          <AlertTitle>Este enlace no funciona</AlertTitle>
          <AlertDescription>
            No pudimos leer los datos de este enlace. Pídele uno nuevo a quien
            te lo mandó.
          </AlertDescription>
        </Alert>
      </main>
    );
  }

  return <PaymentCard {...result.data} variant="page" />;
}
