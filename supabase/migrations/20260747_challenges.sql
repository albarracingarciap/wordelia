-- Retos de comunidad REALES: criterio estructurado (medible), publicación,
-- participación y recompensa enlazada a una insignia real.
-- Ejecutar una vez. Idempotente (la tabla challenges pudo crearse ad-hoc antes).

create table if not exists public.challenges (
    id uuid primary key default gen_random_uuid(),
    title text not null,
    description text,
    start_date date,
    end_date date,
    rules text,
    reward_badge_name text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- Columnas nuevas (por si la tabla ya existía sin ellas).
alter table public.challenges add column if not exists is_published boolean not null default false;
alter table public.challenges add column if not exists goal_type text;         -- 'books' | 'genre' | 'pages'
alter table public.challenges add column if not exists goal_target integer;     -- objetivo numérico
alter table public.challenges add column if not exists goal_genre text;         -- género (si goal_type='genre')
alter table public.challenges add column if not exists reward_badge_id uuid references public.badges(id) on delete set null;
alter table public.challenges add column if not exists created_at timestamptz not null default now();
alter table public.challenges add column if not exists updated_at timestamptz not null default now();
create index if not exists challenges_published_idx on public.challenges (is_published, end_date);

-- Participación (unirse) + marca de completado.
create table if not exists public.challenge_participants (
    id uuid primary key default gen_random_uuid(),
    challenge_id uuid not null references public.challenges(id) on delete cascade,
    user_id uuid not null references public.profiles(id) on delete cascade,
    joined_at timestamptz not null default now(),
    completed_at timestamptz,
    unique (challenge_id, user_id)
);
create index if not exists challenge_participants_user_idx on public.challenge_participants (user_id);

-- RLS: retos publicados legibles por autenticados; el admin lee/escribe por service role.
alter table public.challenges enable row level security;
drop policy if exists "published challenges read" on public.challenges;
create policy "published challenges read" on public.challenges
    for select to authenticated using (is_published = true);

alter table public.challenge_participants enable row level security;
drop policy if exists "own participation read" on public.challenge_participants;
create policy "own participation read" on public.challenge_participants
    for select to authenticated using (user_id = auth.uid());
drop policy if exists "own participation insert" on public.challenge_participants;
create policy "own participation insert" on public.challenge_participants
    for insert to authenticated with check (user_id = auth.uid());
-- La marca de completado (completed_at) se hace por service role al validar progreso.
