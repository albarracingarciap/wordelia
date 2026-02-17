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
