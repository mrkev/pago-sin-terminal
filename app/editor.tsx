"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Check, ImageIcon, TriangleAlert } from "lucide-react";
import { useEffect, useState, useSyncExternalStore } from "react";
import { type FieldErrors, useForm, useWatch } from "react-hook-form";

import { AccountButton } from "@/components/auth/account-button";
import { useAuth } from "@/components/auth/auth-provider";
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
import { brandingUrl } from "@/lib/branding";
import { COMMON_BANK_CODES, cuentaBankName, tipoCuenta } from "@/lib/cuenta";
import { DEFAULT_ESTILO, ESTILOS, ESTILO_INFO } from "@/lib/estilos";
import {
  formToLink,
  paymentFormSchema,
  paymentPagePath,
} from "@/lib/payment-page";
import {
  EMPTY_EDITOR_FORM,
  type EditorForm,
  anonEditorSchema,
  editorSnapshot,
  savedPageFormSchema,
} from "@/lib/saved-page";
import { suggestSlug, toSlugInput } from "@/lib/slug";
import { SOCIALS, SOCIAL_INFO, normalizeHandle } from "@/lib/socials";
import { cn } from "@/lib/utils";
import { normalizeMxPhone } from "@/lib/whatsapp";

import { savePage } from "./actions";
import { BrandingField } from "./branding-field";
import { EditorSection } from "./editor-section";
import { Result } from "./result";

const ALL_BANKS = Object.entries(BANKS).sort(([, a], [, b]) =>
  a.localeCompare(b, "es"),
);

const DRAFT_KEY = "clabe-club:draft";

function loadDraft(): EditorForm | null {
  try {
    const raw = JSON.parse(localStorage.getItem(DRAFT_KEY) ?? "null");
    if (!raw || typeof raw !== "object") return null;
    // Only take known string fields; ignore anything else stored there.
    const draft = { ...EMPTY_EDITOR_FORM };
    for (const key of Object.keys(EMPTY_EDITOR_FORM) as (keyof EditorForm)[]) {
      if (typeof raw[key] === "string")
        Object.assign(draft, { [key]: raw[key] });
    }
    if (!ESTILOS.includes(draft.estilo)) draft.estilo = DEFAULT_ESTILO;
    return draft;
  } catch {
    // Storage can be unavailable (private mode, blocked site data).
    return null;
  }
}

function saveDraft(values: Partial<EditorForm>) {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(values));
  } catch {
    // Same as above: a draft is a convenience, not a requirement.
  }
}

/** Sections open by default: everything that works without an account. */
const DEFAULT_OPEN_SECTIONS = ["datos", "estilo"];

/** Which section each field lives in, to open it when it has an error. */
const FIELD_SECTION: Record<keyof EditorForm, string> = {
  titulo: "datos",
  cuenta: "datos",
  banco: "datos",
  nombre: "datos",
  estilo: "estilo",
  whatsapp: "comprobante",
  instagram: "redes",
  tiktok: "redes",
  facebook: "redes",
  slug: "enlace",
  logo: "marca",
  fondo: "marca",
};

const noopSubscribe = () => () => {};

/**
 * The page editor: everything on the home page. Signed out, it builds a
 * free link that carries the data. Signed in, it saves the page to the
 * account, served at a short link.
 */
