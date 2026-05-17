create table if not exists public.user_book_emotions (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references public.profiles(id) on delete cascade,
    book_id uuid not null references public.books(id) on delete cascade,
    user_book_id uuid references public.user_books(id) on delete set null,
    emotion text not null check (
        emotion in (
            'asombro',
            'tristeza',
            'enojo',
            'miedo',
            'alegria',
            'disgusto',
            'empatia',
            'confusion',
            'esperanza'
        )
    ),
    intensity integer not null default 3 check (intensity between 1 and 5),
    note text,
    current_page integer,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists idx_user_book_emotions_user_book
on public.user_book_emotions (user_id, book_id, created_at desc);

alter table public.user_book_emotions enable row level security;

drop policy if exists "Users can read own book emotions" on public.user_book_emotions;
create policy "Users can read own book emotions"
on public.user_book_emotions
for select
using (user_id = auth.uid());

drop policy if exists "Users can create own book emotions" on public.user_book_emotions;
create policy "Users can create own book emotions"
on public.user_book_emotions
for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "Users can update own book emotions" on public.user_book_emotions;
create policy "Users can update own book emotions"
on public.user_book_emotions
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "Users can delete own book emotions" on public.user_book_emotions;
create policy "Users can delete own book emotions"
on public.user_book_emotions
for delete
to authenticated
using (user_id = auth.uid());
