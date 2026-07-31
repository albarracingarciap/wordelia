-- Retos de la COMUNIDAD: propuestos por usuarios, con moderación previa.
-- created_by null = reto OFICIAL de Wordelia (admin/editor). Con valor = propuesta de usuario.
-- moderation_status: 'pending' (a revisar) | 'approved' (visible) | 'rejected'.

alter table public.challenges add column if not exists created_by uuid references auth.users(id) on delete set null;
alter table public.challenges add column if not exists moderation_status text not null default 'approved';

do $$
begin
    if not exists (select 1 from pg_constraint where conname = 'challenges_moderation_status_check') then
        alter table public.challenges add constraint challenges_moderation_status_check
            check (moderation_status in ('pending', 'approved', 'rejected'));
    end if;
end $$;

create index if not exists challenges_created_by_idx on public.challenges (created_by);
create index if not exists challenges_moderation_idx on public.challenges (moderation_status);

-- RLS: un usuario puede PROPONER su propio reto de comunidad (sin publicar ni auto-aprobar).
drop policy if exists "propose community challenge" on public.challenges;
create policy "propose community challenge" on public.challenges
    for insert to authenticated
    with check (created_by = auth.uid() and is_published = false and moderation_status = 'pending');

-- Y VER sus propias propuestas aunque no estén publicadas (pendiente/rechazada).
drop policy if exists "own proposals read" on public.challenges;
create policy "own proposals read" on public.challenges
    for select to authenticated using (created_by = auth.uid());

-- La aprobación/rechazo/listado de moderación se hace con service role (admin).
