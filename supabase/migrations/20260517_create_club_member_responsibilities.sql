create table if not exists public.club_member_responsibilities (
    id uuid primary key default gen_random_uuid(),
    club_id uuid not null references public.clubs(id) on delete cascade,
    user_id uuid not null references public.profiles(id) on delete cascade,
    responsibility text not null check (
        responsibility in (
            'session_host',
            'question_curator',
            'calendar_keeper',
            'conversation_spark',
            'spoiler_guardian',
            'librarian'
        )
    ),
    assigned_by uuid references public.profiles(id) on delete set null,
    created_at timestamptz not null default now(),
    unique (club_id, user_id, responsibility)
);

create index if not exists idx_club_member_responsibilities_club
on public.club_member_responsibilities (club_id);

create index if not exists idx_club_member_responsibilities_user
on public.club_member_responsibilities (user_id, club_id);

alter table public.club_member_responsibilities enable row level security;

drop policy if exists "Club members can read responsibilities" on public.club_member_responsibilities;
create policy "Club members can read responsibilities"
on public.club_member_responsibilities
for select
using (
    exists (
        select 1
        from public.club_members
        where club_members.club_id = club_member_responsibilities.club_id
          and club_members.user_id = auth.uid()
          and club_members.role <> 'pending'
    )
);

drop policy if exists "Club admins can assign responsibilities" on public.club_member_responsibilities;
create policy "Club admins can assign responsibilities"
on public.club_member_responsibilities
for insert
to authenticated
with check (
    assigned_by = auth.uid()
    and exists (
        select 1
        from public.club_members
        where club_members.club_id = club_member_responsibilities.club_id
          and club_members.user_id = auth.uid()
          and club_members.role in ('admin', 'moderator')
    )
    and exists (
        select 1
        from public.club_members target_member
        where target_member.club_id = club_member_responsibilities.club_id
          and target_member.user_id = club_member_responsibilities.user_id
          and target_member.role <> 'pending'
    )
);

drop policy if exists "Club admins can remove responsibilities" on public.club_member_responsibilities;
create policy "Club admins can remove responsibilities"
on public.club_member_responsibilities
for delete
to authenticated
using (
    exists (
        select 1
        from public.club_members
        where club_members.club_id = club_member_responsibilities.club_id
          and club_members.user_id = auth.uid()
          and club_members.role in ('admin', 'moderator')
    )
);
