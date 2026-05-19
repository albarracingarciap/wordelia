-- Storage bucket for gift recipient profile photos.

insert into storage.buckets (id, name, public)
values ('gift-recipient-avatars', 'gift-recipient-avatars', true)
on conflict (id) do update set public = true;

drop policy if exists "Gift recipient avatars are publicly readable" on storage.objects;
create policy "Gift recipient avatars are publicly readable"
on storage.objects
for select
using (bucket_id = 'gift-recipient-avatars');

drop policy if exists "Users can upload own gift recipient avatars" on storage.objects;
create policy "Users can upload own gift recipient avatars"
on storage.objects
for insert
to authenticated
with check (
    bucket_id = 'gift-recipient-avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Users can update own gift recipient avatars" on storage.objects;
create policy "Users can update own gift recipient avatars"
on storage.objects
for update
to authenticated
using (
    bucket_id = 'gift-recipient-avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
    bucket_id = 'gift-recipient-avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Users can delete own gift recipient avatars" on storage.objects;
create policy "Users can delete own gift recipient avatars"
on storage.objects
for delete
to authenticated
using (
    bucket_id = 'gift-recipient-avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
);
