"use client";

import { useRouter } from "next/navigation";
import { createContext, useContext, useState } from "react";

import { createClient } from "@/lib/supabase/client";

import { type SignInMode, SignInDialog } from "./sign-in-dialog";

export type User = { id: string; email?: string };

type Auth = {
  user: User | null;
  openSignIn: (mode?: SignInMode) => void;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<Auth | null>(null);

/**
 * Makes the signed-in user (read on the server) available to the editor and
 * lets any component open the sign-in dialog.
 */
export function AuthProvider({
  user,
  children,
}: {
  user: User | null;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [dialog, setDialog] = useState<{ open: boolean; mode: SignInMode }>({
    open: false,
    mode: "login",
  });

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
        onOpenChange={(open) => setDialog((d) => ({ ...d, open }))}
        // Re-render server components with the new session.
        onSignedIn={() => router.refresh()}
      />
    </AuthContext.Provider>
  );
}

export function useAuth(): Auth {
  const auth = useContext(AuthContext);
  if (!auth) throw new Error("useAuth must be used inside <AuthProvider>");
  return auth;
}
