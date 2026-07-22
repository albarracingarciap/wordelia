-- Imagen de cabecera del perfil de usuario: banner propio que sustituye al color
-- de portada cuando el usuario sube una imagen. Se guarda en profiles.header_image_url.
-- Ejecutar una vez.

alter table public.profiles add column if not exists header_image_url text;

-- Bucket público para las cabeceras de perfil. Archivos bajo "<user_id>/...".
insert into storage.buckets (id, name, public)
values ('profile-headers', 'profile-headers', true)
on conflict (id) do update set public = true;

drop policy if exists "Profile headers are publicly readable" on storage.objects;
create policy "Profile headers are publicly readable"
on storage.objects
for select
using (bucket_id = 'profile-headers');

drop policy if exists "Authenticated users can upload profile headers" on storage.objects;
create policy "Authenticated users can upload profile headers"
on storage.objects
for insert
to authenticated
with check (
    bucket_id = 'profile-headers'
    and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Users can update own profile headers" on storage.objects;
create policy "Users can update own profile headers"
on storage.objects
for update
to authenticated
using (
    bucket_id = 'profile-headers'
    and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
    bucket_id = 'profile-headers'
    and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Users can delete own profile headers" on storage.objects;
create policy "Users can delete own profile headers"
on storage.objects
for delete
to authenticated
using (
    bucket_id = 'profile-headers'
    and (storage.foldername(name))[1] = auth.uid()::text
);
