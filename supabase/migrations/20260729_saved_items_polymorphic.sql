-- Guardados polimórfico: además de actividad de comunidad, permitir guardar libros
-- (desde la ficha) y citas (desde /cita/[id]). Transforma la tabla activity-only.
-- Ejecutar una vez, después de 20260728_saved_items.sql.

alter table public.saved_items add column if not exists item_type text not null default 'activity';
alter table public.saved_items add column if not exists item_id   uuid;

-- Backfill: las filas existentes eran actividades.
update public.saved_items set item_id = activity_id where item_id is null and activity_id is not null;

-- Reemplazar PK (user_id, activity_id) → (user_id, item_type, item_id) y soltar la
-- FK/columna de actividad (el modelo polimórfico no puede tener FK única; las
-- entidades borradas se filtran al hidratar).
alter table public.saved_items drop constraint if exists saved_items_pkey;
alter table public.saved_items drop constraint if exists saved_items_activity_id_fkey;
delete from public.saved_items where item_id is null;
alter table public.saved_items alter column item_id set not null;
alter table public.saved_items drop column if exists activity_id;
alter table public.saved_items add constraint saved_items_pkey primary key (user_id, item_type, item_id);

create index if not exists saved_items_user_idx on public.saved_items (user_id, created_at desc);
create index if not exists saved_items_type_idx on public.saved_items (user_id, item_type);

-- item_type ∈ ('activity','book','quote'). RLS ya definido en 20260728 (solo-propietario).
