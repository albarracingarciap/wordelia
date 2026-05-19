-- Storage bucket for cover photos captured while preparing gift ideas.

insert into storage.buckets (id, name, public)
values ('gift-idea-photos', 'gift-idea-photos', true)
on conflict (id) do update set public = true;

drop policy if exists "Gift idea photos are publicly readable" on storage.objects;
create policy "Gift idea photos are publicly readable"
on storage.objects
for select
using (bucket_id = 'gift-idea-photos');

drop policy if exists "Users can upload own gift idea photos" on storage.objects;
create policy "Users can upload own gift idea photos"
on storage.objects
for insert
to authenticated
with check (
    bucket_id = 'gift-idea-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Users can update own gift idea photos" on storage.objects;
create policy "Users can update own gift idea photos"
on storage.objects
for update
to authenticated
using (
    bucket_id = 'gift-idea-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
    bucket_id = 'gift-idea-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Users can delete own gift idea photos" on storage.objects;
create policy "Users can delete own gift idea photos"
on storage.objects
for delete
to authenticated
using (
    bucket_id = 'gift-idea-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
);
