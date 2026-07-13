-- "Wordelia para Librerías" — F0: organizations (bookstores) that host reading clubs.
-- Mirrors the clubs/club_members ownership + RLS pattern.

-- 1. organizations (the bookstore / "librería")
create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  type text not null default 'bookstore' check (type in ('bookstore')),
  description text,
  logo_url text,
  cover_url text,
  website text,
  contact_email text,
  phone text,
  address text,
  city text,
  region text,
  country text default 'ES',
  lat double precision,
  lng double precision,
  owner_id uuid not null references public.profiles(id),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists organizations_slug_idx on public.organizations (slug);
create index if not exists organizations_city_idx on public.organizations (city);

alter table public.organizations enable row level security;

create policy "Organizations are viewable by everyone"
  on public.organizations for select using (true);

create policy "Users can create their own organizations"
  on public.organizations for insert with check (auth.uid() = owner_id);

-- 2. organization_members (the bookstore's staff)
create table if not exists public.organization_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'staff' check (role in ('owner', 'manager', 'staff')),
  created_at timestamptz not null default now(),
  unique (organization_id, user_id)
);

create index if not exists organization_members_org_idx on public.organization_members (organization_id);

alter table public.organization_members enable row level security;

create policy "Organization members are viewable by everyone"
  on public.organization_members for select using (true);

create policy "Users can add themselves to an organization"
  on public.organization_members for insert with check (auth.uid() = user_id);

create policy "Owners can remove members, users can leave"
  on public.organization_members for delete using (
    auth.uid() = user_id or exists (
      select 1 from public.organizations
      where id = organization_members.organization_id
        and owner_id = auth.uid()
    )
  );

-- organizations UPDATE policy (defined here because it references organization_members)
create policy "Owners and managers can update their organizations"
  on public.organizations for update using (
    auth.uid() = owner_id or exists (
      select 1 from public.organization_members
      where organization_id = organizations.id
        and user_id = auth.uid()
        and role in ('owner', 'manager')
    )
  );

-- 3. organization_subscriptions (freemium tier; Pro activated by admin in the MVP)
create table if not exists public.organization_subscriptions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null unique references public.organizations(id) on delete cascade,
  tier text not null default 'free' check (tier in ('free', 'pro')),
  status text not null default 'active' check (status in ('active', 'trialing', 'past_due', 'cancelled')),
  billing_period text check (billing_period in ('monthly', 'annual')),
  started_at timestamptz not null default now(),
  current_period_end timestamptz,
  external_ref text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.organization_subscriptions enable row level security;

-- Tier is not sensitive (it feeds resource grants server-side); readable by all.
-- Writes (activating Pro) happen only via the service role, like founder_memberships.
create policy "Organization subscriptions are viewable by everyone"
  on public.organization_subscriptions for select using (true);

-- Auto-provision the owner membership + a free subscription when an organization
-- is created (security definer bypasses RLS; there is no user INSERT policy on
-- organization_subscriptions on purpose, so tier can't be self-set to 'pro').
create or replace function public.handle_new_organization()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.organization_members (organization_id, user_id, role)
  values (new.id, new.owner_id, 'owner')
  on conflict (organization_id, user_id) do nothing;

  insert into public.organization_subscriptions (organization_id, tier, status)
  values (new.id, 'free', 'active')
  on conflict (organization_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_organization_created on public.organizations;
create trigger on_organization_created
  after insert on public.organizations
  for each row execute function public.handle_new_organization();

-- 4. Link a club to its hosting organization (nullable: most clubs have no org)
alter table public.clubs
  add column if not exists organization_id uuid references public.organizations(id) on delete set null;

create index if not exists clubs_organization_id_idx on public.clubs (organization_id);

-- 5. Allow a new grant source for club-of-organization perpetual grants
alter table public.user_book_resource_access
  drop constraint if exists user_book_resource_access_access_source_check;

alter table public.user_book_resource_access
  add constraint user_book_resource_access_access_source_check
  check (access_source in ('purchase', 'subscription', 'admin_grant', 'org_club'));
