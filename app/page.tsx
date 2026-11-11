import { AuthProvider } from "@/components/auth/auth-provider";
import { getCurrentUser } from "@/lib/supabase/server";

import { Editor } from "./editor";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [user, params] = await Promise.all([getCurrentUser(), searchParams]);

  return (
    <AuthProvider user={user} linkFailed={params.auth_error !== undefined}>
      <Editor />
    </AuthProvider>
  );
}
