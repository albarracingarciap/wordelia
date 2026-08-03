-- Prepara el borrado de usuarios (limpieza de datos de prueba + RGPD en prod).
-- 6 claves foráneas hacia el usuario estaban en NO ACTION y ABORTABAN el borrado
-- de un auth.users (error de FK), incluso las nullable. Aquí las recreamos con la
-- política adecuada. Cada bloque localiza la FK real por (tabla,columna) y la
-- sustituye — robusto frente al nombre del constraint.
--
-- Política:
--   reading_sessions.user_id, book_notes.user_id           -> CASCADE (datos del usuario)
--   clubs.owner_id, organizations.owner_id                 -> CASCADE (su contenido se va con él)
--   organization_events.created_by, club_live_sessions.created_by -> SET NULL (se conserva el evento/sesión)
--
-- ⚠️ NOTA para producción: organizations.owner_id en CASCADE significa que borrar
-- la cuenta personal del dueño de una LIBRERÍA borra toda la organización (tenant
-- B2B) y su contenido. Aceptable ahora (no hay librerías reales), pero antes de
-- onboarding de librerías de pago conviene cambiarlo a reasignación de propiedad.

create or replace function public._recreate_user_fk(
    p_table text, p_column text, p_ref_table text, p_action text
) returns void language plpgsql as $$
declare
    v_name text;
begin
    select con.conname into v_name
    from pg_constraint con
    join pg_attribute att on att.attrelid = con.conrelid and att.attnum = any (con.conkey)
    where con.conrelid = ('public.' || p_table)::regclass
      and con.contype = 'f'
      and att.attname = p_column;

    if v_name is not null then
        execute format('alter table public.%I drop constraint %I', p_table, v_name);
    end if;

    execute format(
        'alter table public.%I add constraint %I foreign key (%I) references %s(id) on delete %s',
        p_table, p_table || '_' || p_column || '_fkey', p_column, p_ref_table, p_action
    );
end $$;

select public._recreate_user_fk('reading_sessions',    'user_id',    'auth.users',      'cascade');
select public._recreate_user_fk('book_notes',          'user_id',    'auth.users',      'cascade');
select public._recreate_user_fk('clubs',               'owner_id',   'public.profiles', 'cascade');
select public._recreate_user_fk('organizations',       'owner_id',   'public.profiles', 'cascade');
select public._recreate_user_fk('organization_events', 'created_by', 'public.profiles', 'set null');
select public._recreate_user_fk('club_live_sessions',  'created_by', 'public.profiles', 'set null');

drop function public._recreate_user_fk(text, text, text, text);
