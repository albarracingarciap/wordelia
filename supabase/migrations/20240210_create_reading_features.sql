
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
