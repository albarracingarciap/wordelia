-- Reacciones con emoji en el feed (además del corazón/like). Una por usuario e item
-- (cambiable). Set sobrio definido en la app. Ejecutar una vez.

create table if not exists public.activity_reactions (
    activity_id uuid not null references public.activity_feed(id) on delete cascade,
    user_id     uuid not null references public.profiles(id) on delete cascade,
    emoji       text not null,
    created_at  timestamptz not null default now(),
    primary key (activity_id, user_id)
);

create index if not exists activity_reactions_activity_idx on public.activity_reactions (activity_id);

alter table public.activity_reactions enable row level security;

drop policy if exists "activity reactions readable" on public.activity_reactions;
create policy "activity reactions readable" on public.activity_reactions
    for select to authenticated using (true);

drop policy if exists "activity reactions upsert own" on public.activity_reactions;
create policy "activity reactions upsert own" on public.activity_reactions
    for insert to authenticated with check (user_id = auth.uid());

drop policy if exists "activity reactions update own" on public.activity_reactions;
create policy "activity reactions update own" on public.activity_reactions
    for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "activity reactions delete own" on public.activity_reactions;
create policy "activity reactions delete own" on public.activity_reactions
    for delete to authenticated using (user_id = auth.uid());
