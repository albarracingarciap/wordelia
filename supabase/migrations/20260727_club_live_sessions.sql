-- Sesiones en vivo del club: encuentro en tiempo real (texto) con agenda, chat,
-- presencia y cierre con resumen. Ejecutar una vez en Supabase.

create table if not exists public.club_live_sessions (
    id               uuid primary key default gen_random_uuid(),
    club_id          uuid not null references public.clubs(id) on delete cascade,
    club_book_id     uuid references public.club_books(id) on delete set null,
    title            text not null,
    scheduled_at     timestamptz not null,
    duration_minutes int not null default 60,
    agenda           jsonb not null default '[]'::jsonb, -- [{ title, minutes }]
    status           text not null default 'scheduled' check (status in ('scheduled', 'live', 'ended')),
    current_block    int not null default 0,
    started_at       timestamptz,
    ended_at         timestamptz,
    summary          text,
    created_by       uuid references public.profiles(id),
    created_at       timestamptz not null default now(),
    updated_at       timestamptz not null default now()
);
create index if not exists club_live_sessions_club_idx on public.club_live_sessions (club_id, scheduled_at desc);

create table if not exists public.club_session_messages (
    id         uuid primary key default gen_random_uuid(),
    session_id uuid not null references public.club_live_sessions(id) on delete cascade,
    user_id    uuid not null references public.profiles(id) on delete cascade,
    content    text not null,
    created_at timestamptz not null default now()
);
create index if not exists club_session_messages_session_idx on public.club_session_messages (session_id, created_at);

alter table public.club_live_sessions enable row level security;
alter table public.club_session_messages enable row level security;

-- Miembro (no pendiente) del club de una sesión.
create or replace function public.is_club_member_of_session(p_session_id uuid)
returns boolean language sql security definer stable set search_path = public as $$
    select exists (
        select 1
        from public.club_live_sessions s
        join public.club_members m on m.club_id = s.club_id
        where s.id = p_session_id and m.user_id = auth.uid() and coalesce(m.role, '') <> 'pending'
    );
$$;

-- Gestor (admin/moderator) del club de una sesión.
create or replace function public.is_club_manager_of_session(p_session_id uuid)
returns boolean language sql security definer stable set search_path = public as $$
    select exists (
        select 1
        from public.club_live_sessions s
        join public.club_members m on m.club_id = s.club_id
        where s.id = p_session_id and m.user_id = auth.uid() and m.role in ('admin', 'moderator')
    );
$$;

-- Sesiones: leen los miembros del club; crean/editan/borran admin/moderator.
drop policy if exists "live sessions readable by members" on public.club_live_sessions;
create policy "live sessions readable by members" on public.club_live_sessions
    for select to authenticated using (
        exists (select 1 from public.club_members m where m.club_id = club_live_sessions.club_id and m.user_id = auth.uid() and coalesce(m.role, '') <> 'pending')
    );

drop policy if exists "live sessions managed by club managers" on public.club_live_sessions;
create policy "live sessions managed by club managers" on public.club_live_sessions
    for all to authenticated using (
        exists (select 1 from public.club_members m where m.club_id = club_live_sessions.club_id and m.user_id = auth.uid() and m.role in ('admin', 'moderator'))
    ) with check (
        exists (select 1 from public.club_members m where m.club_id = club_live_sessions.club_id and m.user_id = auth.uid() and m.role in ('admin', 'moderator'))
    );

-- Mensajes: leen los miembros del club; inserta el propio miembro; borra autor o gestor.
drop policy if exists "session messages readable by members" on public.club_session_messages;
create policy "session messages readable by members" on public.club_session_messages
    for select to authenticated using (public.is_club_member_of_session(session_id));

drop policy if exists "session messages insert by members" on public.club_session_messages;
create policy "session messages insert by members" on public.club_session_messages
    for insert to authenticated with check (user_id = auth.uid() and public.is_club_member_of_session(session_id));

drop policy if exists "session messages delete own or manager" on public.club_session_messages;
create policy "session messages delete own or manager" on public.club_session_messages
    for delete to authenticated using (user_id = auth.uid() or public.is_club_manager_of_session(session_id));

-- Realtime: propagar mensajes nuevos y cambios de estado/agenda de la sesión.
alter publication supabase_realtime add table public.club_session_messages;
alter publication supabase_realtime add table public.club_live_sessions;
