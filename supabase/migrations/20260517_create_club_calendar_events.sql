create table if not exists public.club_calendar_events (
    id uuid primary key default gen_random_uuid(),
    club_id uuid not null references public.clubs(id) on delete cascade,
    created_by uuid references public.profiles(id) on delete set null,
    title text not null,
    description text,
    event_type text not null default 'other' check (
        event_type in (
            'checkpoint',
            'discussion',
            'vote_deadline',
            'silent_session',
            'final_meeting',
            'announcement',
            'other'
        )
    ),
    starts_at timestamptz not null,
    ends_at timestamptz,
    format text check (format in ('online', 'presencial', 'mixto')),
    location text,
    checkpoint_index integer,
    book_id uuid references public.books(id) on delete set null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists idx_club_calendar_events_club_date
on public.club_calendar_events (club_id, starts_at);

alter table public.club_calendar_events enable row level security;

drop policy if exists "Club members can read calendar events" on public.club_calendar_events;
create policy "Club members can read calendar events"
on public.club_calendar_events
for select
using (
    exists (
        select 1
        from public.club_members
        where club_members.club_id = club_calendar_events.club_id
          and club_members.user_id = auth.uid()
          and club_members.role <> 'pending'
    )
);

drop policy if exists "Club admins can create calendar events" on public.club_calendar_events;
create policy "Club admins can create calendar events"
on public.club_calendar_events
for insert
with check (
    created_by = auth.uid()
    and exists (
        select 1
        from public.club_members
        where club_members.club_id = club_calendar_events.club_id
          and club_members.user_id = auth.uid()
          and club_members.role in ('admin', 'moderator')
    )
);

drop policy if exists "Club admins can update calendar events" on public.club_calendar_events;
create policy "Club admins can update calendar events"
on public.club_calendar_events
for update
using (
    exists (
        select 1
        from public.club_members
        where club_members.club_id = club_calendar_events.club_id
          and club_members.user_id = auth.uid()
          and club_members.role in ('admin', 'moderator')
    )
)
with check (
    exists (
        select 1
        from public.club_members
        where club_members.club_id = club_calendar_events.club_id
          and club_members.user_id = auth.uid()
          and club_members.role in ('admin', 'moderator')
    )
);

drop policy if exists "Club admins can delete calendar events" on public.club_calendar_events;
create policy "Club admins can delete calendar events"
on public.club_calendar_events
for delete
using (
    exists (
        select 1
        from public.club_members
        where club_members.club_id = club_calendar_events.club_id
          and club_members.user_id = auth.uid()
          and club_members.role in ('admin', 'moderator')
    )
);
