-- Comentarios/hilos en los items del feed de comunidad (posts, reseñas, citas…).
-- 1 nivel de respuesta (parent_id). Ejecutar una vez.

create table if not exists public.activity_comments (
    id          uuid primary key default gen_random_uuid(),
    activity_id uuid not null references public.activity_feed(id) on delete cascade,
    user_id     uuid not null references public.profiles(id) on delete cascade,
    parent_id   uuid references public.activity_comments(id) on delete cascade,
    content     text not null,
    created_at  timestamptz not null default now()
);

create index if not exists activity_comments_activity_idx on public.activity_comments (activity_id, created_at);

alter table public.activity_comments enable row level security;

-- Legible por cualquier autenticado (el feed ya es visible para autenticados).
drop policy if exists "activity comments readable" on public.activity_comments;
create policy "activity comments readable" on public.activity_comments
    for select to authenticated using (true);

drop policy if exists "activity comments insert own" on public.activity_comments;
create policy "activity comments insert own" on public.activity_comments
    for insert to authenticated with check (user_id = auth.uid());

drop policy if exists "activity comments delete own" on public.activity_comments;
create policy "activity comments delete own" on public.activity_comments
    for delete to authenticated using (user_id = auth.uid());
