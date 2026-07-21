-- "Guardados": marcadores privados del lector sobre actividad de la comunidad
-- (reseñas, citas/notas y debates de club — todo vive en activity_feed).
-- Distinto del "me gusta" (activity_likes, reacción pública). Ejecutar una vez.

create table if not exists public.saved_items (
    user_id     uuid not null references public.profiles(id) on delete cascade,
    activity_id uuid not null references public.activity_feed(id) on delete cascade,
    created_at  timestamptz not null default now(),
    primary key (user_id, activity_id)
);

create index if not exists saved_items_user_idx on public.saved_items (user_id, created_at desc);

alter table public.saved_items enable row level security;

-- Cada lector gestiona (y lee) solo sus propios guardados.
drop policy if exists "saved_items select own" on public.saved_items;
create policy "saved_items select own" on public.saved_items
    for select to authenticated using (user_id = auth.uid());

drop policy if exists "saved_items insert own" on public.saved_items;
create policy "saved_items insert own" on public.saved_items
    for insert to authenticated with check (user_id = auth.uid());

drop policy if exists "saved_items delete own" on public.saved_items;
create policy "saved_items delete own" on public.saved_items
    for delete to authenticated using (user_id = auth.uid());
