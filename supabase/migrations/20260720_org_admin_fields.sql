-- Campos de gestión admin para librerías (organizations):
--  - verified: sello de verificación (self-serve + revisión del equipo Wordelia).
--  - admin_notes: notas internas del equipo (no visibles para el propietario).
-- El toggle is_active ya existía (suspender librería).
--
-- Ejecutar una vez en Supabase.

alter table public.organizations
    add column if not exists verified boolean not null default false,
    add column if not exists admin_notes text;
