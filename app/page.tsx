import { AuthProvider } from "@/components/auth/auth-provider";
import { getCurrentUser } from "@/lib/supabase/server";

import { Editor } from "./editor";

export default async function Home() {
  const user = await getCurrentUser();

  return (
    <AuthProvider user={user}>
      <Editor />
    </AuthProvider>
  );
}
