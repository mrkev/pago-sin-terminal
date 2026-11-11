"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Check, Copy } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

interface DecodedData {
  encabezado: string;
  informacionBancaria: {
    clabe: string;
    nombreBeneficiario: string;
  };
  estilo?: "neutral" | "garage";
}

function decodeData(base64String: string | null): {
  decodedData: DecodedData | null;
  error: string | null;
} {
  if (!base64String) {
    return {
      decodedData: null,
      error: "Este enlace no incluye ninguna CLABE.",
    };
  }

  try {
    // Decode base64 to JSON string, then parse it
    const data = JSON.parse(atob(base64String)) as DecodedData;
    return { decodedData: data, error: null };
  } catch (err) {
    console.error(err);
    return {
      decodedData: null,
      error: "No pudimos leer los datos de este enlace.",
    };
  }
}

export default function QRPage() {
  const searchParams = useSearchParams();
  const [copiedItems, setCopiedItems] = useState<{ [key: string]: boolean }>({
    clabe: false,
    nombreBeneficiario: false,
  });
  const base64String = searchParams.get("q");
  const { decodedData, error } = useMemo(
    () => decodeData(base64String),
    [base64String],
  );

  // Load garage stylesheet if needed
  useEffect(() => {
    if (decodedData?.estilo === "garage") {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "/garage.css";
      link.id = "custom-stylesheet";
      document.head.appendChild(link);

      return () => {
        const existingLink = document.getElementById("custom-stylesheet");
        if (existingLink) {
          existingLink.remove();
        }
      };
    }
  }, [decodedData?.estilo]);

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedItems((prev) => ({ ...prev, [field]: true }));
    setTimeout(() => {
      setCopiedItems((prev) => ({ ...prev, [field]: false }));
    }, 2000);
  };

  // Determine if we should use the garage style
  const isGarageStyle = true; //  decodedData?.estilo === "garage";

  console.log(decodedData);

  return (
    <div className={`min-h-screen custom-page`}>
      {isGarageStyle && (
        <link rel="stylesheet" href="/garage.css" precedence="default" />
      )}
      <div className="container mx-auto py-10">
        <Card className={`max-w-2xl mx-auto custom-card`}>
          <CardHeader className="custom-header">
            <CardTitle className="custom-title">
              {decodedData ? decodedData.encabezado : "Datos de pago"}
            </CardTitle>
            <CardDescription className="custom-subtitle">
              Usa estos datos para pagar por transferencia
            </CardDescription>
          </CardHeader>

          {/* {isGarageStyle && (
          <div className="custom-header max-w-2xl mx-auto mb-6 text-center">
            <h1 className="custom-title">
              {decodedData?.encabezado || "Datos de pago"}
            </h1>
            <div className="custom-title-decoration">
              <div className="custom-line-left"></div>
              <div className="custom-star">✯</div>
              <div className="custom-line-center"></div>
              <div className="custom-star">✯</div>
              <div className="custom-line-right"></div>
            </div>
          </div>
        )} */}

          <CardContent className={"custom-card-content"}>
            {error ? (
              <Alert variant={"destructive"} className={"custom-alert"}>
                <AlertTitle className="custom-alert-title">Error</AlertTitle>
                <AlertDescription className={"custom-alert-description"}>
                  {error}
                </AlertDescription>
              </Alert>
            ) : decodedData ? (
              <div className="space-y-6">
                <div>
                  <h3 className="custom-section-header custom-section-title text-lg font-medium mb-2">
                    Información Bancaria
                  </h3>
                  <Separator className="mb-4" />

                  {/* <div className="custom-section-header text-lg font-medium mb-2">
                      <div className="custom-section-line-left"></div>
                      <h3 className="custom-section-title">
                        Información Bancaria
                      </h3>
                      <div className="custom-section-line-right"></div>
                    </div> */}

                  <div className={`space-y-6 custom-content-section`}>
                    <div>
                      <h4
                        className={
                          "custom-field-label font-medium text-sm text-gray-500 dark:text-gray-400"
                        }
                      >
                        CLABE
                      </h4>
                      <div className="flex items-center mt-1">
                        <div
                          className={
                            "custom-field-value grow p-3 rounded-l-md bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                          }
                        >
                          {decodedData.informacionBancaria.clabe}
                        </div>
                        <Button
                          variant={"default"}
                          size="icon"
                          className={
                            "h-[42px] rounded-l-none custom-copy-button"
                          }
                          onClick={() =>
                            copyToClipboard(
                              decodedData.informacionBancaria.clabe,
                              "clabe",
                            )
                          }
                        >
                          {copiedItems.clabe ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>

                    <div>
                      <h4
                        className={
                          "font-medium text-sm text-gray-500 dark:text-gray-400 custom-field-label"
                        }
                      >
                        Nombre del Beneficiario
                      </h4>
                      <div className="flex items-center mt-1">
                        <div
                          className={
                            "grow p-3 rounded-l-md bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 custom-field-value"
                          }
                        >
                          {decodedData.informacionBancaria.nombreBeneficiario}
                        </div>
                        <Button
                          variant={"default"}
                          size="icon"
                          className={
                            "custom-copy-button h-[42px] rounded-l-none"
                          }
                          onClick={() =>
                            copyToClipboard(
                              decodedData.informacionBancaria
                                .nombreBeneficiario,
                              "nombreBeneficiario",
                            )
                          }
                        >
                          {copiedItems.nombreBeneficiario ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* {isGarageStyle && (
                  <div className="custom-footer">
                    <div className="custom-footer-decoration">
                      <div className="custom-footer-line-left"></div>
                      <div className="custom-footer-star">★</div>
                      <div className="custom-footer-line-right"></div>
                    </div>
                  </div>
                )} */}
              </div>
            ) : (
              <div
                className={`flex justify-center items-center h-40 custom-loading`}
              >
                <p>Cargando datos...</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
