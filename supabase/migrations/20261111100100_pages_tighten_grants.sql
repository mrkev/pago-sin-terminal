-- This project still applies Supabase's legacy default grants (all
-- privileges to anon and authenticated) to new tables. Reset them so anon
-- has no table access at all and authenticated has only what RLS governs.
revoke all on public.pages from anon, authenticated;
grant select, insert, update, delete on public.pages to authenticated;
