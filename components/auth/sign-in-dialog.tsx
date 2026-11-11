"use client";

import type { AuthError } from "@supabase/supabase-js";
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

/** Supabase only lets you request a new code this often. */
const RESEND_COOLDOWN_SECONDS = 60;

export type SignInMode = "signup" | "login";

type Step = { name: "email" } | { name: "code"; email: string };

/**
 * Passwordless sign-in: we email a one-time code and the user types it here.
 * The same flow creates the account the first time, so "sign up" and "log
 * in" differ only in wording.
 */
export function SignInDialog({
  open,
  mode,
  onOpenChange,
  onSignedIn,
}: {
  open: boolean;
  mode: SignInMode;
  onOpenChange: (open: boolean) => void;
  onSignedIn: () => void;
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
            {mode === "signup" ? "Crea tu cuenta" : "Inicia sesión"}
          </DialogTitle>
          <DialogDescription>
            {step.name === "email"
              ? "Te mandamos un código a tu correo. No necesitas contraseña."
              : `Escribe el código que mandamos a ${step.email}.`}
          </DialogDescription>
        </DialogHeader>
        {step.name === "email" ? (
          <EmailStep onSent={(email) => setStep({ name: "code", email })} />
        ) : (
          <CodeStep
            email={step.email}
            onBack={() => setStep({ name: "email" })}
            onVerified={() => {
              handleOpenChange(false);
              onSignedIn();
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function EmailStep({ onSent }: { onSent: (email: string) => void }) {
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const address = email.trim();
    try {
      const { error } = await sendCode(address);
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
        {pending ? "Enviando…" : "Enviar código"}
      </Button>
    </form>
  );
}

function CodeStep({
  email,
  onBack,
  onVerified,
}: {
  email: string;
  onBack: () => void;
  onVerified: () => void;
}) {
  const [code, setCode] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN_SECONDS);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timeout = setTimeout(() => setCooldown((s) => s - 1), 1000);
    return () => clearTimeout(timeout);
  }, [cooldown]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      const { error } = await createClient().auth.verifyOtp({
        email,
        token: code,
        type: "email",
      });
      if (error) setError(verifyErrorMessage(error));
      else onVerified();
    } catch {
      setError(GENERIC_ERROR);
    } finally {
      setPending(false);
    }
  }

  async function resend() {
    setError(null);
    setCooldown(RESEND_COOLDOWN_SECONDS);
    try {
      const { error } = await sendCode(email);
      if (error) setError(sendErrorMessage(error));
    } catch {
      setError(GENERIC_ERROR);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="sign-in-code">Código</Label>
        <Input
          id="sign-in-code"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="\d{6,10}"
          maxLength={10}
          placeholder="123456"
          required
          autoFocus
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
          className="text-center font-mono text-lg tracking-[0.3em]"
        />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Verificando…" : "Entrar"}
      </Button>
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
          {cooldown > 0 ? `Reenviar en ${cooldown}s` : "Reenviar código"}
        </Button>
      </div>
    </form>
  );
}

function sendCode(email: string) {
  // Creates the account on first sign-in.
  return createClient().auth.signInWithOtp({
    email,
    options: { shouldCreateUser: true },
  });
}

function sendErrorMessage(error: AuthError): string {
  switch (error.code) {
    case "over_email_send_rate_limit":
    case "over_request_rate_limit":
      return "Pediste muchos códigos. Espera un momento e intenta de nuevo.";
    case "email_address_invalid":
      return "Revisa tu correo, parece que no es válido.";
    default:
      return "No pudimos mandar el código. Intenta de nuevo.";
  }
}

function verifyErrorMessage(error: AuthError): string {
  switch (error.code) {
    case "otp_expired":
      return "El código no es correcto o ya venció. Revísalo o pide uno nuevo.";
    case "over_request_rate_limit":
      return "Demasiados intentos. Espera un momento e intenta de nuevo.";
    default:
      return "No pudimos verificar el código. Intenta de nuevo.";
  }
}
