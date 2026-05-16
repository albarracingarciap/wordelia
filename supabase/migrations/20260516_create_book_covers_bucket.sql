insert into storage.buckets (id, name, public)
values ('book-covers', 'book-covers', true)
on conflict (id) do update set public = true;

drop policy if exists "Book covers are publicly readable" on storage.objects;
create policy "Book covers are publicly readable"
on storage.objects
for select
using (bucket_id = 'book-covers');

drop policy if exists "Authenticated users can upload book covers" on storage.objects;
create policy "Authenticated users can upload book covers"
on storage.objects
for insert
to authenticated
with check (
    bucket_id = 'book-covers'
    and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Users can update own book covers" on storage.objects;
create policy "Users can update own book covers"
on storage.objects
for update
to authenticated
using (
    bucket_id = 'book-covers'
    and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
    bucket_id = 'book-covers'
    and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Users can delete own book covers" on storage.objects;
create policy "Users can delete own book covers"
on storage.objects
for delete
to authenticated
using (
    bucket_id = 'book-covers'
    and (storage.foldername(name))[1] = auth.uid()::text
);
