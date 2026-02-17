-- Add spoiler_preference to profiles table
alter table public.profiles
add column if not exists spoiler_preference boolean default false; -- false = hide spoilers by default
