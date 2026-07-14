-- Store agenda: bookstore events not tied to a club (presentations, signings…).
create table if not exists public.organization_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  title text not null,
  description text,
  event_type text not null default 'otro' check (event_type in ('presentacion', 'firma', 'encuentro', 'taller', 'otro')),
  starts_at timestamptz not null,
  ends_at timestamptz,
  format text not null default 'presencial' check (format in ('presencial', 'online', 'mixto')),
  location text,
  url text,
  cover_url text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists organization_events_org_idx on public.organization_events (organization_id, starts_at);

alter table public.organization_events enable row level security;

create policy "Organization events are viewable by everyone"
  on public.organization_events for select using (true);

create policy "Org managers can insert events"
  on public.organization_events for insert to authenticated
  with check (
    exists (
      select 1 from public.organization_members
      where organization_id = organization_events.organization_id
        and user_id = auth.uid()
        and role in ('owner', 'manager')
    )
  );

create policy "Org managers can update events"
  on public.organization_events for update to authenticated
  using (
    exists (
      select 1 from public.organization_members
      where organization_id = organization_events.organization_id
        and user_id = auth.uid()
        and role in ('owner', 'manager')
    )
  );

create policy "Org managers can delete events"
  on public.organization_events for delete to authenticated
  using (
    exists (
      select 1 from public.organization_members
      where organization_id = organization_events.organization_id
        and user_id = auth.uid()
        and role in ('owner', 'manager')
    )
  );
