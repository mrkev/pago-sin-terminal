/** Supabase connection details; both are publishable (safe in the browser). */
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_PUBLISHABLE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";

/**
 * False when the env vars aren't set (e.g. a deploy before they were added).
 * Accounts are then unavailable, but the free QR maker keeps working.
 */
export const isSupabaseConfigured = Boolean(
  SUPABASE_URL && SUPABASE_PUBLISHABLE_KEY,
);
