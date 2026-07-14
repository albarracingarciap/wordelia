-- Multi-sede (chains + branches) + white-label branding for bookstores.

-- A) Allow one owner to run several librerías (drop the one-per-owner rule).
alter table public.organizations
  drop constraint if exists organizations_owner_id_unique;

-- C) Brand color (hex) for white-label theming of the public profile.
alter table public.organizations
  add column if not exists brand_color text;

-- B) Branches / sedes.
create table if not exists public.organization_locations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  address text,
  city text,
  region text,
  country text default 'ES',
  lat double precision,
  lng double precision,
  phone text,
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists organization_locations_org_idx on public.organization_locations (organization_id);

alter table public.organization_locations enable row level security;

create policy "Organization locations are viewable by everyone"
  on public.organization_locations for select using (true);

create policy "Org managers can insert locations"
  on public.organization_locations for insert to authenticated
  with check (
    exists (
      select 1 from public.organization_members
      where organization_id = organization_locations.organization_id
        and user_id = auth.uid()
        and role in ('owner', 'manager')
    )
  );

create policy "Org managers can update locations"
  on public.organization_locations for update to authenticated
  using (
    exists (
      select 1 from public.organization_members
      where organization_id = organization_locations.organization_id
        and user_id = auth.uid()
        and role in ('owner', 'manager')
    )
  );

create policy "Org managers can delete locations"
  on public.organization_locations for delete to authenticated
  using (
    exists (
      select 1 from public.organization_members
      where organization_id = organization_locations.organization_id
        and user_id = auth.uid()
        and role in ('owner', 'manager')
    )
  );

-- Events can be tied to a branch.
alter table public.organization_events
  add column if not exists location_id uuid references public.organization_locations(id) on delete set null;
