create table if not exists public.club_checkpoint_emotions (
    id uuid primary key default gen_random_uuid(),
    club_id uuid not null references public.clubs(id) on delete cascade,
    club_book_id uuid not null references public.club_books(id) on delete cascade,
    book_id uuid not null references public.books(id) on delete cascade,
    user_id uuid not null references public.profiles(id) on delete cascade,
    checkpoint_index integer not null,
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
    is_note_public boolean not null default true,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique (club_book_id, user_id, checkpoint_index)
);

create index if not exists idx_club_checkpoint_emotions_checkpoint
on public.club_checkpoint_emotions (club_id, club_book_id, checkpoint_index);

create index if not exists idx_club_checkpoint_emotions_user
on public.club_checkpoint_emotions (user_id, club_book_id);

alter table public.club_checkpoint_emotions enable row level security;

drop policy if exists "Club members can read checkpoint emotions" on public.club_checkpoint_emotions;
create policy "Club members can read checkpoint emotions"
on public.club_checkpoint_emotions
for select
using (
    exists (
        select 1
        from public.club_members
        where club_members.club_id = club_checkpoint_emotions.club_id
          and club_members.user_id = auth.uid()
          and club_members.role <> 'pending'
    )
);

drop policy if exists "Club members can create own checkpoint emotions" on public.club_checkpoint_emotions;
create policy "Club members can create own checkpoint emotions"
on public.club_checkpoint_emotions
for insert
to authenticated
with check (
    user_id = auth.uid()
    and exists (
        select 1
        from public.club_members
        where club_members.club_id = club_checkpoint_emotions.club_id
          and club_members.user_id = auth.uid()
          and club_members.role <> 'pending'
    )
);

drop policy if exists "Club members can update own checkpoint emotions" on public.club_checkpoint_emotions;
create policy "Club members can update own checkpoint emotions"
on public.club_checkpoint_emotions
for update
to authenticated
using (user_id = auth.uid())
with check (
    user_id = auth.uid()
    and exists (
        select 1
        from public.club_members
        where club_members.club_id = club_checkpoint_emotions.club_id
          and club_members.user_id = auth.uid()
          and club_members.role <> 'pending'
    )
);

drop policy if exists "Club members can delete own checkpoint emotions" on public.club_checkpoint_emotions;
create policy "Club members can delete own checkpoint emotions"
on public.club_checkpoint_emotions
for delete
to authenticated
using (user_id = auth.uid());
