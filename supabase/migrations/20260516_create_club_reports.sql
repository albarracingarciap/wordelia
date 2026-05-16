create table if not exists public.club_reports (
    id uuid primary key default gen_random_uuid(),
    club_id uuid not null references public.clubs(id) on delete cascade,
    reporter_id uuid not null references public.profiles(id) on delete cascade,
    reason text not null,
    details text not null,
    status text not null default 'open' check (status in ('open', 'reviewing', 'resolved', 'dismissed')),
    created_at timestamptz not null default now(),
    resolved_at timestamptz,
    resolved_by uuid references public.profiles(id) on delete set null
);

create index if not exists idx_club_reports_club_id on public.club_reports(club_id);
create index if not exists idx_club_reports_reporter_id on public.club_reports(reporter_id);
create index if not exists idx_club_reports_status on public.club_reports(status);
create index if not exists idx_club_reports_created_at on public.club_reports(created_at desc);

alter table public.club_reports enable row level security;

drop policy if exists "Club members can create reports" on public.club_reports;
drop policy if exists "Reporters and club staff can view reports" on public.club_reports;
drop policy if exists "Club staff can update reports" on public.club_reports;

create policy "Club members can create reports"
on public.club_reports
for insert
with check (
    auth.uid() = reporter_id
    and length(trim(reason)) > 0
    and length(trim(details)) > 0
    and exists (
        select 1
        from public.club_members
        where club_members.club_id = club_reports.club_id
          and club_members.user_id = auth.uid()
          and club_members.role <> 'pending'
    )
);

create policy "Reporters and club staff can view reports"
on public.club_reports
for select
using (
    reporter_id = auth.uid()
    or exists (
        select 1
        from public.club_members
        where club_members.club_id = club_reports.club_id
          and club_members.user_id = auth.uid()
          and club_members.role in ('admin', 'moderator')
    )
);

create policy "Club staff can update reports"
on public.club_reports
for update
using (
    exists (
        select 1
        from public.club_members
        where club_members.club_id = club_reports.club_id
          and club_members.user_id = auth.uid()
          and club_members.role in ('admin', 'moderator')
    )
)
with check (
    exists (
        select 1
        from public.club_members
        where club_members.club_id = club_reports.club_id
          and club_members.user_id = auth.uid()
          and club_members.role in ('admin', 'moderator')
    )
);
