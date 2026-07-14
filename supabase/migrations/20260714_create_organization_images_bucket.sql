-- Public bucket for bookstore logos/covers. Files live under "<user_id>/...".
insert into storage.buckets (id, name, public)
values ('organization-images', 'organization-images', true)
on conflict (id) do update set public = true;

drop policy if exists "Organization images are publicly readable" on storage.objects;
create policy "Organization images are publicly readable"
on storage.objects
for select
using (bucket_id = 'organization-images');

drop policy if exists "Authenticated users can upload organization images" on storage.objects;
create policy "Authenticated users can upload organization images"
on storage.objects
for insert
to authenticated
with check (
    bucket_id = 'organization-images'
    and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Users can update own organization images" on storage.objects;
create policy "Users can update own organization images"
on storage.objects
for update
to authenticated
using (
    bucket_id = 'organization-images'
    and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
    bucket_id = 'organization-images'
    and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Users can delete own organization images" on storage.objects;
create policy "Users can delete own organization images"
on storage.objects
for delete
to authenticated
using (
    bucket_id = 'organization-images'
    and (storage.foldername(name))[1] = auth.uid()::text
);
