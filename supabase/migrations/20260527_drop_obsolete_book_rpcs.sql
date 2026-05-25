-- Limpia funciones SQL que dependían de columnas que ya no existen en `books`
-- (isbn, cover_url, page_count, publisher, etc., movidas a `editions` en la
-- refactorización de Fase 1). Estas RPC quedan obsoletas: ahora se actualizan
-- `books` (work) y `editions` (preferred edition) por separado desde TS, ya
-- sea inline o via EditionMatchingService.

BEGIN;

-- 1. update_club_book_details_for_admin (creada en 20260516).
--    Antes hacía UPDATE de books.cover_url/page_count/isbn/publisher.
DO $$
DECLARE
    r record;
BEGIN
    FOR r IN
        SELECT oid::regprocedure AS sig
        FROM pg_proc
        WHERE proname IN ('update_club_book_details_for_admin', 'update_club_book_details')
          AND pronamespace = 'public'::regnamespace
    LOOP
        EXECUTE 'DROP FUNCTION ' || r.sig::text || ' CASCADE';
    END LOOP;
END$$;

COMMIT;
