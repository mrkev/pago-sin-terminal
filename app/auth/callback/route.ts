import { type NextRequest, NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

/**
 * Where sign-in email links land. Supabase verifies the link, then sends the
 * user here with a one-time `code` that we exchange for a session cookie.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const next = safeNext(searchParams.get("next"));

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(next, origin));
  }

  // Missing, expired, or already-used link, or opened in another browser.
  return NextResponse.redirect(new URL("/?auth_error=1", origin));
}

/** Only same-site paths, so the link can't be used to redirect elsewhere. */
function safeNext(next: string | null): string {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : "/";
}
