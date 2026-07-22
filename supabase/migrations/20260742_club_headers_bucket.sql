-- Bucket público para imágenes de cabecera de clubs. Los archivos viven bajo
-- "<user_id>/...". La URL pública se guarda en clubs.cover_url (columna ya existente).
-- Ejecutar una vez.

insert into storage.buckets (id, name, public)
values ('club-headers', 'club-headers', true)
on conflict (id) do update set public = true;

drop policy if exists "Club headers are publicly readable" on storage.objects;
create policy "Club headers are publicly readable"
on storage.objects
for select
using (bucket_id = 'club-headers');

drop policy if exists "Authenticated users can upload club headers" on storage.objects;
create policy "Authenticated users can upload club headers"
on storage.objects
for insert
to authenticated
with check (
    bucket_id = 'club-headers'
    and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Users can update own club headers" on storage.objects;
create policy "Users can update own club headers"
on storage.objects
for update
to authenticated
using (
    bucket_id = 'club-headers'
    and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
    bucket_id = 'club-headers'
    and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Users can delete own club headers" on storage.objects;
create policy "Users can delete own club headers"
on storage.objects
for delete
to authenticated
using (
    bucket_id = 'club-headers'
    and (storage.foldername(name))[1] = auth.uid()::text
);
