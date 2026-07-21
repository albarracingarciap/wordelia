-- Reto de lectura anual (estilo Goodreads): meta de libros por año y usuario.
-- El progreso NO se guarda: se cuenta en vivo desde user_books (status READ +
-- finish_date del año). Ejecutar una vez en Supabase.

create table if not exists public.reading_goals (
    id          uuid primary key default gen_random_uuid(),
    user_id     uuid not null references public.profiles(id) on delete cascade,
    year        integer not null,
    target      integer not null check (target > 0),
    created_at  timestamptz not null default now(),
    updated_at  timestamptz not null default now(),
    unique (user_id, year)
);

create index if not exists idx_reading_goals_user on public.reading_goals (user_id);

alter table public.reading_goals enable row level security;

-- Cada usuario gestiona sus propias metas. La página pública /reto/[id] lee con
-- service role (no necesita policy pública).
drop policy if exists "own reading goals" on public.reading_goals;
create policy "own reading goals" on public.reading_goals
    for all
    using (user_id = auth.uid())
    with check (user_id = auth.uid());
