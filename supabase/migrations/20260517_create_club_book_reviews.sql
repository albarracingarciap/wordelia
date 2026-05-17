create table if not exists public.club_book_reviews (
    id uuid primary key default uuid_generate_v4(),
    club_id uuid not null references public.clubs(id) on delete cascade,
    club_book_id uuid not null references public.club_books(id) on delete cascade,
    book_id uuid not null references public.books(id) on delete cascade,
    user_id uuid not null references public.profiles(id) on delete cascade,
    rating integer not null check (rating between 1 and 5),
    conclusion text not null default '',
    highlight text not null default '',
    created_at timestamp with time zone not null default timezone('utc'::text, now()),
    updated_at timestamp with time zone not null default timezone('utc'::text, now()),
    unique (club_book_id, user_id)
);

alter table public.club_book_reviews enable row level security;

drop policy if exists "Club members can view collective reviews" on public.club_book_reviews;
create policy "Club members can view collective reviews"
on public.club_book_reviews
for select
using (
    exists (
        select 1
        from public.club_members
        where club_members.club_id = club_book_reviews.club_id
          and club_members.user_id = auth.uid()
          and club_members.role <> 'pending'
    )
);

drop policy if exists "Club members can add own collective review" on public.club_book_reviews;
create policy "Club members can add own collective review"
on public.club_book_reviews
for insert
with check (
    user_id = auth.uid()
    and exists (
        select 1
        from public.club_members
        where club_members.club_id = club_book_reviews.club_id
          and club_members.user_id = auth.uid()
          and club_members.role <> 'pending'
    )
    and exists (
        select 1
        from public.club_books
        where club_books.id = club_book_reviews.club_book_id
          and club_books.club_id = club_book_reviews.club_id
          and club_books.book_id = club_book_reviews.book_id
    )
);

drop policy if exists "Club members can update own collective review" on public.club_book_reviews;
create policy "Club members can update own collective review"
on public.club_book_reviews
for update
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "Club members can delete own collective review" on public.club_book_reviews;
create policy "Club members can delete own collective review"
on public.club_book_reviews
for delete
using (user_id = auth.uid());
