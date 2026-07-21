-- Prompts de comunidad: preguntas/conversaciones curadas que siembran actividad
-- ("¿Qué libro no pudiste soltar?"). Uno activo a la vez. Ejecutar una vez.

create table if not exists public.community_prompts (
    id         uuid primary key default gen_random_uuid(),
    question   text not null,
    is_active  boolean not null default false,
    created_at timestamptz not null default now()
);

create index if not exists community_prompts_active_idx on public.community_prompts (is_active, created_at desc);

alter table public.community_prompts enable row level security;

-- Lectura para cualquier autenticado; la escritura la hacen las acciones de admin
-- con service role (no hay policy de escritura de usuario).
drop policy if exists "community prompts readable" on public.community_prompts;
create policy "community prompts readable" on public.community_prompts
    for select to authenticated using (true);
