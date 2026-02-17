-- Add onboarding fields to profiles table
alter table public.profiles
add column if not exists birth_date date,
add column if not exists reader_type text,
add column if not exists favorite_genres jsonb default '[]'::jsonb,
add column if not exists goals jsonb default '[]'::jsonb;

-- Update RLS policies (optional, but good practice to ensure users can update these)
-- (Existing update policy usually allows 'own' rows, which covers these new columns automatically if using standard policies)
