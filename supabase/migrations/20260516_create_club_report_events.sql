create table if not exists public.club_report_events (
    id uuid primary key default gen_random_uuid(),
    report_id uuid not null references public.club_reports(id) on delete cascade,
    club_id uuid not null references public.clubs(id) on delete cascade,
    actor_id uuid not null references public.profiles(id) on delete cascade,
    status text not null check (status in ('open', 'reviewing', 'resolved', 'dismissed')),
    note text,
    created_at timestamptz not null default now()
);

create index if not exists idx_club_report_events_report_id on public.club_report_events(report_id);
create index if not exists idx_club_report_events_club_id on public.club_report_events(club_id);
create index if not exists idx_club_report_events_created_at on public.club_report_events(created_at desc);

alter table public.club_report_events enable row level security;

drop policy if exists "Club staff can create report events" on public.club_report_events;
drop policy if exists "Reporters and club staff can view report events" on public.club_report_events;

create policy "Club staff can create report events"
on public.club_report_events
for insert
with check (
    auth.uid() = actor_id
    and exists (
        select 1
        from public.club_members
        where club_members.club_id = club_report_events.club_id
          and club_members.user_id = auth.uid()
          and club_members.role in ('admin', 'moderator')
    )
);

create policy "Reporters and club staff can view report events"
on public.club_report_events
for select
using (
    exists (
        select 1
        from public.club_reports
        where club_reports.id = club_report_events.report_id
          and club_reports.reporter_id = auth.uid()
    )
    or exists (
        select 1
        from public.club_members
        where club_members.club_id = club_report_events.club_id
          and club_members.user_id = auth.uid()
          and club_members.role in ('admin', 'moderator')
    )
);
