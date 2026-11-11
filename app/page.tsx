import { AuthProvider } from "@/components/auth/auth-provider";
import { pageRowToForm } from "@/lib/saved-page";
import { createClient, getCurrentUser } from "@/lib/supabase/server";

import { Editor } from "./editor";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [user, params] = await Promise.all([getCurrentUser(), searchParams]);
  const savedPage = user ? await loadSavedPage(user.id) : null;

  return (
    <AuthProvider user={user} linkFailed={params.auth_error !== undefined}>
      {/* Remount on sign in/out so the form starts from the right data. */}
      <Editor key={user?.id ?? "anon"} savedPage={savedPage} />
    </AuthProvider>
  );
}

/** The user's page, if they've saved one. RLS also limits it to them. */
async function loadSavedPage(userId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("pages")
    .select("*")
    .eq("owner_id", userId)
    .maybeSingle();
  if (error) throw error;
  return data ? pageRowToForm(data) : null;
}
