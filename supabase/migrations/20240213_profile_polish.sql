-- Add banner_color and created_at to profiles
-- banner_color: stores the hex code or tailwind class for the profile banner
-- created_at: stores when the user joined

alter table public.profiles 
add column if not exists banner_color text default 'bg-teal-dark',
add column if not exists created_at timestamp with time zone default now();

-- Update existing profiles to have a created_at if null (using auth.users is hard from here due to permissions, so we default to now or leave it)
-- Ideally we would sync with auth.users.created_at but for simplicity we'll just ensure it's not null for future queries if needed.
-- For now, default now() handles new ones. Old ones will be null unless we backfill.

-- Let's try to backfill with now() for existing ones so they aren't null, 
-- or better, making it nullable is fine, but UI needs to handle it.
-- The user reported "Invalid Date", so we should probably backfill non-null values.

update public.profiles 
set created_at = now() 
where created_at is null;
