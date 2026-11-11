import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

import {
  SUPABASE_PUBLISHABLE_KEY,
  SUPABASE_URL,
  isSupabaseConfigured,
} from "@/lib/supabase/env";

/**
 * Refreshes the Supabase session on each request and passes the refreshed
 * cookies to Server Components (via the request) and the browser (via the
 * response). Server Components can't write cookies, so this is what keeps
 * users signed in.
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  if (!isSupabaseConfigured) return response;

  // If our callback URL isn't on Supabase's redirect allow list, sign-in
  // links land on the Site URL ("/") instead. Send them to the callback.
  if (
    request.nextUrl.pathname === "/" &&
    request.nextUrl.searchParams.has("code")
  ) {
    const callback = request.nextUrl.clone();
    callback.pathname = "/auth/callback";
    return NextResponse.redirect(callback);
  }

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
        // Keeps CDNs from caching a response that carries a session.
        for (const [key, value] of Object.entries(headers)) {
          response.headers.set(key, value);
        }
      },
    },
  });

  // Refreshes the token if needed. Don't run code between createServerClient
  // and this call, and always return the response built by setAll.
  await supabase.auth.getClaims();

  return response;
}

export const config = {
  matcher: [
    // Everything except payment pages (public, no session needed), Next.js
    // internals, and static files.
    "/((?!c/|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
