-- Security Advisor (ERROR): "Policy Exists RLS Disabled" en public.activity_feed.
-- La tabla tenía políticas pero RLS estaba DESACTIVADA (no se aplicaba nada).
-- Además faltaban políticas de escritura: los inserts de actividad (reseñas,
-- citas, empezar lectura, posts de comunidad) y el borrado de posts propios se
-- hacen con el cliente AUTENTICADO (user_id = auth.uid()); sin políticas de
-- INSERT/DELETE, activar RLS los rompería. Aquí se activa RLS y se añaden.

alter table public.activity_feed enable row level security;

-- SELECT ya existe ("Anyone can view activity feed" para authenticated). Añadimos
-- escritura de la propia actividad.
drop policy if exists "own activity insert" on public.activity_feed;
create policy "own activity insert" on public.activity_feed
    for insert to authenticated
    with check (auth.uid() = user_id);

drop policy if exists "own activity delete" on public.activity_feed;
create policy "own activity delete" on public.activity_feed
    for delete to authenticated
    using (auth.uid() = user_id);
