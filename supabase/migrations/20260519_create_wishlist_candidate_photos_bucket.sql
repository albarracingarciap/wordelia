-- Storage bucket for cover photos captured in wishlist store mode.

insert into storage.buckets (id, name, public)
values ('wishlist-candidate-photos', 'wishlist-candidate-photos', true)
on conflict (id) do update set public = true;

drop policy if exists "Wishlist candidate photos are publicly readable" on storage.objects;
create policy "Wishlist candidate photos are publicly readable"
on storage.objects
for select
using (bucket_id = 'wishlist-candidate-photos');

drop policy if exists "Users can upload own wishlist candidate photos" on storage.objects;
create policy "Users can upload own wishlist candidate photos"
on storage.objects
for insert
to authenticated
with check (
    bucket_id = 'wishlist-candidate-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Users can update own wishlist candidate photos" on storage.objects;
create policy "Users can update own wishlist candidate photos"
on storage.objects
for update
to authenticated
using (
    bucket_id = 'wishlist-candidate-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
    bucket_id = 'wishlist-candidate-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Users can delete own wishlist candidate photos" on storage.objects;
create policy "Users can delete own wishlist candidate photos"
on storage.objects
for delete
to authenticated
using (
    bucket_id = 'wishlist-candidate-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
);