export function Editor({ savedPage }: { savedPage: EditorForm | null }) {
  const { user } = useAuth();
  const form = useForm<EditorForm>({
    resolver: zodResolver(user ? savedPageFormSchema : anonEditorSchema),
    defaultValues: savedPage ?? EMPTY_EDITOR_FORM,
  });
  const values = useWatch({ control: form.control });

  // Keep a draft in this browser so nothing is lost when, for example, a
  // sign-in link opens the editor in a new tab. Restore runs first, before
  // the save below overwrites the stored draft. A saved page wins.
  useEffect(() => {
    if (savedPage) return;
    const draft = loadDraft();
    if (draft) form.reset(draft);
  }, [form, savedPage]);
  useEffect(() => saveDraft(values), [values]);

  const host = useSyncExternalStore(
    noopSubscribe,
    () => window.location.host,
    () => "clabe.vercel.app",
  );

  // Signed in: what's saved, and whether the form has changed since.
  const [saved, setSaved] = useState(
    savedPage
      ? {
          slug: savedPage.slug,
          logo: savedPage.logo,
          fondo: savedPage.fondo,
          snapshot: editorSnapshot(savedPage),
        }
      : null,
  );
  const [justSaved, setJustSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const hasUnsavedChanges =
    saved !== null && editorSnapshot(values) !== saved.snapshot;
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

  const [openSections, setOpenSections] = useState(
    user ? [...DEFAULT_OPEN_SECTIONS, "enlace"] : DEFAULT_OPEN_SECTIONS,
  );

  function openSectionsFor(fields: (keyof EditorForm)[]) {
    const sections = fields.map((field) => FIELD_SECTION[field]);
    setOpenSections((open) => [...new Set([...open, ...sections])]);
    if (fields[0]) requestAnimationFrame(() => form.setFocus(fields[0]));
  }

  async function onSubmit(data: EditorForm) {
    if (!user) {
      setGeneratedPath(paymentPagePath(formToLink(data)));
      return;
    }
    setSaveError(null);
    const result = await savePage(data);
    if (result.ok) {
      setSaved({
        slug: result.slug,
        logo: data.logo,
        fondo: data.fondo,
        snapshot: editorSnapshot(data),
      });
      setJustSaved(true);
    } else if (result.field) {
      form.setError(result.field, { message: result.message });
      openSectionsFor([result.field]);
    } else {
      setSaveError(result.message);
    }
  }

  // Errors can be in a collapsed section: open it and focus the field.
  function onInvalid(errors: FieldErrors<EditorForm>) {
    openSectionsFor(Object.keys(errors) as (keyof EditorForm)[]);
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
                locked={!user}
                optional={!!user}
              >
                {user ? (
                  <div className="grid grid-cols-2 gap-3">
                    {(["logo", "fondo"] as const).map((kind) => (
                      <FormField
                        key={kind}
                        control={form.control}
                        name={kind}
                        render={({ field }) => (
                          <FormItem>
                            <BrandingField
                              kind={kind}
                              label={kind === "logo" ? "Logo" : "Foto de fondo"}
                              userId={user.id}
                              value={field.value}
                              savedValue={saved?.[kind] ?? ""}
                              onChange={field.onChange}
                            />
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    ))}
                  </div>
                ) : (
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
                )}
              </EditorSection>

              <EditorSection
                value="redes"
                title="Redes sociales"
                description="Instagram, TikTok, Facebook"
                locked={!user}
                optional={!!user}
              >
                {SOCIALS.map((social) => (
                  <FormField
                    key={social}
                    control={form.control}
                    name={social}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{SOCIAL_INFO[social].label}</FormLabel>
                        <FormControl>
                          <div className="flex items-center rounded-md border border-input focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background">
                            <span className="pl-3 text-muted-foreground">
                              @
                            </span>
                            <Input
                              placeholder="tu-negocio"
                              autoComplete="off"
                              autoCapitalize="none"
                              className="border-0 pl-1 focus-visible:ring-0 focus-visible:ring-offset-0"
                              {...field}
                              // Accept "@handle" or a pasted profile URL.
                              onChange={(e) =>
                                field.onChange(normalizeHandle(e.target.value))
                              }
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ))}
              </EditorSection>

              <EditorSection
                value="enlace"
                title="Enlace personalizado"
                description={`${host}/${values.slug || "tu-negocio"}`}
                locked={!user}
              >
                <FormField
                  control={form.control}
                  name="slug"
                  render={({ field }) => {
                    const suggestion = suggestSlug(values.titulo ?? "");
                    const changingSavedLink =
                      saved !== null && field.value !== saved.slug;
                    return (
                      <FormItem>
                        <FormLabel>Tu enlace</FormLabel>
                        <FormControl>
                          <div className="flex items-center rounded-md border border-input focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background">
                            <span className="shrink-0 pl-3 text-sm text-muted-foreground">
                              {host}/
                            </span>
                            <Input
                              placeholder="tu-negocio"
                              autoComplete="off"
                              autoCapitalize="none"
                              maxLength={30}
                              className="min-w-0 border-0 pl-0.5 focus-visible:ring-0 focus-visible:ring-offset-0"
                              {...field}
                              onChange={(e) =>
                                field.onChange(toSlugInput(e.target.value))
                              }
                            />
                          </div>
                        </FormControl>
                        {!field.value && suggestion.length >= 3 && (
                          <Button
                            type="button"
                            variant="link"
                            size="sm"
                            className="h-auto px-0"
                            onClick={() =>
                              form.setValue("slug", suggestion, {
                                shouldValidate: true,
                              })
                            }
                          >
                            Usar {host}/{suggestion}
                          </Button>
                        )}
                        {changingSavedLink && (
                          <p className="flex items-start gap-2 text-sm text-amber-600 dark:text-amber-400">
                            <TriangleAlert
                              className="mt-0.5 size-4 shrink-0"
                              aria-hidden
                            />
                            Si cambias tu enlace, los QR que ya compartiste o
                            imprimiste dejarán de funcionar.
                          </p>
                        )}
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />
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
              logoUrl={
                user && values.logo ? brandingUrl(values.logo) : undefined
              }
              fondoUrl={
                user && values.fondo ? brandingUrl(values.fondo) : undefined
              }
              socials={
                user
                  ? {
                      instagram: values.instagram,
                      tiktok: values.tiktok,
                      facebook: values.facebook,
                    }
                  : undefined
              }
            />
          </div>
        </section>

        <div className="space-y-6 lg:col-start-1 lg:row-start-2">
          <Button
            type="submit"
            form="payment-form"
            className="w-full"
            size="lg"
            disabled={form.formState.isSubmitting}
          >
            {!user
              ? "Generar código QR"
              : form.formState.isSubmitting
                ? "Guardando…"
                : saved && !hasUnsavedChanges
                  ? "Guardado"
                  : saved
                    ? "Guardar cambios"
                    : "Guardar mi página"}
          </Button>
          {saveError && (
            <p className="text-center text-sm text-destructive">{saveError}</p>
          )}
          {user && hasUnsavedChanges && (
            <p className="text-center text-sm text-muted-foreground">
              Tienes cambios sin guardar
            </p>
          )}
          {user
            ? saved && (
                <Result
                  path={`/${saved.slug}`}
                  titulo={values.titulo}
                  autoScroll={justSaved}
                  description="Este QR abre tu página. Puedes cambiar tus datos cuando quieras: el QR sigue funcionando."
                />
              )
            : showResult && (
                <Result path={generatedPath} titulo={values.titulo} />
              )}
        </div>
      </div>
    </main>
  );
}
