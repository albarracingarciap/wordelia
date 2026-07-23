-- Funciones de IA del plan Bibliófilo (Mistral gestionado). NO es un chatbot:
-- son funciones-motor puntuales. Dos tablas: registro de consumo + caché de salidas.

-- 1) Registro de consumo (fuente de verdad de coste/uso).
create table if not exists public.ai_usage (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references public.profiles(id) on delete cascade not null,
    feature text not null,
    input_tokens integer not null default 0,
    output_tokens integer not null default 0,
    cost_micros integer not null default 0, -- coste estimado en micro-dólares
    created_at timestamptz not null default now()
);

create index if not exists idx_ai_usage_user_created on public.ai_usage(user_id, created_at desc);
create index if not exists idx_ai_usage_feature on public.ai_usage(feature, created_at desc);

alter table public.ai_usage enable row level security;

drop policy if exists "own ai usage select" on public.ai_usage;
create policy "own ai usage select" on public.ai_usage
    for select using (auth.uid() = user_id);

drop policy if exists "own ai usage insert" on public.ai_usage;
create policy "own ai usage insert" on public.ai_usage
    for insert with check (auth.uid() = user_id);

-- 2) Caché de salidas por (usuario, función, entidad). Evita regenerar en cada
--    vista. entity_key: '' global al usuario, o book_id/club_id según función.
create table if not exists public.ai_generations (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references public.profiles(id) on delete cascade not null,
    feature text not null,
    entity_key text not null default '',
    content jsonb not null,
    created_at timestamptz not null default now(),
    unique(user_id, feature, entity_key)
);

create index if not exists idx_ai_generations_lookup on public.ai_generations(user_id, feature, entity_key);

alter table public.ai_generations enable row level security;

drop policy if exists "own ai generations select" on public.ai_generations;
create policy "own ai generations select" on public.ai_generations
    for select using (auth.uid() = user_id);

drop policy if exists "own ai generations insert" on public.ai_generations;
create policy "own ai generations insert" on public.ai_generations
    for insert with check (auth.uid() = user_id);

drop policy if exists "own ai generations update" on public.ai_generations;
create policy "own ai generations update" on public.ai_generations
    for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own ai generations delete" on public.ai_generations;
create policy "own ai generations delete" on public.ai_generations
    for delete using (auth.uid() = user_id);
