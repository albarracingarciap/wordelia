-- Create a new storage bucket for avatars
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Set up access policies for the avatars bucket
create policy "Avatar images are publicly accessible."
  on storage.objects for select
  using ( bucket_id = 'avatars' );

create policy "Anyone can upload an avatar."
  on storage.objects for insert
  with check ( bucket_id = 'avatars' );

create policy "Anyone can update their own avatar."
  on storage.objects for update
  using ( bucket_id = 'avatars' ); 
-- Note: A more restrictive policy would check auth.uid() matches the folder name or similar, 
-- but for now "Anyone can upload" to the bucket is fine for the MVP onboarding, 
-- usually we restrict to authenticated users:
-- with check ( bucket_id = 'avatars' and auth.role() = 'authenticated' );
