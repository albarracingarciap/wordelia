-- Grafo social ligero: seguir a otros lectores. Ejecutar una vez en Supabase.

create table if not exists public.follows (
    follower_id  uuid not null references public.profiles(id) on delete cascade,
    following_id uuid not null references public.profiles(id) on delete cascade,
    created_at   timestamptz not null default now(),
    primary key (follower_id, following_id),
    check (follower_id <> following_id)
);

create index if not exists idx_follows_following on public.follows (following_id);
create index if not exists idx_follows_follower on public.follows (follower_id);

alter table public.follows enable row level security;

-- Legible por cualquier usuario autenticado (contadores y listas). Cada uno solo
-- crea/borra sus propios follows (follower_id = él mismo).
drop policy if exists "follows readable" on public.follows;
create policy "follows readable" on public.follows
    for select to authenticated using (true);

drop policy if exists "follow own" on public.follows;
create policy "follow own" on public.follows
    for insert to authenticated with check (follower_id = auth.uid());

drop policy if exists "unfollow own" on public.follows;
create policy "unfollow own" on public.follows
    for delete to authenticated using (follower_id = auth.uid());
