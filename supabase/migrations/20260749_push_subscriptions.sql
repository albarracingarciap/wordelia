-- PWA Fase 0.3 · Suscripciones de Web Push.
-- Una fila por dispositivo/navegador suscrito de un usuario (endpoint único).
-- El envío se hace con service role (bypassa RLS); el usuario solo gestiona las suyas.

create table if not exists public.push_subscriptions (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    endpoint text not null unique,
    p256dh text not null,
    auth text not null,
    user_agent text,
    created_at timestamptz not null default now()
);

create index if not exists push_subscriptions_user_id_idx on public.push_subscriptions(user_id);

alter table public.push_subscriptions enable row level security;

do $$
begin
    if not exists (select 1 from pg_policies where tablename = 'push_subscriptions' and policyname = 'own_push_select') then
        create policy "own_push_select" on public.push_subscriptions for select using (auth.uid() = user_id);
    end if;
    if not exists (select 1 from pg_policies where tablename = 'push_subscriptions' and policyname = 'own_push_insert') then
        create policy "own_push_insert" on public.push_subscriptions for insert with check (auth.uid() = user_id);
    end if;
    if not exists (select 1 from pg_policies where tablename = 'push_subscriptions' and policyname = 'own_push_delete') then
        create policy "own_push_delete" on public.push_subscriptions for delete using (auth.uid() = user_id);
    end if;
end $$;
