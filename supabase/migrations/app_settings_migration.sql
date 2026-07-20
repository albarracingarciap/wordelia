-- app_settings: configuración global de Wordelia, clave-valor (un registro por
-- clave, value en jsonb). La gestiona /app/admin/ajustes?tab=general. Las server
-- actions escriben con service role (ignoran RLS); la RLS de abajo solo protege
-- el acceso directo desde el cliente.
--
-- Ejecutar una vez en el SQL editor de Supabase.

create table if not exists public.app_settings (
    key         text primary key,
    value       jsonb not null default '{}'::jsonb,
    updated_at  timestamptz not null default now(),
    updated_by  uuid references auth.users(id) on delete set null
);

alter table public.app_settings enable row level security;

drop policy if exists "app_settings admin all" on public.app_settings;
create policy "app_settings admin all" on public.app_settings
    for all
    using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'))
    with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

-- El aviso global, la ventana de fundador y los feature flags los consume la UI
-- pública/de cliente (banner, mensajes de beneficio, nav, registro), así que esas
-- filas son de lectura pública. Ninguna es sensible; updated_by no se expone en
-- las lecturas de cliente (solo se pide `value`).
drop policy if exists "app_settings public read announcement" on public.app_settings;
drop policy if exists "app_settings public read marketing" on public.app_settings;
create policy "app_settings public read marketing" on public.app_settings
    for select
    to anon, authenticated
    using (key in ('announcement', 'founder_window', 'flags'));

-- Semillas con los valores vigentes hoy (idempotente).
insert into public.app_settings (key, value) values
    ('announcement',   '{"enabled": false, "message": "", "variant": "info", "expires_at": null}'::jsonb),
    ('founder_window', '{"enabled": true, "ends_at": "2026-09-01"}'::jsonb),
    ('flags',          '{"asistente_ia": false, "librerias": true, "registro_abierto": true}'::jsonb)
on conflict (key) do nothing;
