"use client";

import { useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useState } from "react";

import { createClient } from "@/lib/supabase/client";

import { type SignInMode, SignInDialog } from "./sign-in-dialog";

export type User = { id: string; email?: string };

type Auth = {
  user: User | null;
  openSignIn: (mode?: SignInMode) => void;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<Auth | null>(null);

const LINK_ERROR =
  "Ese enlace ya no funciona: venció, ya se usó o se abrió en otro navegador. Pide uno nuevo.";

/**
 * Makes the signed-in user (read on the server) available to the editor and
 * lets any component open the sign-in dialog.
 */
export function AuthProvider({
  user,
  linkFailed = false,
  children,
}: {
  user: User | null;
  /** The user arrived from a sign-in link that didn't work. */
  linkFailed?: boolean;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [dialog, setDialog] = useState<{
    open: boolean;
    mode: SignInMode;
    error?: string;
  }>(
    linkFailed
      ? { open: true, mode: "login", error: LINK_ERROR }
      : { open: false, mode: "login" },
  );

  // Drop ?auth_error from the address bar so a reload doesn't repeat it.
  useEffect(() => {
    if (linkFailed) router.replace("/", { scroll: false });
  }, [linkFailed, router]);

  const auth: Auth = {
    user,
    openSignIn: (mode = "login") => setDialog({ open: true, mode }),
    async signOut() {
      await createClient().auth.signOut();
      router.refresh();
    },
  };

  return (
    <AuthContext.Provider value={auth}>
      {children}
      <SignInDialog
        open={dialog.open}
        mode={dialog.mode}
        error={dialog.error}
        onOpenChange={(open) => setDialog((d) => ({ ...d, open }))}
      />
    </AuthContext.Provider>
  );
}

export function useAuth(): Auth {
  const auth = useContext(AuthContext);
  if (!auth) throw new Error("useAuth must be used inside <AuthProvider>");
  return auth;
}
