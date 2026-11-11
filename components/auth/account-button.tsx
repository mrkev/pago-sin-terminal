"use client";

import { Button } from "@/components/ui/button";

import { useAuth } from "./auth-provider";

/** "Iniciar sesión" when signed out; the user's email and "Salir" when in. */
export function AccountButton() {
  const { user, openSignIn, signOut } = useAuth();

  if (!user) {
    return (
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => openSignIn("login")}
      >
        Iniciar sesión
      </Button>
    );
  }

  return (
    <div className="flex min-w-0 items-center gap-1">
      <span
        className="hidden max-w-40 truncate text-sm text-muted-foreground sm:inline"
        title={user.email}
      >
        {user.email}
      </span>
      <Button type="button" variant="ghost" size="sm" onClick={signOut}>
        Salir
      </Button>
    </div>
  );
}
