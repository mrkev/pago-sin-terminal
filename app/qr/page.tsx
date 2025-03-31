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
import { useEffect, useState } from "react";

interface DecodedData {
  encabezado: string;
  informacionBancaria: {
    clabe: string;
    nombreBeneficiario: string;
  };
  estilo?: "neutral" | "garage";
}

export default function QRPage() {
  const searchParams = useSearchParams();
  const [decodedData, setDecodedData] = useState<DecodedData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedItems, setCopiedItems] = useState<{ [key: string]: boolean }>({
    clabe: false,
    nombreBeneficiario: false,
  });
  const base64String = searchParams.get("q");

  useEffect(() => {
    if (!base64String) {
      setError("No se proporcionó ningún código para decodificar");
      return;
    }

    try {
      // Decode base64 to JSON string
      const jsonString = atob(base64String);
      // Parse JSON string to object
      const data = JSON.parse(jsonString) as DecodedData;
      setDecodedData(data);
    } catch (err) {
      setError("Error al decodificar los datos. El formato no es válido.");
      console.error(err);
    }
  }, [base64String]);

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
  const isGarageStyle = decodedData?.estilo === "garage";

  console.log(decodedData);

  return (
    <div className={`min-h-screen custom-page`}>
      {isGarageStyle && (
        <link rel="stylesheet" href="/garage.css" precedence="default" />
      )}
      <div className="container mx-auto py-10">
        {isGarageStyle && (
          <div className="custom-header max-w-2xl mx-auto mb-6 text-center">
            <h1 className="custom-title">
              {decodedData?.encabezado || "Detalles del Pago"}
            </h1>
            <div className="custom-title-decoration">
              <div className="custom-line-left"></div>
              <div className="custom-star">✯</div>
              <div className="custom-line-center"></div>
              <div className="custom-star">✯</div>
              <div className="custom-line-right"></div>
            </div>
          </div>
        )}

        <Card
          className={`max-w-2xl mx-auto ${isGarageStyle ? "custom-card" : ""}`}
        >
          {!isGarageStyle && (
            <CardHeader>
              <CardTitle>
                {decodedData ? decodedData.encabezado : "Detalles del Pago"}
              </CardTitle>
              <CardDescription>
                Utilice los datos en esta página para hacer su pago por
                transferencia
              </CardDescription>
            </CardHeader>
          )}

          <CardContent className={"custom-card-content"}>
            {error ? (
              <Alert variant={"destructive"} className={"custom-alert"}>
                <AlertTitle
                  className={isGarageStyle ? "custom-alert-title" : ""}
                >
                  Error
                </AlertTitle>
                <AlertDescription className={"custom-alert-description"}>
                  {error}
                </AlertDescription>
              </Alert>
            ) : decodedData ? (
              <div className="space-y-6">
                {isGarageStyle && (
                  <p className="custom-subtitle">
                    Utilice los datos en esta página para hacer su pago por
                    transferencia
                  </p>
                )}

                <div>
                  {isGarageStyle ? (
                    <div className="custom-section-header">
                      <div className="custom-section-line-left"></div>
                      <h3 className="custom-section-title">
                        Información Bancaria
                      </h3>
                      <div className="custom-section-line-right"></div>
                    </div>
                  ) : (
                    <>
                      <h3 className="text-lg font-medium mb-2">
                        Información Bancaria
                      </h3>
                      <Separator className="mb-4" />
                    </>
                  )}

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
                            "custom-field-value flex-grow p-3 rounded-l-md bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
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
                            "flex-grow p-3 rounded-l-md bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 custom-field-value"
                          }
                        >
                          {decodedData.informacionBancaria.nombreBeneficiario}
                        </div>
                        <Button
                          variant={"default"}
                          size="icon"
                          className={
                            isGarageStyle
                              ? "custom-copy-button"
                              : "h-[42px] rounded-l-none"
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
