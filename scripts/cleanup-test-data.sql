-- ============================================================================
-- LIMPIEZA DE DATOS DE PRUEBA ANTES DEL LANZAMIENTO
-- ============================================================================
-- Objetivo: borrar los usuarios de prueba y TODA su actividad, conservando el
-- catálogo (books, editions, badges), las colecciones/curación, las librerías
-- verificadas y TU cuenta admin.
--
-- ⚠️ ANTES DE EJECUTAR:
--   1. HAZ UNA COPIA DE SEGURIDAD de la base de datos (pg_dump / snapshot).
--   2. Aplica primero la migración 20260755_fix_user_delete_cascade.sql, si no
--      el borrado fallará por claves foráneas (reading_sessions, book_notes,
--      clubs.owner_id, organizations.owner_id).
--   3. Ejecuta esto en el SQL editor de Supabase (corre como 'postgres', con
--      permiso para borrar de auth.users).
--   4. Ve paso a paso: primero los SELECT de previsualización, y solo cuando los
--      números cuadren, ejecuta los DELETE dentro de la transacción.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- PASO 1 — Identifica las cuentas que se CONSERVAN (admin/editor).
-- Ajusta el filtro a tus cuentas reales. Por defecto conserva admin + editor.
-- ----------------------------------------------------------------------------
-- Previsualiza a quién conservas:
select id, email, role
from public.profiles
where role in ('admin', 'editor')
order by role;

-- Previsualiza a quién se BORRARÁ (todos los demás):
select p.id, u.email, p.role, p.created_at
from public.profiles p
join auth.users u on u.id = p.id
where coalesce(p.role, 'user') not in ('admin', 'editor')
order by p.created_at;

-- ----------------------------------------------------------------------------
-- PASO 2 — Borrado, dentro de una transacción para poder revisar antes de COMMIT.
-- ----------------------------------------------------------------------------
begin;

-- (2a) Retos propuestos por usuarios de prueba: bórralos AHORA (mientras created_by
--      aún apunta al usuario). Si no, al borrar el usuario challenges.created_by
--      pasa a NULL y quedarían como si fueran retos oficiales de Wordelia.
--      Los retos oficiales (created_by IS NULL) NO se tocan.
delete from public.challenges c
where c.created_by is not null
  and c.created_by not in (select id from public.profiles where role in ('admin', 'editor'));

-- (2b) Borra los usuarios de prueba. El resto (perfil, lecturas, reseñas, clubs
--      propios, monedas, follows, wishlists, participaciones…) cae en cascada
--      gracias a la migración 20260755.
delete from auth.users u
where u.id not in (select id from public.profiles where role in ('admin', 'editor'));

-- (2c) Revisa que todo cuadra ANTES de confirmar:
select
    (select count(*) from auth.users)      as usuarios_restantes,
    (select count(*) from public.clubs)    as clubs_restantes,
    (select count(*) from public.challenges) as retos_restantes,
    (select count(*) from public.books)    as libros_catalogo;

-- Si los números son correctos:
--   commit;
-- Si algo no cuadra:
--   rollback;
