"use client";

import type { AuthError } from "@supabase/supabase-js";
import { MailCheck } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

const GENERIC_ERROR = "Algo salió mal. Intenta de nuevo en un momento.";

/** Supabase only lets you request a new email this often. */
const RESEND_COOLDOWN_SECONDS = 60;

export type SignInMode = "signup" | "login";

type Step = { name: "email" } | { name: "sent"; email: string };

/**
 * Passwordless sign-in: we email a link that signs the user in. The same
 * flow creates the account the first time, so "sign up" and "log in" differ
 * only in wording.
 *
 * TODO(email): switch to one-time codes once custom SMTP is set up; see
 * docs/pending-setup.md.
 */
export function SignInDialog({
  open,
  mode,
  error: initialError,
  onOpenChange,
}: {
  open: boolean;
  mode: SignInMode;
  /** Shown on the email step, e.g. when a sign-in link didn't work. */
  error?: string;
  onOpenChange: (open: boolean) => void;
}) {
  const [step, setStep] = useState<Step>({ name: "email" });

  function handleOpenChange(next: boolean) {
    // Start over next time it opens.
    if (!next) setStep({ name: "email" });
    onOpenChange(next);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>
            {step.name === "sent"
              ? "Revisa tu correo"
              : mode === "signup"
                ? "Crea tu cuenta"
                : "Inicia sesión"}
          </DialogTitle>
          <DialogDescription>
            {step.name === "email"
              ? "Te mandamos un enlace a tu correo para entrar. No necesitas contraseña."
              : `Te mandamos un enlace a ${step.email}.`}
          </DialogDescription>
        </DialogHeader>
        {step.name === "email" ? (
          <EmailStep
            initialError={initialError}
            onSent={(email) => setStep({ name: "sent", email })}
          />
        ) : (
          <SentStep
            email={step.email}
            onBack={() => setStep({ name: "email" })}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function EmailStep({
  initialError,
  onSent,
}: {
  initialError?: string;
  onSent: (email: string) => void;
}) {
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(initialError ?? null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const address = email.trim();
    try {
      const { error } = await sendLink(address);
      if (error) setError(sendErrorMessage(error));
      else onSent(address);
    } catch {
      setError(GENERIC_ERROR);
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="sign-in-email">Correo</Label>
        <Input
          id="sign-in-email"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="tu@correo.com"
          required
          autoFocus
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Enviando…" : "Enviar enlace"}
      </Button>
    </form>
  );
}

function SentStep({ email, onBack }: { email: string; onBack: () => void }) {
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN_SECONDS);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timeout = setTimeout(() => setCooldown((s) => s - 1), 1000);
    return () => clearTimeout(timeout);
  }, [cooldown]);

  async function resend() {
    setError(null);
    setCooldown(RESEND_COOLDOWN_SECONDS);
    try {
      const { error } = await sendLink(email);
      if (error) setError(sendErrorMessage(error));
    } catch {
      setError(GENERIC_ERROR);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 rounded-lg bg-muted/60 p-4 text-sm">
        <MailCheck className="mt-0.5 size-5 shrink-0" aria-hidden />
        <p>
          Abre el enlace en este mismo navegador para entrar. Lo que escribiste
          aquí se queda guardado.
        </p>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex justify-between text-sm">
        <Button type="button" variant="link" className="px-0" onClick={onBack}>
          Usar otro correo
        </Button>
        <Button
          type="button"
          variant="link"
          className="px-0"
          disabled={cooldown > 0}
          onClick={resend}
        >
          {cooldown > 0 ? `Reenviar en ${cooldown}s` : "Reenviar enlace"}
        </Button>
      </div>
    </div>
  );
}

function sendLink(email: string) {
  return createClient().auth.signInWithOtp({
    email,
    options: {
      // Creates the account on first sign-in.
      shouldCreateUser: true,
      emailRedirectTo: `${window.location.origin}/auth/callback`,
    },
  });
}

function sendErrorMessage(error: AuthError): string {
  switch (error.code) {
    case "over_email_send_rate_limit":
    case "over_request_rate_limit":
      return "Pediste muchos correos. Espera un momento e intenta de nuevo.";
    case "email_address_invalid":
      return "Revisa tu correo, parece que no es válido.";
    case "email_address_not_authorized":
      // Supabase's built-in email only sends to the project's team.
      return "Todavía no podemos mandar correos a esta dirección.";
    default:
      return GENERIC_ERROR;
  }
}
