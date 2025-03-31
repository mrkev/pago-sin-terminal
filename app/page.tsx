"use client";

import { useState, useRef } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import QRCode from "react-qr-code";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Download, FileText } from "lucide-react";

const formSchema = z.object({
  encabezado: z.string().min(1, { message: "El encabezado es requerido" }),
  clabe: z
    .string()
    .length(18, { message: "La CLABE debe tener exactamente 18 dígitos" })
    .regex(/^\d+$/, { message: "La CLABE solo debe contener números" }),
  nombreBeneficiario: z
    .string()
    .max(80, { message: "El nombre no puede exceder 80 caracteres" })
    .regex(/^[a-zA-Z0-9\s]+$/, {
      message: "El nombre no debe contener caracteres especiales",
    })
    .min(1, { message: "El nombre del beneficiario es requerido" }),
  estilo: z.enum(["neutral", "garage"]).default("neutral"),
});

export default function Home() {
  const [qrValue, setQrValue] = useState<string | null>(null);
  const qrRef = useRef<HTMLDivElement>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      encabezado: "",
      clabe: "",
      nombreBeneficiario: "",
      estilo: "neutral",
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    const jsonData = {
      encabezado: values.encabezado,
      informacionBancaria: {
        clabe: values.clabe,
        nombreBeneficiario: values.nombreBeneficiario,
      },
      estilo: values.estilo,
    };

    // Convert to JSON string and then to base64
    const jsonString = JSON.stringify(jsonData);
    const base64 = btoa(jsonString);

    // Create QR code URL
    const qrUrl = `${window.location.origin}/qr?q=${encodeURIComponent(
      base64
    )}`;
    setQrValue(qrUrl);
  }

  const fillExampleData = () => {
    form.setValue("encabezado", "Cafe Ejemplar");
    form.setValue("clabe", "000000000000000000");
    form.setValue("nombreBeneficiario", "Kevin Chavez");
    form.setValue("estilo", "neutral");
  };

  const downloadQRCode = () => {
    if (!qrRef.current) return;

    // Create a canvas element
    const canvas = document.createElement("canvas");
    const svg = qrRef.current.querySelector("svg");

    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Fill with white background
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.drawImage(img, 0, 0);

      // Create download link
      const link = document.createElement("a");
      link.download = "qr-code.png";
      link.href = canvas.toDataURL("image/png");
      link.click();
    };

    img.src = `data:image/svg+xml;base64,${btoa(svgData)}`;
  };

  return (
    <div className="container mx-auto py-10">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Pago Sin Terminal</CardTitle>
              <CardDescription>
                Ingrese la información requerida para generar el código QR de
                pago
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fillExampleData}
              className="flex items-center gap-2"
            >
              <FileText className="h-4 w-4" />
              Ejemplo
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <FormField
                control={form.control}
                name="encabezado"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Encabezado</FormLabel>
                    <FormControl>
                      <Input placeholder="Ingrese el encabezado" {...field} />
                    </FormControl>
                    <FormDescription>
                      Puede ser el nombre de su negocio, o cualquier título que
                      guste
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div>
                <h3 className="text-lg font-medium mb-4">
                  Información Bancaria
                </h3>
                <Separator className="mb-4" />

                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="clabe"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CLABE</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Ingrese los 18 dígitos de la CLABE"
                            maxLength={18}
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Debe contener exactamente 18 dígitos numéricos
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="nombreBeneficiario"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre del Beneficiario</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Ingrese el nombre del beneficiario"
                            maxLength={80}
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Máximo 80 caracteres, sin caracteres especiales
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div style={{ display: "none" }}>
                <h3 className="text-lg font-medium mb-4">Estilo</h3>
                <Separator className="mb-4" />

                <FormField
                  control={form.control}
                  name="estilo"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="flex flex-col space-y-1"
                        >
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="neutral" />
                            </FormControl>
                            <FormLabel className="font-normal">
                              Neutral
                            </FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="garage" />
                            </FormControl>
                            <FormLabel className="font-normal">
                              Garage
                            </FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Button type="submit" className="w-full">
                Generar Código QR
              </Button>
            </form>
          </Form>
        </CardContent>

        {qrValue && (
          <CardFooter className="flex flex-col items-center">
            <Separator className="mb-4 w-full" />
            <div className="p-4 bg-white rounded-lg" ref={qrRef}>
              <QRCode value={qrValue} size={200} />
            </div>
            <div className="mt-4 flex flex-col items-center gap-2">
              <p className="text-sm text-muted-foreground text-center max-w-md">
                Utilice este código QR para compartir sus detalles de pago.
                Descárguelo, mándelo, imprímalo, etc.
              </p>
              <div className="flex gap-4 mt-2">
                <a
                  href={qrValue}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline text-sm flex items-center"
                >
                  Vista Previa
                </a>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={downloadQRCode}
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Descargar QR
                </Button>
              </div>
            </div>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}
