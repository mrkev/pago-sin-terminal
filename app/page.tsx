"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Download, FileText } from "lucide-react";
import { useRef, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import QRCode from "react-qr-code";

import { ThemeToggle } from "@/components/theme-toggle";
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
import { clabeBankName } from "@/lib/clabe";
import {
  type ClabePage,
  clabePagePath,
  clabePageSchema,
} from "@/lib/clabe-page";

/** Pixel size of the QR in the downloaded PNG, not counting the margin. */
const DOWNLOAD_SIZE = 1024;
/** Blank margin around a QR code, in modules, needed for reliable scans. */
const QUIET_ZONE_MODULES = 4;

export default function Home() {
  const [qrValue, setQrValue] = useState<string | null>(null);
  const qrRef = useRef<HTMLDivElement>(null);

  const form = useForm<ClabePage>({
    resolver: zodResolver(clabePageSchema),
    defaultValues: {
      titulo: "",
      clabe: "",
      nombre: "",
    },
  });
  const clabe = useWatch({ control: form.control, name: "clabe" });
  const bank = clabeBankName(clabe);

  function onSubmit(values: ClabePage) {
    setQrValue(`${window.location.origin}${clabePagePath(values)}`);
  }

  const fillExampleData = () => {
    form.setValue("titulo", "Café Ejemplar");
    form.setValue("clabe", "012180000000000002");
    form.setValue("nombre", "Kevin Chavez");
  };

  const downloadQRCode = () => {
    const svg = qrRef.current?.querySelector("svg");
    if (!svg) return;

    // react-qr-code sets the viewBox to the QR's size in modules.
    const modules = svg.viewBox.baseVal.width;
    const margin = Math.round((DOWNLOAD_SIZE / modules) * QUIET_ZONE_MODULES);

    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = DOWNLOAD_SIZE + margin * 2;

    const img = new Image();
    img.onload = () => {
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, margin, margin, DOWNLOAD_SIZE, DOWNLOAD_SIZE);

      const link = document.createElement("a");
      link.download = "clabe-club-qr.png";
      link.href = canvas.toDataURL("image/png");
      link.click();
    };

    const svgData = new XMLSerializer().serializeToString(svg);
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgData)}`;
  };

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="max-w-2xl mx-auto mb-4 flex justify-end">
        <ThemeToggle />
      </div>
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>CLABE.club</CardTitle>
              <CardDescription>
                Ingresa la información que incluirá la página de tu CLABE
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
                name="titulo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Encabezado</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ej. Café Ejemplar"
                        maxLength={60}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Puede ser el nombre de tu negocio o cualquier título que
                      quieras
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div>
                <h3 className="text-lg font-medium mb-4">
                  Información bancaria
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
                            placeholder="Los 18 dígitos de tu CLABE"
                            inputMode="numeric"
                            autoComplete="off"
                            {...field}
                            // Accept pasted CLABEs with spaces or dashes.
                            onChange={(e) =>
                              field.onChange(
                                e.target.value.replace(/\D/g, "").slice(0, 18),
                              )
                            }
                          />
                        </FormControl>
                        <FormDescription>
                          {bank ? `Banco: ${bank}` : "18 dígitos, solo números"}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="nombre"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre del beneficiario</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Como aparece en tu banco"
                            maxLength={80}
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>Máximo 80 caracteres</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <Button type="submit" className="w-full">
                Generar código QR
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
                Este QR abre la página de tu CLABE. Descárgalo, mándalo,
                imprímelo, lo que quieras.
              </p>
              <div className="flex gap-4 mt-2">
                <a
                  href={qrValue}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline text-sm flex items-center"
                >
                  Ver página
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
