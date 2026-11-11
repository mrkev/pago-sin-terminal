"use server";

import { createClient, getCurrentUser } from "@/lib/supabase/server";
import {
  type EditorForm,
  formToPageRow,
  savedPageFormSchema,
} from "@/lib/saved-page";

export type SaveResult =
  | { ok: true; slug: string }
  | { ok: false; field?: keyof EditorForm; message: string };

/** Creates or updates the signed-in user's page. */
export async function savePage(input: unknown): Promise<SaveResult> {
  // The client validates too, but never trust it.
  const parsed = savedPageFormSchema.safeParse(input);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return {
      ok: false,
      field: issue?.path[0] as keyof EditorForm | undefined,
      message: issue?.message ?? "Revisa los datos.",
    };
  }

  const user = await getCurrentUser();
  if (!user) {
    return {
      ok: false,
      message: "Tu sesión terminó. Vuelve a iniciar sesión.",
    };
  }

  // RLS limits this to the user's own row; owner_id is unique, so this
  // creates the page the first time and updates it after.
  const supabase = await createClient();
  const { error } = await supabase
    .from("pages")
    .upsert(formToPageRow(parsed.data, user.id), { onConflict: "owner_id" });

  if (error) {
    if (error.code === "23505" && error.message.includes("pages_slug_key")) {
      return {
        ok: false,
        field: "slug",
        message: "Ese enlace ya lo está usando alguien más.",
      };
    }
    console.error("savePage failed", error);
    return { ok: false, message: "No pudimos guardar. Intenta de nuevo." };
  }

  return { ok: true, slug: parsed.data.slug };
}
