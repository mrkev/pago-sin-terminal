import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { clabeBankName } from "@/lib/clabe";
import { parseClabePage } from "@/lib/clabe-page";

import { CopyButton } from "./copy-button";
import "./garage.css";

type Props = {
  params: Promise<{ clabe: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

async function load({ params, searchParams }: Props) {
  const { clabe } = await params;
  // Anything that isn't shaped like a CLABE isn't a CLABE page.
  if (!/^\d{18}$/.test(clabe)) notFound();
  return parseClabePage(clabe, await searchParams);
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

export default async function ClabePage(props: Props) {
  const result = await load(props);
  const page = result.success ? result.data : null;
  const bank = page && clabeBankName(page.clabe);

  return (
    <div className="min-h-screen custom-page">
      <div className="container mx-auto px-4 py-10">
        <Card className="max-w-2xl mx-auto custom-card">
          <CardHeader className="custom-header">
            <CardTitle className="custom-title">
              {page?.titulo ?? "Datos de pago"}
            </CardTitle>
            <CardDescription className="custom-subtitle">
              Usa estos datos para pagar por transferencia
            </CardDescription>
          </CardHeader>

          {/* <div className="custom-header max-w-2xl mx-auto mb-6 text-center">
            <h1 className="custom-title">{page?.titulo ?? "Datos de pago"}</h1>
            <div className="custom-title-decoration">
              <div className="custom-line-left"></div>
              <div className="custom-star">✯</div>
              <div className="custom-line-center"></div>
              <div className="custom-star">✯</div>
              <div className="custom-line-right"></div>
            </div>
          </div> */}

          <CardContent className="custom-card-content">
            {page ? (
              <div className="space-y-6">
                <div>
                  <h2 className="custom-section-header custom-section-title text-lg font-medium mb-2">
                    Información bancaria
                  </h2>
                  <Separator className="mb-4" />

                  {/* <div className="custom-section-header text-lg font-medium mb-2">
                    <div className="custom-section-line-left"></div>
                    <h2 className="custom-section-title">Información bancaria</h2>
                    <div className="custom-section-line-right"></div>
                  </div> */}

                  <div className="space-y-6 custom-content-section">
                    <Field label="CLABE" value={page.clabe} copyable />
                    {bank && <Field label="Banco" value={bank} />}
                    {page.nombre && (
                      <Field
                        label="Nombre del beneficiario"
                        value={page.nombre}
                        copyable
                      />
                    )}
                  </div>
                </div>

                {/* <div className="custom-footer">
                  <div className="custom-footer-decoration">
                    <div className="custom-footer-line-left"></div>
                    <div className="custom-footer-star">★</div>
                    <div className="custom-footer-line-right"></div>
                  </div>
                </div> */}
              </div>
            ) : (
              <Alert variant="destructive" className="custom-alert">
                <AlertTitle className="custom-alert-title">Error</AlertTitle>
                <AlertDescription className="custom-alert-description">
                  No pudimos leer los datos de este enlace.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  copyable = false,
}: {
  label: string;
  value: string;
  copyable?: boolean;
}) {
  return (
    <div>
      <h3 className="custom-field-label font-medium text-sm text-gray-500 dark:text-gray-400">
        {label}
      </h3>
      <div className="flex items-center mt-1">
        <div
          className={
            copyable
              ? "custom-field-value grow p-3 rounded-l-md bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
              : "custom-field-value custom-field-value-full grow p-3 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
          }
        >
          {value}
        </div>
        {copyable && <CopyButton value={value} label={label} />}
      </div>
    </div>
  );
}
