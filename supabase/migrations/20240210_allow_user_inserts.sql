-- Allow authenticated users to insert authors
create policy "Authenticated users can insert authors"
on public.authors for insert
with check ( auth.role() = 'authenticated' );

-- Allow authenticated users to insert books
create policy "Authenticated users can insert books"
on public.books for insert
with check ( auth.role() = 'authenticated' );
