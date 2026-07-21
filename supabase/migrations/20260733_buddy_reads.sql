-- Lecturas en pareja (buddy reads): dos lectores leen un libro juntos, con progreso
-- compartido y un hilo 1:1. Ligero (no es un club). Ejecutar una vez.

create table if not exists public.buddy_reads (
    id         uuid primary key default gen_random_uuid(),
    book_id    uuid not null references public.books(id) on delete cascade,
    host_id    uuid not null references public.profiles(id) on delete cascade,
    guest_id   uuid not null references public.profiles(id) on delete cascade,
    status     text not null default 'invited' check (status in ('invited', 'active', 'declined', 'finished')),
    host_page  int not null default 0,
    guest_page int not null default 0,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    check (host_id <> guest_id)
);
create index if not exists buddy_reads_host_idx on public.buddy_reads (host_id);
create index if not exists buddy_reads_guest_idx on public.buddy_reads (guest_id);

create table if not exists public.buddy_read_messages (
    id            uuid primary key default gen_random_uuid(),
    buddy_read_id uuid not null references public.buddy_reads(id) on delete cascade,
    user_id       uuid not null references public.profiles(id) on delete cascade,
    content       text not null,
    created_at    timestamptz not null default now()
);
create index if not exists buddy_read_messages_idx on public.buddy_read_messages (buddy_read_id, created_at);

alter table public.buddy_reads enable row level security;
alter table public.buddy_read_messages enable row level security;

-- Participante de una lectura en pareja.
create or replace function public.is_buddy_participant(p_buddy_id uuid)
returns boolean language sql security definer stable set search_path = public as $$
    select exists (
        select 1 from public.buddy_reads b
        where b.id = p_buddy_id and (b.host_id = auth.uid() or b.guest_id = auth.uid())
    );
$$;

-- buddy_reads: leen/actualizan los dos participantes; crea el anfitrión.
drop policy if exists "buddy reads readable by participants" on public.buddy_reads;
create policy "buddy reads readable by participants" on public.buddy_reads
    for select to authenticated using (host_id = auth.uid() or guest_id = auth.uid());

drop policy if exists "buddy reads insert by host" on public.buddy_reads;
create policy "buddy reads insert by host" on public.buddy_reads
    for insert to authenticated with check (host_id = auth.uid());

drop policy if exists "buddy reads update by participants" on public.buddy_reads;
create policy "buddy reads update by participants" on public.buddy_reads
    for update to authenticated using (host_id = auth.uid() or guest_id = auth.uid()) with check (host_id = auth.uid() or guest_id = auth.uid());

drop policy if exists "buddy reads delete by host" on public.buddy_reads;
create policy "buddy reads delete by host" on public.buddy_reads
    for delete to authenticated using (host_id = auth.uid());

-- Mensajes: leen/escriben los participantes.
drop policy if exists "buddy messages readable by participants" on public.buddy_read_messages;
create policy "buddy messages readable by participants" on public.buddy_read_messages
    for select to authenticated using (public.is_buddy_participant(buddy_read_id));

drop policy if exists "buddy messages insert by participants" on public.buddy_read_messages;
create policy "buddy messages insert by participants" on public.buddy_read_messages
    for insert to authenticated with check (user_id = auth.uid() and public.is_buddy_participant(buddy_read_id));
