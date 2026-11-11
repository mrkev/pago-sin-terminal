-- Logos and background photos for saved pages.
--
-- Public bucket: payment pages show these images to anyone, by URL. Files
-- live under "<user id>/" and each user can only write in their own folder.
-- No listing for anyone else (public URLs don't need a SELECT policy).

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'branding',
  'branding',
  true,
  2097152, -- 2 MB; the app resizes images before uploading
  array['image/webp', 'image/png', 'image/jpeg']
);

create policy "Users can upload branding to their folder"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'branding'
    and (storage.foldername(name))[1] = (select auth.jwt() ->> 'sub')
  );

-- SELECT on their own folder is needed to replace and delete files.
create policy "Users can read their branding files"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'branding'
    and (storage.foldername(name))[1] = (select auth.jwt() ->> 'sub')
  );

create policy "Users can update their branding files"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'branding'
    and (storage.foldername(name))[1] = (select auth.jwt() ->> 'sub')
  )
  with check (
    bucket_id = 'branding'
    and (storage.foldername(name))[1] = (select auth.jwt() ->> 'sub')
  );

create policy "Users can delete their branding files"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'branding'
    and (storage.foldername(name))[1] = (select auth.jwt() ->> 'sub')
  );

-- A page can only point at images in its owner's folder.
alter table public.pages
  add constraint pages_logo_path_owned check (
    logo_path is null
    or logo_path ~ ('^' || owner_id::text || '/logo-[0-9]+\.(webp|png|jpg)$')
  ),
  add constraint pages_fondo_path_owned check (
    fondo_path is null
    or fondo_path ~ ('^' || owner_id::text || '/fondo-[0-9]+\.(webp|png|jpg)$')
  );
