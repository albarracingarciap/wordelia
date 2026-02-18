-- Create Clubs table
create table public.clubs (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  slug text unique,
  description text,
  cover_url text,
  invite_code text unique,
  owner_id uuid references public.profiles(id) not null,
  visibility text check (visibility in ('public', 'private')) default 'public',
  is_official boolean default false,
  is_archived boolean default false,
  price decimal(10, 2) default 0,
  currency text default 'EUR',
  tags text[] default array[]::text[],
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS for Clubs
alter table public.clubs enable row level security;
create policy "Clubs are viewable by everyone" on public.clubs for select using (true);
create policy "Users can insert their own clubs" on public.clubs for insert with check (auth.uid() = owner_id);
create policy "Owners can update their clubs" on public.clubs for update using (auth.uid() = owner_id);

-- Create Club Members table
create table public.club_members (
  id uuid default uuid_generate_v4() primary key,
  club_id uuid references public.clubs(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  role text check (role in ('admin', 'moderator', 'member')) default 'member',
  joined_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(club_id, user_id)
);

-- RLS for Club Members
alter table public.club_members enable row level security;
create policy "Club members are viewable by everyone" on public.club_members for select using (true);
create policy "Users can join clubs" on public.club_members for insert with check (auth.uid() = user_id);
create policy "Users can leave clubs" on public.club_members for delete using (auth.uid() = user_id);

-- Create Club Books table
create table public.club_books (
  id uuid default uuid_generate_v4() primary key,
  club_id uuid references public.clubs(id) on delete cascade not null,
  book_id uuid references public.books(id) on delete cascade not null,
  status text check (status in ('current', 'completed', 'planned')) default 'planned',
  start_date date,
  target_date date,
  discussion_schedule text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS for Club Books
alter table public.club_books enable row level security;
create policy "Club books are viewable by everyone" on public.club_books for select using (true);
create policy "Club admins can manage books" on public.club_books for all using (
  exists (
    select 1 from public.club_members
    where club_id = club_books.club_id
    and user_id = auth.uid()
    and role in ('admin', 'moderator')
  )
);
