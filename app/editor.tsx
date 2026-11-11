"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AtSign, Check, ImageIcon } from "lucide-react";
import { useState } from "react";
import { type FieldErrors, useForm, useWatch } from "react-hook-form";

import { AccountButton } from "@/components/auth/account-button";
import { PaymentCard } from "@/components/payment-card/payment-card";
import { ThemeToggle } from "@/components/theme-toggle";
import { Accordion } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
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
import { BANKS } from "@/lib/banks";
import { COMMON_BANK_CODES, cuentaBankName, tipoCuenta } from "@/lib/cuenta";
import { DEFAULT_ESTILO, ESTILOS, ESTILO_INFO } from "@/lib/estilos";
import {
  type PaymentForm,
  formToLink,
  paymentFormSchema,
  paymentPagePath,
} from "@/lib/payment-page";
import { cn } from "@/lib/utils";
import { normalizeMxPhone } from "@/lib/whatsapp";

import { EditorSection } from "./editor-section";
import { Result } from "./result";

const ALL_BANKS = Object.entries(BANKS).sort(([, a], [, b]) =>
  a.localeCompare(b, "es"),
);

/** Sections open by default: everything that works without an account. */
const DEFAULT_OPEN_SECTIONS = ["datos", "estilo"];

/** The page editor: everything on the home page. */
export function Editor() {
  const form = useForm<PaymentForm>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      titulo: "",
      cuenta: "",
      banco: "",
      nombre: "",
      whatsapp: "",
      estilo: DEFAULT_ESTILO,
    },
  });
  const values = useWatch({ control: form.control });
  const cuenta = values.cuenta ?? "";
  const tipo = tipoCuenta(cuenta);
  const bank = cuentaBankName(cuenta, values.banco);

  // The path for the current values, if they're valid. The result section
  // only shows while it matches what was generated, so editing the form
  // after generating hides a now-stale QR.
  const parsed = paymentFormSchema.safeParse(values);
  const currentPath = parsed.success
    ? paymentPagePath(formToLink(parsed.data))
    : null;
  const [generatedPath, setGeneratedPath] = useState<string | null>(null);
  const showResult = generatedPath !== null && generatedPath === currentPath;

  const [openSections, setOpenSections] = useState(DEFAULT_OPEN_SECTIONS);

  function onSubmit(data: PaymentForm) {
    setGeneratedPath(paymentPagePath(formToLink(data)));
  }

  // Errors can be in a collapsed section: open it and focus the field.
  function onInvalid(errors: FieldErrors<PaymentForm>) {
    const withErrors = Object.keys(errors).map((field) =>
      field === "whatsapp" ? "comprobante" : "datos",
    );
    setOpenSections((open) => [...new Set([...open, ...withErrors])]);
    const first = Object.keys(errors)[0] as keyof PaymentForm | undefined;
    if (first) requestAnimationFrame(() => form.setFocus(first));
  }

  function fillExampleData() {
    form.setValue("titulo", "Café Ejemplar");
    form.setValue("cuenta", "012180000000000002");
    form.setValue("nombre", "Kevin Chavez");
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-6 sm:py-10">
      <header className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">CLABE.club</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Ingresa la información que incluirá la página de tu cuenta
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <AccountButton />
          <ThemeToggle />
        </div>
      </header>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:grid-rows-[auto_1fr] lg:gap-x-12">
        <Form {...form}>
          <form
            id="payment-form"
            onSubmit={form.handleSubmit(onSubmit, onInvalid)}
            className="lg:col-start-1 lg:row-start-1"
          >
            <Accordion
              type="multiple"
              value={openSections}
              onValueChange={setOpenSections}
              className="space-y-3"
            >
              <EditorSection
                value="datos"
                title="Datos de pago"
                description="Lo que necesita quien te paga"
              >
                <div className="flex justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={fillExampleData}
                  >
                    Llenar con ejemplo
                  </Button>
                </div>

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
                          autoComplete="organization"
                          enterKeyHint="next"
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

                <FormField
                  control={form.control}
                  name="cuenta"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CLABE o tarjeta de débito</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="18 o 16 dígitos"
                          inputMode="numeric"
                          autoComplete="off"
                          enterKeyHint="next"
                          {...field}
                          // Accept pasted numbers with spaces or dashes.
                          onChange={(e) =>
                            field.onChange(
                              e.target.value.replace(/\D/g, "").slice(0, 18),
                            )
                          }
                        />
                      </FormControl>
                      <FormDescription>
                        {tipo === "clabe"
                          ? `CLABE${bank ? ` · ${bank}` : ""}`
                          : tipo === "tarjeta"
                            ? "Tarjeta de débito"
                            : "CLABE de 18 dígitos o tarjeta de débito de 16"}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {tipo === "tarjeta" && (
                  <FormField
                    control={form.control}
                    name="banco"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Banco de tu tarjeta</FormLabel>
                        <FormControl>
                          <select
                            className={cn(
                              "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 md:text-sm",
                              !field.value && "text-muted-foreground",
                            )}
                            {...field}
                          >
                            <option value="" disabled>
                              Elige tu banco
                            </option>
                            <optgroup label="Más comunes">
                              {COMMON_BANK_CODES.map((code) => (
                                <option key={code} value={code}>
                                  {BANKS[code]}
                                </option>
                              ))}
                            </optgroup>
                            <optgroup label="Todos">
                              {ALL_BANKS.map(([code, name]) => (
                                <option key={code} value={code}>
                                  {name}
                                </option>
                              ))}
                            </optgroup>
                          </select>
                        </FormControl>
                        <FormDescription>
                          Quien te pague lo necesita para transferir a una
                          tarjeta
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

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
                          autoComplete="name"
                          enterKeyHint="done"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>Máximo 80 caracteres</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </EditorSection>

              <EditorSection
                value="estilo"
                title="Estilo"
                description="Cómo se ve tu página"
              >
                <FormField
                  control={form.control}
                  name="estilo"
                  render={({ field }) => (
                    <FormItem>
                      <fieldset>
                        <legend className="sr-only">Estilo</legend>
                        <div className="grid grid-cols-3 gap-2">
                          {ESTILOS.map((estilo) => (
                            <label
                              key={estilo}
                              className="cursor-pointer rounded-lg border p-2 text-center text-sm transition-colors hover:bg-accent has-checked:border-primary has-checked:ring-2 has-checked:ring-primary has-focus-visible:ring-2 has-focus-visible:ring-ring"
                            >
                              <input
                                type="radio"
                                name={field.name}
                                value={estilo}
                                checked={field.value === estilo}
                                onChange={() => field.onChange(estilo)}
                                className="sr-only"
                              />
                              <span
                                aria-hidden
                                className="mb-2 block h-10 rounded-md border"
                                style={{
                                  background: ESTILO_INFO[estilo].swatch,
                                }}
                              />
                              {ESTILO_INFO[estilo].label}
                            </label>
                          ))}
                        </div>
                      </fieldset>
                    </FormItem>
                  )}
                />
              </EditorSection>

              <EditorSection
                value="comprobante"
                title="Comprobante por WhatsApp"
                description="Recibe los comprobantes de pago en tu WhatsApp"
                optional
              >
                <FormField
                  control={form.control}
                  name="whatsapp"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tu WhatsApp</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="10 dígitos"
                          inputMode="tel"
                          autoComplete="tel-national"
                          {...field}
                          onChange={(e) =>
                            field.onChange(normalizeMxPhone(e.target.value))
                          }
                        />
                      </FormControl>
                      <FormDescription>
                        Tu página tendrá un botón para que quien te pague te
                        mande su comprobante
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </EditorSection>

              <EditorSection
                value="marca"
                title="Tu marca"
                description="Tu logo y una foto de fondo"
                locked
              >
                <div className="grid grid-cols-2 gap-3">
                  {["Logo", "Foto de fondo"].map((label) => (
                    <div
                      key={label}
                      className="flex flex-col items-center gap-2 rounded-lg border border-dashed p-4 text-center text-sm"
                    >
                      <ImageIcon className="size-5" aria-hidden />
                      {label}
                    </div>
                  ))}
                </div>
              </EditorSection>

              <EditorSection
                value="redes"
                title="Redes sociales"
                description="Instagram, TikTok, Facebook"
                locked
              >
                {["Instagram", "TikTok", "Facebook"].map((red) => (
                  <div
                    key={red}
                    className="flex items-center rounded-md border text-sm"
                  >
                    <span className="w-28 border-r bg-muted px-3 py-2 text-muted-foreground">
                      {red}
                    </span>
                    <span className="flex items-center gap-1 px-3 py-2 text-muted-foreground">
                      <AtSign className="size-3.5" aria-hidden />
                      tu-negocio
                    </span>
                  </div>
                ))}
              </EditorSection>

              <EditorSection
                value="enlace"
                title="Enlace personalizado"
                description="clabe.club/tu-negocio"
                locked
              >
                <div className="flex items-center rounded-md border text-sm">
                  <span className="border-r bg-muted px-3 py-2 text-muted-foreground">
                    clabe.club/
                  </span>
                  <span className="px-3 py-2 text-muted-foreground">
                    tu-negocio
                  </span>
                </div>
                <ul className="space-y-1.5 text-sm">
                  {[
                    "Un enlace corto y fácil de recordar",
                    "Cambia tus datos sin reimprimir tu QR",
                  ].map((benefit) => (
                    <li key={benefit} className="flex items-center gap-2">
                      <Check className="size-4 shrink-0" aria-hidden />
                      {benefit}
                    </li>
                  ))}
                </ul>
              </EditorSection>
            </Accordion>
          </form>
        </Form>

        <section
          aria-label="Vista previa"
          className="lg:sticky lg:top-6 lg:col-start-2 lg:row-span-2 lg:row-start-1"
        >
          <h2 className="mb-2 text-sm font-medium text-muted-foreground">
            Vista previa
          </h2>
          <div className="rounded-2xl border">
            <PaymentCard
              variant="preview"
              cuenta={cuenta || "000000000000000000"}
              titulo={values.titulo || "Tu negocio"}
              nombre={values.nombre || "Tu nombre"}
              banco={values.banco}
              whatsapp={
                /^\d{10}$/.test(values.whatsapp ?? "")
                  ? values.whatsapp
                  : undefined
              }
              estilo={values.estilo}
            />
          </div>
        </section>

        <div className="space-y-6 lg:col-start-1 lg:row-start-2">
          <Button
            type="submit"
            form="payment-form"
            className="w-full"
            size="lg"
          >
            Generar código QR
          </Button>
          {showResult && <Result path={generatedPath} titulo={values.titulo} />}
        </div>
      </div>
    </main>
  );
}
