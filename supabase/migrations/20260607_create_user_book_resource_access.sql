create table if not exists public.user_book_resource_access (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  book_id uuid not null references public.books(id) on delete cascade,
  resource_kind text not null check (resource_kind in ('guide', 'genome')),
  access_source text not null default 'purchase' check (access_source in ('purchase', 'subscription', 'admin_grant')),
  purchased_at timestamptz,
  granted_at timestamptz not null default now(),
  expires_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, book_id, resource_kind)
);

create index if not exists user_book_resource_access_user_idx
on public.user_book_resource_access (user_id, resource_kind);

create index if not exists user_book_resource_access_book_idx
on public.user_book_resource_access (book_id, resource_kind);

alter table public.user_book_resource_access enable row level security;

drop policy if exists "Users can read own book resource access" on public.user_book_resource_access;
create policy "Users can read own book resource access"
on public.user_book_resource_access
for select
to authenticated
using (user_id = auth.uid());

