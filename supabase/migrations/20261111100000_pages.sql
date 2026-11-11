-- Saved payment pages, one per account, served at /<slug>.
--
-- Access model:
-- * Owners read and write their own row through the Data API (RLS).
-- * Everyone else reads a single page by exact slug through
--   public.page_by_slug(). The table itself isn't readable by anon, so pages
--   (which contain bank details) can't be listed or enumerated.

create schema if not exists private;

create table public.pages (
  id bigint generated always as identity primary key,
  -- One page per account; the unique index also covers the foreign key.
  owner_id uuid not null unique default auth.uid()
    references auth.users (id) on delete cascade,
  -- Short link. Lowercase letters, digits and single hyphens, 3–30 chars,
  -- starting with a letter. The app also rejects reserved words.
  slug text not null unique
    check (slug ~ '^[a-z][a-z0-9]*(-[a-z0-9]+)*$' and char_length(slug) between 3 and 30),
  titulo text not null check (char_length(titulo) between 1 and 60),
  -- 18-digit CLABE or 16-digit debit card.
  cuenta text not null check (cuenta ~ '^([0-9]{16}|[0-9]{18})$'),
  -- 3-digit bank code; only meaningful for cards.
  banco text check (banco ~ '^[0-9]{3}$'),
  nombre text not null check (char_length(nombre) between 1 and 80),
  -- 10-digit Mexican number for the receipt button.
  whatsapp text check (whatsapp ~ '^[0-9]{10}$'),
  estilo text not null default 'neutral'
    check (estilo in ('neutral', 'elegante', 'garage')),
  -- Social handles, without the @.
  instagram text check (instagram ~ '^[A-Za-z0-9._]{1,30}$'),
  tiktok text check (tiktok ~ '^[A-Za-z0-9._]{2,24}$'),
  facebook text check (facebook ~ '^[A-Za-z0-9.]{5,50}$'),
  -- Paths in the "branding" Storage bucket.
  logo_path text,
  fondo_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Keep updated_at current.
create function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger pages_set_updated_at
  before update on public.pages
  for each row execute function private.set_updated_at();

-- Row-level security: owners only.
alter table public.pages enable row level security;

grant select, insert, update, delete on public.pages to authenticated;

create policy "Owners can read their page"
  on public.pages for select
  to authenticated
  using ((select auth.uid()) = owner_id);

create policy "Owners can create their page"
  on public.pages for insert
  to authenticated
  with check ((select auth.uid()) = owner_id);

create policy "Owners can update their page"
  on public.pages for update
  to authenticated
  using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);

create policy "Owners can delete their page"
  on public.pages for delete
  to authenticated
  using ((select auth.uid()) = owner_id);

-- Public read of one page by its exact slug. SECURITY DEFINER because anon
-- has no access to the table; it returns only what the public page shows.
create function public.page_by_slug(p_slug text)
returns table (
  slug text,
  titulo text,
  cuenta text,
  banco text,
  nombre text,
  whatsapp text,
  estilo text,
  instagram text,
  tiktok text,
  facebook text,
  logo_path text,
  fondo_path text
)
language sql
stable
security definer
set search_path = ''
as $$
  select p.slug, p.titulo, p.cuenta, p.banco, p.nombre, p.whatsapp, p.estilo,
         p.instagram, p.tiktok, p.facebook, p.logo_path, p.fondo_path
  from public.pages p
  where p.slug = lower(p_slug);
$$;

revoke execute on function public.page_by_slug(text) from public;
grant execute on function public.page_by_slug(text) to anon, authenticated;
