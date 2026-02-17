-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Profiles Table
create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text,
  username text unique,
  full_name text,
  avatar_url text,
  website text,
  onboarding_completed boolean default false,
  banner_color text default 'bg-teal-dark',
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone,

  constraint username_length check (char_length(username) >= 3)
);

-- RLS for Profiles
alter table public.profiles enable row level security;

create policy "Public profiles are viewable by everyone."
  on public.profiles for select
  using ( true );

create policy "Users can insert their own profile."
  on public.profiles for insert
  with check ( auth.uid() = id );

create policy "Users can update own profile."
  on public.profiles for update
  using ( auth.uid() = id );

-- Trigger to create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 2. Authors Table
create table public.authors (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  bio text,
  photo_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS for Authors (Read-only for now, admin updates later)
alter table public.authors enable row level security;
create policy "Authors are viewable by everyone." on public.authors for select using ( true );

-- 3. Books Table
create table public.books (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  author_id uuid references public.authors(id),
  cover_url text,
  description text,
  isbn text,
  page_count integer,
  published_date date,
  genome_data jsonb, -- For "ADN Literario" traits
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS for Books
alter table public.books enable row level security;
create policy "Books are viewable by everyone." on public.books for select using ( true );

-- 4. User Books (Reading Status)
create type public.reading_status as enum ('WANT_TO_READ', 'READING', 'READ', 'DNF');

create table public.user_books (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  book_id uuid references public.books(id) on delete cascade not null,
  status public.reading_status not null,
  rating integer check (rating >= 1 and rating <= 5),
  review text,
  start_date date,
  finish_date date,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  unique(user_id, book_id) -- Prevent duplicate entries for same book
);

-- RLS for User Books
alter table public.user_books enable row level security;

create policy "Users can view their own book statuses."
  on public.user_books for select
  using ( auth.uid() = user_id );

create policy "Users can insert their own book statuses."
  on public.user_books for insert
  with check ( auth.uid() = user_id );

create policy "Users can update their own book statuses."
  on public.user_books for update
  using ( auth.uid() = user_id );

create policy "Users can delete their own book statuses."
  on public.user_books for delete
  using ( auth.uid() = user_id );

-- 5. Lists
create table public.lists (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  description text,
  is_public boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS for Lists
alter table public.lists enable row level security;

create policy "Public lists are viewable by everyone."
  on public.lists for select
  using ( is_public = true or auth.uid() = user_id );

create policy "Users can insert their own lists."
  on public.lists for insert
  with check ( auth.uid() = user_id );

create policy "Users can update their own lists."
  on public.lists for update
  using ( auth.uid() = user_id );

create policy "Users can delete their own lists."
  on public.lists for delete
  using ( auth.uid() = user_id );

-- 6. List Items
create table public.list_items (
  id uuid default uuid_generate_v4() primary key,
  list_id uuid references public.lists(id) on delete cascade not null,
  book_id uuid references public.books(id) on delete cascade not null,
  added_at timestamp with time zone default timezone('utc'::text, now()) not null,

  unique(list_id, book_id)
);

-- RLS for List Items (Inherits access from Lists usually, but simplified here)
alter table public.list_items enable row level security;

create policy "List items are viewable if list is viewable."
  on public.list_items for select
  using ( exists (
    select 1 from public.lists
    where id = list_items.list_id
    and (is_public = true or user_id = auth.uid())
  ));

create policy "Users can manage items in their own lists."
  on public.list_items for all
  using ( exists (
    select 1 from public.lists
    where id = list_items.list_id
    and user_id = auth.uid()
  ));


-- MIGRATIONS


-- 20240210_add_current_page.sql


-- Add current_page column to user_books
alter table public.user_books 
add column current_page integer default 0;

-- 20240210_add_language_to_books.sql

-- Add language column to books table
ALTER TABLE public.books 
ADD COLUMN IF NOT EXISTS language text;

-- 20240210_add_onboarding_fields.sql

-- Add onboarding fields to profiles table
alter table public.profiles
add column if not exists birth_date date,
add column if not exists reader_type text,
add column if not exists favorite_genres jsonb default '[]'::jsonb,
add column if not exists goals jsonb default '[]'::jsonb;

-- Update RLS policies (optional, but good practice to ensure users can update these)
-- (Existing update policy usually allows 'own' rows, which covers these new columns automatically if using standard policies)

-- 20240210_add_paused_status.sql

-- Migration: Add PAUSED status to reading_status enum

-- 1. Add 'PAUSED' value to the enum type
ALTER TYPE public.reading_status ADD VALUE IF NOT EXISTS 'PAUSED';

-- Note: This change allows the 'PAUSED' status to be used in the user_books table immediately.

-- 20240210_add_publisher_to_books.sql

-- Add publisher column to books table
ALTER TABLE public.books 
ADD COLUMN IF NOT EXISTS publisher text;

-- 20240210_add_updated_at_to_user_books.sql

-- Add updated_at column to user_books table
ALTER TABLE public.user_books 
ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone default timezone('utc'::text, now());

-- 20240210_allow_user_inserts.sql

-- Allow authenticated users to insert authors
create policy "Authenticated users can insert authors"
on public.authors for insert
with check ( auth.role() = 'authenticated' );

-- Allow authenticated users to insert books
create policy "Authenticated users can insert books"
on public.books for insert
with check ( auth.role() = 'authenticated' );

-- 20240210_create_reading_features.sql


-- Create reading_sessions table
create table public.reading_sessions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  book_id uuid references public.books(id) not null,
  start_time timestamp with time zone not null,
  end_time timestamp with time zone,
  duration_seconds integer,
  pages_read integer,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create book_notes table
create table public.book_notes (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  book_id uuid references public.books(id) not null,
  content text not null,
  page_number integer,
  chapter text,
  is_private boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS Policies
alter table public.reading_sessions enable row level security;
alter table public.book_notes enable row level security;

create policy "Users can view their own reading sessions"
  on public.reading_sessions for select
  using (auth.uid() = user_id);

create policy "Users can insert their own reading sessions"
  on public.reading_sessions for insert
  with check (auth.uid() = user_id);

create policy "Users can view their own notes"
  on public.book_notes for select
  using (auth.uid() = user_id);

create policy "Users can insert their own notes"
  on public.book_notes for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own notes"
  on public.book_notes for update
  using (auth.uid() = user_id);

create policy "Users can delete their own notes"
  on public.book_notes for delete
  using (auth.uid() = user_id);

-- 20240210_create_storage_bucket.sql

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

-- 20240211_add_current_page.sql

-- Add current_page column to user_books table
ALTER TABLE public.user_books 
ADD COLUMN IF NOT EXISTS current_page integer DEFAULT 0;

-- 20240212_create_reviews_table.sql

-- Create reviews table
create table public.reviews (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references public.profiles(id) on delete cascade not null,
    book_id uuid references public.books(id) on delete cascade not null,
    rating integer check (rating >= 1 and rating <= 5),
    content text,
    type text check (type in ('STANDARD', 'FIRST_IMPRESSIONS')) default 'STANDARD',
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique(user_id, book_id)
);

-- Enable RLS
alter table public.reviews enable row level security;

-- Policies
create policy "Reviews are viewable by everyone"
    on public.reviews for select
    using (true);

create policy "Users can insert their own reviews"
    on public.reviews for insert
    with check (auth.uid() = user_id);

create policy "Users can update their own reviews"
    on public.reviews for update
    using (auth.uid() = user_id);

create policy "Users can delete their own reviews"
    on public.reviews for delete
    using (auth.uid() = user_id);

-- 20240213_add_spoiler_preference.sql

-- Add spoiler_preference to profiles table
alter table public.profiles
add column if not exists spoiler_preference boolean default false; -- false = hide spoilers by default

-- 20240213_badge_logic_update.sql

-- Update function to include Streak Logic
create or replace function public.check_user_badges(target_user_id uuid)
returns void
language plpgsql
security definer
as $$
declare
  badge_record record;
  user_stats record;
  current_val integer;
  max_streak integer;
begin
  -- 1. Books Read
  select count(*) as books_read into user_stats from public.user_books where user_id = target_user_id and status = 'READ';
  
  -- 2. Reviews written
  select count(*) as reviews_written from public.user_books where user_id = target_user_id and review is not null and length(review) > 10;
  
  -- 3. Calculate Longest Streak
  with daily_sessions as (
    select distinct date_trunc('day', created_at)::date as session_date
    from public.reading_sessions
    where user_id = target_user_id
  ),
  groups as (
    select
      session_date,
      session_date - (row_number() over (order by session_date) * interval '1 day') as grp
    from daily_sessions
  )
  select count(*) into max_streak
  from groups
  group by grp
  order by count(*) desc
  limit 1;
  
  -- Default to 0 if null
  if max_streak is null then max_streak := 0; end if;
  
  -- Iterate through all badges
  for badge_record in select * from public.badges loop
    -- Skip if already earned
    if exists (select 1 from public.user_badges where user_id = target_user_id and badge_id = badge_record.id) then
      continue;
    end if;
    
    -- Check criteria
    current_val := 0;
    
    if badge_record.criteria->>'type' = 'books_read' then
      current_val := user_stats.books_read;
    elsif badge_record.criteria->>'type' = 'reviews_count' then
        select count(*) into current_val from public.user_books where user_id = target_user_id and review is not null and length(review) > 10;
    elsif badge_record.criteria->>'type' = 'streak_days' then
      current_val := max_streak;
    end if;
    
    -- Award if threshold met
    if current_val >= (badge_record.criteria->>'threshold')::integer then
      insert into public.user_badges (user_id, badge_id) values (target_user_id, badge_record.id);
    end if;
    
  end loop;
end;
$$;

-- Add Trigger for Reading Sessions to update badges too
create or replace function public.trigger_check_badges_session()
returns trigger
language plpgsql
as $$
begin
  perform public.check_user_badges(new.user_id);
  return new;
end;
$$;

create trigger on_reading_session_created
  after insert
  on public.reading_sessions
  for each row
  execute procedure public.trigger_check_badges_session();

-- 20240213_create_badges.sql

-- Create Badges Table
create table if not exists public.badges (
  id uuid default uuid_generate_v4() primary key,
  slug text unique not null,
  name text not null,
  description text not null,
  category text not null, -- 'volume', 'streak', 'exploration', 'social', 'special'
  icon_name text not null, -- Phosphor/Lucide icon name or emoji
  criteria jsonb not null, -- Flexible criteria definition e.g. { "type": "books_read", "count": 10 }
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create User Badges Table (Join Table)
create table if not exists public.user_badges (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  badge_id uuid references public.badges(id) on delete cascade not null,
  awarded_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  unique(user_id, badge_id) -- User can only earn a badge once
);

-- RLS
alter table public.badges enable row level security;
create policy "Badges are viewable by everyone." on public.badges for select using ( true );

alter table public.user_badges enable row level security;
create policy "User badges are viewable by everyone." on public.user_badges for select using ( true );

-- Seed Data (Initial Badges)
insert into public.badges (slug, name, description, category, icon_name, criteria) values
  ('raton_biblioteca', 'Ratón de Biblioteca', 'Leer 10 libros', 'volume', 'Mouse', '{"type": "books_read", "threshold": 10}'),
  ('devoralibros', 'Devoralibros', 'Leer 50 libros', 'volume', 'Cookie', '{"type": "books_read", "threshold": 50}'),
  ('bibliotecario_mayor', 'Bibliotecario Mayor', 'Leer 100 libros', 'volume', 'Library', '{"type": "books_read", "threshold": 100}'),
  
  ('lector_diario', 'Lector Diario', 'Leer 3 días seguidos', 'streak', 'Sun', '{"type": "streak_days", "threshold": 3}'),
  ('semana_literaria', 'Semana Literaria', 'Leer 7 días seguidos', 'streak', 'CalendarCheck', '{"type": "streak_days", "threshold": 7}'),
  ('habito_acero', 'Hábito de Acero', 'Leer 30 días seguidos', 'streak', 'Shield', '{"type": "streak_days", "threshold": 30}'),
  
  ('explorador_mundos', 'Explorador de Mundos', 'Leer libros de 3 géneros diferentes', 'exploration', 'Compass', '{"type": "genres_count", "threshold": 3}'),
  
  ('critico_literario', 'Crítico Literario', 'Escribir tu primera reseña', 'social', 'PenTool', '{"type": "reviews_count", "threshold": 1}'),
  ('influencer', 'Influencer', 'Escribir 10 reseñas', 'social', 'Megaphone', '{"type": "reviews_count", "threshold": 10}')
on conflict (slug) do nothing;

-- Function to check and award badges
-- This function can be called by triggers or manually
create or replace function public.check_user_badges(target_user_id uuid)
returns void
language plpgsql
security definer
as $$
declare
  badge_record record;
  user_stats record;
  current_val integer;
begin
  -- Configurable stats gathering
  -- 1. Books Read
  select count(*) as books_read into user_stats from public.user_books where user_id = target_user_id and status = 'READ';
  
  -- 2. Reviews written
  select count(*) as reviews_written from public.user_books where user_id = target_user_id and review is not null and length(review) > 10;
  
  -- 3. Genres (Approximate via distinct genres in future, for now simple placeholder logic or needs join with books)
  -- select count(distinct ...) ...
  
  -- Iterate through all badges
  for badge_record in select * from public.badges loop
    -- Skip if already earned
    if exists (select 1 from public.user_badges where user_id = target_user_id and badge_id = badge_record.id) then
      continue;
    end if;
    
    -- Check criteria
    current_val := 0;
    
    if badge_record.criteria->>'type' = 'books_read' then
      current_val := user_stats.books_read;
    elsif badge_record.criteria->>'type' = 'reviews_count' then
      -- Re-query if needed or use variable
      select count(*) into current_val from public.user_books where user_id = target_user_id and review is not null and length(review) > 10;
    end if;
    
    -- Award if threshold met
    if current_val >= (badge_record.criteria->>'threshold')::integer then
      insert into public.user_badges (user_id, badge_id) values (target_user_id, badge_record.id);
    end if;
    
  end loop;
end;
$$;

-- Trigger for User Books changes (Finish book, write review)
create or replace function public.trigger_check_badges()
returns trigger
language plpgsql
as $$
begin
  perform public.check_user_badges(new.user_id);
  return new;
end;
$$;

create trigger on_user_books_change
  after insert or update
  on public.user_books
  for each row
  execute procedure public.trigger_check_badges();

-- 20240213_debug_badges.sql

-- Debug script to check badge assignment logic
do $$
declare
  -- Replace with specific user ID if known, or pick one with reviews
  target_user_id uuid; 
  review_count integer;
  badge_exists boolean;
begin
  -- Get a user who has written a review
  select user_id into target_user_id from public.reviews limit 1;
  
  if target_user_id is not null then
    -- Count reviews
    select count(*) into review_count from public.reviews where user_id = target_user_id;
    raise notice 'User % has % reviews total', target_user_id, review_count;
    
    -- Count reviews > 10 chars
    select count(*) into review_count from public.reviews where user_id = target_user_id and length(content) > 10;
     raise notice 'User % has % reviews > 10 chars', target_user_id, review_count;
     
    -- Check if badge awarded
    select exists (
      select 1 
      from public.user_badges ub
      join public.badges b on b.id = ub.badge_id
      where ub.user_id = target_user_id and b.slug = 'critico_literario'
    ) into badge_exists;
    
    raise notice 'Badge awarded: %', badge_exists;
    
    -- Force check
    perform public.check_user_badges(target_user_id);
    
  else
    raise notice 'No users with reviews found';
  end if;
end;
$$;

-- 20240213_extend_profiles.sql

-- Add extended profile fields
alter table public.profiles
add column if not exists bio text,
add column if not exists location text,
add column if not exists pronouns text,
-- website already exists in schema.sql but making sure
add column if not exists website text,
add column if not exists reading_format_preference text, -- 'physical', 'ebook', 'audio'
add column if not exists story_complexity_preference integer check (story_complexity_preference >= 1 and story_complexity_preference <= 5),
add column if not exists engagement_elements jsonb default '[]'::jsonb, -- Array of strings
add column if not exists notification_settings jsonb default '{
  "email_reading_reminders": true,
  "push_reading_reminders": true,
  "email_recommendations": true,
  "push_recommendations": false,
  "email_social": false,
  "push_social": true,
  "email_achievements": true,
  "push_achievements": true
}'::jsonb,
add column if not exists privacy_settings jsonb default '{
  "profile_visibility": "public",
  "show_name_photo": true,
  "show_location": true,
  "show_recent_reads": true,
  "show_stats": true
}'::jsonb;

-- 20240213_fix_badge_error.sql

-- Fix error in check_user_badges function (remove dangling SELECT)
create or replace function public.check_user_badges(target_user_id uuid)
returns void
language plpgsql
security definer
as $$
declare
  badge_record record;
  user_stats record;
  current_val integer;
  max_streak integer;
begin
  -- 1. Books Read
  select count(*) as books_read into user_stats from public.user_books where user_id = target_user_id and status = 'READ';
  
  -- 2. Reviews written (Removed dangling select, logic moved inside loop)
  
  -- 3. Calculate Longest Streak
  with daily_sessions as (
    select distinct date_trunc('day', created_at)::date as session_date
    from public.reading_sessions
    where user_id = target_user_id
  ),
  groups as (
    select
      session_date,
      session_date - (row_number() over (order by session_date) * interval '1 day') as grp
    from daily_sessions
  )
  select count(*) into max_streak
  from groups
  group by grp
  order by count(*) desc
  limit 1;
  
  -- Default to 0 if null
  if max_streak is null then max_streak := 0; end if;
  
  -- Iterate through all badges
  for badge_record in select * from public.badges loop
    -- Skip if already earned
    if exists (select 1 from public.user_badges where user_id = target_user_id and badge_id = badge_record.id) then
      continue;
    end if;
    
    -- Check criteria
    current_val := 0;
    
    if badge_record.criteria->>'type' = 'books_read' then
      current_val := user_stats.books_read;
    elsif badge_record.criteria->>'type' = 'reviews_count' then
        select count(*) into current_val from public.user_books where user_id = target_user_id and review is not null and length(review) > 10;
    elsif badge_record.criteria->>'type' = 'streak_days' then
      current_val := max_streak;
    end if;
    
    -- Award if threshold met
    if current_val >= (badge_record.criteria->>'threshold')::integer then
      insert into public.user_badges (user_id, badge_id) values (target_user_id, badge_record.id);
    end if;
    
  end loop;
end;
$$;

-- 20240213_fix_json_casting.sql

-- Fix JSONB casting in check_user_badges
create or replace function public.check_user_badges(target_user_id uuid)
returns void
language plpgsql
security definer
as $$
declare
  badge_record record;
  user_stats record;
  current_val integer;
  max_streak integer;
  threshold_val integer;
begin
  -- 1. Books Read
  select count(*) as books_read into user_stats from public.user_books where user_id = target_user_id and status = 'READ';
  
  -- 2. Calculate Longest Streak
  with daily_sessions as (
    select distinct date_trunc('day', created_at)::date as session_date
    from public.reading_sessions
    where user_id = target_user_id
  ),
  groups as (
    select
      session_date,
      session_date - (row_number() over (order by session_date) * interval '1 day') as grp
    from daily_sessions
  )
  select count(*) into max_streak
  from groups
  group by grp
  order by count(*) desc
  limit 1;
  
  -- Default to 0 if null
  if max_streak is null then max_streak := 0; end if;
  
  -- Iterate through all badges
  for badge_record in select * from public.badges loop
    -- Skip if already earned
    if exists (select 1 from public.user_badges where user_id = target_user_id and badge_id = badge_record.id) then
      continue;
    end if;
    
    -- Check criteria
    current_val := 0;
    
    -- Safely cast threshold to integer
    begin
        threshold_val := (badge_record.criteria->>'threshold')::integer;
    exception when others then
        threshold_val := 999999; -- Fail safe if invalid json
    end;

    if badge_record.criteria->>'type' = 'books_read' then
      current_val := user_stats.books_read;
      
    elsif badge_record.criteria->>'type' = 'reviews_count' then
        -- Count ALL reviews, length > 0
        select count(*) into current_val from public.reviews where user_id = target_user_id and length(content) > 0;
        
    elsif badge_record.criteria->>'type' = 'streak_days' then
      current_val := max_streak;
      
    elsif badge_record.criteria->>'type' = 'genres_count' then
       -- Placeholder for now
       current_val := 0;
    end if;
    
    -- Award if threshold met
    if current_val >= threshold_val then
      insert into public.user_badges (user_id, badge_id) values (target_user_id, badge_record.id);
    end if;
    
  end loop;
end;
$$;

-- 20240213_fix_reviews_logic.sql

-- Fix check_user_badges to query reviews table instead of user_books
create or replace function public.check_user_badges(target_user_id uuid)
returns void
language plpgsql
security definer
as $$
declare
  badge_record record;
  user_stats record;
  current_val integer;
  max_streak integer;
begin
  -- 1. Books Read
  select count(*) as books_read into user_stats from public.user_books where user_id = target_user_id and status = 'READ';
  
  -- 2. Calculate Longest Streak
  with daily_sessions as (
    select distinct date_trunc('day', created_at)::date as session_date
    from public.reading_sessions
    where user_id = target_user_id
  ),
  groups as (
    select
      session_date,
      session_date - (row_number() over (order by session_date) * interval '1 day') as grp
    from daily_sessions
  )
  select count(*) into max_streak
  from groups
  group by grp
  order by count(*) desc
  limit 1;
  
  -- Default to 0 if null
  if max_streak is null then max_streak := 0; end if;
  
  -- Iterate through all badges
  for badge_record in select * from public.badges loop
    -- Skip if already earned
    if exists (select 1 from public.user_badges where user_id = target_user_id and badge_id = badge_record.id) then
      continue;
    end if;
    
    -- Check criteria
    current_val := 0;
    
    if badge_record.criteria->>'type' = 'books_read' then
      current_val := user_stats.books_read;
    elsif badge_record.criteria->>'type' = 'reviews_count' then
        -- CORRECTED: Query public.reviews table
        select count(*) into current_val from public.reviews where user_id = target_user_id and length(content) > 10;
    elsif badge_record.criteria->>'type' = 'streak_days' then
      current_val := max_streak;
    end if;
    
    -- Award if threshold met
    if current_val >= (badge_record.criteria->>'threshold')::integer then
      insert into public.user_badges (user_id, badge_id) values (target_user_id, badge_record.id);
    end if;
    
  end loop;
end;
$$;

-- Add Trigger for Reviews table
create or replace function public.trigger_check_badges_reviews()
returns trigger
language plpgsql
as $$
begin
  if (TG_OP = 'DELETE') then
      perform public.check_user_badges(old.user_id);
      return old;
  else
      perform public.check_user_badges(new.user_id);
      return new;
  end if;
end;
$$;

drop trigger if exists on_review_change on public.reviews;

create trigger on_review_change
  after insert or update or delete
  on public.reviews
  for each row
  execute procedure public.trigger_check_badges_reviews();

-- 20240213_force_fix_badges.sql

-- 1. Ensure function is robust (Fixing JSON casting again to be sure)
create or replace function public.check_user_badges(target_user_id uuid)
returns void
language plpgsql
security definer -- IMPORTANT: bypassing RLS
as $$
declare
  badge_record record;
  user_stats record;
  current_val integer;
  max_streak integer;
  threshold_val integer;
  reviews_found integer;
begin
  -- 1. Books Read
  select count(*) as books_read into user_stats from public.user_books where user_id = target_user_id and status = 'READ';
  
  -- 2. Calculate Longest Streak
  with daily_sessions as (
    select distinct date_trunc('day', created_at)::date as session_date
    from public.reading_sessions
    where user_id = target_user_id
  ),
  groups as (
    select
      session_date,
      session_date - (row_number() over (order by session_date) * interval '1 day') as grp
    from daily_sessions
  )
  select count(*) into max_streak
  from groups
  group by grp
  order by count(*) desc
  limit 1;
  
  if max_streak is null then max_streak := 0; end if;
  
  -- Iterate through all badges
  for badge_record in select * from public.badges loop
    -- Skip if already earned
    if exists (select 1 from public.user_badges where user_id = target_user_id and badge_id = badge_record.id) then
      continue;
    end if;
    
    current_val := 0;
    
    -- Robust JSON extraction
    begin
        threshold_val := (badge_record.criteria->>'threshold')::integer;
    exception when others then
        threshold_val := 999;
    end;

    if badge_record.criteria->>'type' = 'books_read' then
      current_val := user_stats.books_read;
      
    elsif badge_record.criteria->>'type' = 'reviews_count' then
        -- Count reviews for user (ANY length > 0)
        select count(*) into reviews_found from public.reviews where user_id = target_user_id and length(content) > 0;
        current_val := reviews_found;
        
    elsif badge_record.criteria->>'type' = 'streak_days' then
      current_val := max_streak;
    end if;
    
    if current_val >= threshold_val then
      insert into public.user_badges (user_id, badge_id) values (target_user_id, badge_record.id);
    end if;
    
  end loop;
end;
$$;

-- 2. Force execution for ALL users immediately
do $$
declare
  user_rec record;
begin
  for user_rec in select id from auth.users loop
    perform public.check_user_badges(user_rec.id);
  end loop;
end;
$$;

-- 20240213_profile_polish.sql

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

-- 20240213_relax_review_check.sql

-- Relax review length constraint for badges
create or replace function public.check_user_badges(target_user_id uuid)
returns void
language plpgsql
security definer
as $$
declare
  badge_record record;
  user_stats record;
  current_val integer;
  max_streak integer;
begin
  -- 1. Books Read
  select count(*) as books_read into user_stats from public.user_books where user_id = target_user_id and status = 'READ';
  
  -- 2. Calculate Longest Streak (Unchanged)
  with daily_sessions as (
    select distinct date_trunc('day', created_at)::date as session_date
    from public.reading_sessions
    where user_id = target_user_id
  ),
  groups as (
    select
      session_date,
      session_date - (row_number() over (order by session_date) * interval '1 day') as grp
    from daily_sessions
  )
  select count(*) into max_streak
  from groups
  group by grp
  order by count(*) desc
  limit 1;
  
  -- Default to 0 if null
  if max_streak is null then max_streak := 0; end if;
  
  -- Iterate through all badges
  for badge_record in select * from public.badges loop
    -- Skip if already earned
    if exists (select 1 from public.user_badges where user_id = target_user_id and badge_id = badge_record.id) then
      continue;
    end if;
    
    -- Check criteria
    current_val := 0;
    
    if badge_record.criteria->>'type' = 'books_read' then
      current_val := user_stats.books_read;
    elsif badge_record.criteria->>'type' = 'reviews_count' then
        -- CORRECTED: Count ALL reviews, including First Impressions, with minimal length check
        -- Try to be inclusive: length > 0
        select count(*) into current_val from public.reviews where user_id = target_user_id and length(content) > 0;
    elsif badge_record.criteria->>'type' = 'streak_days' then
      current_val := max_streak;
    end if;
    
    -- Award if threshold met
    if current_val >= (badge_record.criteria->>'threshold')::integer then
      insert into public.user_badges (user_id, badge_id) values (target_user_id, badge_record.id);
    end if;
    
  end loop;
end;
$$;
