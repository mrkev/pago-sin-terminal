"use client"

import { useSearchParams } from "next/navigation"
import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Copy, Check } from "lucide-react"

interface DecodedData {
  encabezado: string
  informacionBancaria: {
    clabe: string
    nombreBeneficiario: string
  }
  estilo?: "neutral" | "garage"
}

export default function QRPage() {
  const searchParams = useSearchParams()
  const [decodedData, setDecodedData] = useState<DecodedData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copiedItems, setCopiedItems] = useState<{ [key: string]: boolean }>({
    clabe: false,
    nombreBeneficiario: false,
  })
  const base64String = searchParams.get("q")

  useEffect(() => {
    if (!base64String) {
      setError("No se proporcionó ningún código para decodificar")
      return
    }

    try {
      // Decode base64 to JSON string
      const jsonString = atob(base64String)
      // Parse JSON string to object
      const data = JSON.parse(jsonString) as DecodedData
      setDecodedData(data)
    } catch (err) {
      setError("Error al decodificar los datos. El formato no es válido.")
      console.error(err)
    }
  }, [base64String])

  // Load garage stylesheet if needed
  useEffect(() => {
    if (decodedData?.estilo === "garage") {
      const link = document.createElement("link")
      link.rel = "stylesheet"
      link.href = "/garage.css"
      link.id = "garage-stylesheet"
      document.head.appendChild(link)

      return () => {
        const existingLink = document.getElementById("garage-stylesheet")
        if (existingLink) {
          existingLink.remove()
        }
      }
    }
  }, [decodedData?.estilo])

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text)
    setCopiedItems((prev) => ({ ...prev, [field]: true }))
    setTimeout(() => {
      setCopiedItems((prev) => ({ ...prev, [field]: false }))
    }, 2000)
  }

  // Determine if we should use the garage style
  const isGarageStyle = decodedData?.estilo === "garage"

  console.log(decodedData)

  return (
    <div className={`min-h-screen ${isGarageStyle ? "garage-page" : ""}`}>
      {isGarageStyle && <link rel="stylesheet" href="/garage.css" precedence="default" />}
      <div className="container mx-auto py-10">
        {isGarageStyle && (
          <div className="garage-header max-w-2xl mx-auto mb-6 text-center">
            <h1 className="garage-title">{decodedData?.encabezado || "Detalles del Pago"}</h1>
            <div className="garage-title-decoration">
              <div className="garage-line-left"></div>
              <div className="garage-star">✯</div>
              <div className="garage-line-center"></div>
              <div className="garage-star">✯</div>
              <div className="garage-line-right"></div>
            </div>
          </div>
        )}

        <Card className={`max-w-2xl mx-auto ${isGarageStyle ? "garage-card" : ""}`}>
          {!isGarageStyle && (
            <CardHeader>
              <CardTitle>{decodedData ? decodedData.encabezado : "Detalles del Pago"}</CardTitle>
              <CardDescription>Utilice los datos en esta página para hacer su pago por transferencia</CardDescription>
            </CardHeader>
          )}

          <CardContent className={isGarageStyle ? "garage-card-content" : ""}>
            {error ? (
              <Alert
                variant={isGarageStyle ? "default" : "destructive"}
                className={isGarageStyle ? "garage-alert" : ""}
              >
                <AlertTitle className={isGarageStyle ? "garage-alert-title" : ""}>Error</AlertTitle>
                <AlertDescription className={isGarageStyle ? "garage-alert-description" : ""}>{error}</AlertDescription>
              </Alert>
            ) : decodedData ? (
              <div className="space-y-6">
                {isGarageStyle && (
                  <p className="garage-subtitle">
                    Utilice los datos en esta página para hacer su pago por transferencia
                  </p>
                )}

                <div>
                  {isGarageStyle ? (
                    <div className="garage-section-header">
                      <div className="garage-section-line-left"></div>
                      <h3 className="garage-section-title">Información Bancaria</h3>
                      <div className="garage-section-line-right"></div>
                    </div>
                  ) : (
                    <>
                      <h3 className="text-lg font-medium mb-2">Información Bancaria</h3>
                      <Separator className="mb-4" />
                    </>
                  )}

                  <div className={`space-y-6 ${isGarageStyle ? "garage-content-section" : "space-y-4"}`}>
                    <div>
                      <h4
                        className={
                          isGarageStyle ? "garage-field-label" : "font-medium text-sm text-gray-500 dark:text-gray-400"
                        }
                      >
                        CLABE
                      </h4>
                      <div className="flex items-center mt-1">
                        <div
                          className={
                            isGarageStyle
                              ? "garage-field-value"
                              : "flex-grow p-3 rounded-l-md bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                          }
                        >
                          {decodedData.informacionBancaria.clabe}
                        </div>
                        <Button
                          variant={isGarageStyle ? "default" : "outline"}
                          size="icon"
                          className={isGarageStyle ? "garage-copy-button" : "h-[42px] rounded-l-none"}
                          onClick={() => copyToClipboard(decodedData.informacionBancaria.clabe, "clabe")}
                        >
                          {copiedItems.clabe ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>

                    <div>
                      <h4
                        className={
                          isGarageStyle ? "garage-field-label" : "font-medium text-sm text-gray-500 dark:text-gray-400"
                        }
                      >
                        Nombre del Beneficiario
                      </h4>
                      <div className="flex items-center mt-1">
                        <div
                          className={
                            isGarageStyle
                              ? "garage-field-value"
                              : "flex-grow p-3 rounded-l-md bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                          }
                        >
                          {decodedData.informacionBancaria.nombreBeneficiario}
                        </div>
                        <Button
                          variant={isGarageStyle ? "default" : "outline"}
                          size="icon"
                          className={isGarageStyle ? "garage-copy-button" : "h-[42px] rounded-l-none"}
                          onClick={() =>
                            copyToClipboard(decodedData.informacionBancaria.nombreBeneficiario, "nombreBeneficiario")
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

                {isGarageStyle && (
                  <div className="garage-footer">
                    <div className="garage-footer-decoration">
                      <div className="garage-footer-line-left"></div>
                      <div className="garage-footer-star">★</div>
                      <div className="garage-footer-line-right"></div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className={`flex justify-center items-center h-40 ${isGarageStyle ? "garage-loading" : ""}`}>
                <p>Cargando datos...</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

