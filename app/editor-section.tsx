"use client";

import { Lock } from "lucide-react";

import { useAuth } from "@/components/auth/auth-provider";
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";

/** One collapsible section of the editor. */
export function EditorSection({
  value,
  title,
  description,
  locked = false,
  optional = false,
  children,
}: {
  value: string;
  title: string;
  description: string;
  /** Needs an account; shows a badge and a sign-up prompt. */
  locked?: boolean;
  /** Free but not needed; shows an "Opcional" badge. */
  optional?: boolean;
  children: React.ReactNode;
}) {
  return (
    <AccordionItem value={value} className="rounded-xl border last:border-b">
      <AccordionTrigger className="items-center px-4 py-3 hover:no-underline">
        <div className="flex flex-1 items-center justify-between gap-3">
          <div>
            <div className="text-base font-medium">{title}</div>
            <div className="text-xs font-normal text-muted-foreground">
              {description}
            </div>
          </div>
          {optional && !locked && (
            <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs font-normal text-muted-foreground">
              Opcional
            </span>
          )}
          {locked && (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs font-normal text-muted-foreground">
              <Lock className="size-3" aria-hidden />
              Con cuenta
            </span>
          )}
        </div>
      </AccordionTrigger>
      <AccordionContent className="space-y-6 px-4 pt-2 pb-4">
        {locked ? <LockedContent>{children}</LockedContent> : children}
      </AccordionContent>
    </AccordionItem>
  );
}

/**
 * Shows what a locked section offers, non-interactive. Signed out, it
 * prompts to sign up or log in; signed in, it says the feature is coming.
 */
function LockedContent({ children }: { children: React.ReactNode }) {
  const { user, openSignIn } = useAuth();

  return (
    <>
      <div
        inert
        className="pointer-events-none space-y-4 opacity-60 select-none"
      >
        {children}
      </div>
      {user ? (
        <p className="rounded-lg bg-muted/60 p-4 text-center text-sm">
          Muy pronto. Ya tienes cuenta, así que lo verás aquí en cuanto esté
          listo.
        </p>
      ) : (
        <div className="flex flex-col items-center gap-3 rounded-lg bg-muted/60 p-4 text-center sm:flex-row sm:justify-between sm:text-left">
          <p className="text-sm">Crea una cuenta para desbloquear esto.</p>
          <div className="flex shrink-0 gap-2">
            <Button
              type="button"
              size="sm"
              onClick={() => openSignIn("signup")}
            >
              Crear cuenta
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => openSignIn("login")}
            >
              Iniciar sesión
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
