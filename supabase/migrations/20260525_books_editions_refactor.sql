-- Refactor del motor de búsqueda — Fase 1.
-- `books` pasa a representar la OBRA abstracta (work-centric).
-- `editions` se crea para representar ediciones físicas/digitales concretas.
-- Asume que `books` está vacía: se hace DROP de columnas sin backfill.

BEGIN;

-- ---------------------------------------------------------------------------
-- 0. Extensiones requeridas (trigram + unaccent).
-- ---------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "pg_trgm" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "unaccent" WITH SCHEMA "extensions";

-- Asegura que `extensions` esté en el search_path durante esta migración:
-- las operator classes (p. ej. gin_trgm_ops) no pueden calificarse con
-- esquema en CREATE INDEX, así que tienen que resolverse vía search_path.
SET LOCAL search_path = public, extensions, pg_catalog;

-- ---------------------------------------------------------------------------
-- 1. Retirar la RPC antigua: depende de columnas que van a desaparecer.
--    Se sustituye en Fase 3 por EditionMatchingService.
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT oid::regprocedure AS sig
    FROM pg_proc
    WHERE proname = 'upsert_book_with_genres'
      AND pronamespace = 'public'::regnamespace
  LOOP
    EXECUTE 'DROP FUNCTION ' || r.sig::text || ' CASCADE';
  END LOOP;
END$$;

-- ---------------------------------------------------------------------------
-- 2. Quitar de `books` las columnas que pertenecen a una edición concreta.
-- ---------------------------------------------------------------------------
DROP INDEX IF EXISTS public.books_isbn_unique_idx;
DROP INDEX IF EXISTS public.books_isbn13_unique_idx;

ALTER TABLE public.books
  DROP COLUMN IF EXISTS isbn,
  DROP COLUMN IF EXISTS isbn13,
  DROP COLUMN IF EXISTS cover_url,
  DROP COLUMN IF EXISTS page_count,
  DROP COLUMN IF EXISTS published_date,
  DROP COLUMN IF EXISTS language,
  DROP COLUMN IF EXISTS publisher;

-- ---------------------------------------------------------------------------
-- 3. Añadir a `books` los campos propios de la obra.
-- ---------------------------------------------------------------------------
ALTER TABLE public.books
  ADD COLUMN IF NOT EXISTS title_normalized        text,
  ADD COLUMN IF NOT EXISTS original_title          text,
  ADD COLUMN IF NOT EXISTS original_language       text,
  ADD COLUMN IF NOT EXISTS first_publication_year  smallint,
  ADD COLUMN IF NOT EXISTS preferred_edition_id    uuid,
  ADD COLUMN IF NOT EXISTS external_ids            jsonb NOT NULL DEFAULT '{}'::jsonb;

-- ---------------------------------------------------------------------------
-- 4. normalize_title(): IMMUTABLE para poder usarla en índices/columnas
--    generadas. Quita acentos, baja a minúsculas, recorta el subtítulo tras
--    `:` `-` `–` `—`, y elimina marcadores entre paréntesis o corchetes del
--    tipo "(tomo i)", "(edición ilustrada)", "(vol. 2)", "[edicion especial]".
-- ---------------------------------------------------------------------------
-- Drop previo: si existía una versión anterior con otro nombre de parámetro
-- (p. ej. `input`), CREATE OR REPLACE falla con 42P13.
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT oid::regprocedure AS sig
    FROM pg_proc
    WHERE proname = 'normalize_title'
      AND pronamespace = 'public'::regnamespace
  LOOP
    EXECUTE 'DROP FUNCTION ' || r.sig::text || ' CASCADE';
  END LOOP;
END$$;

CREATE OR REPLACE FUNCTION public.normalize_title(p_title text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
PARALLEL SAFE
SET search_path = pg_catalog, public, extensions
AS $$
DECLARE
  v text;
BEGIN
  IF p_title IS NULL THEN
    RETURN NULL;
  END IF;

  -- IMMUTABLE: usamos la sobrecarga (regdictionary, text) que sí lo es.
  v := lower(extensions.unaccent('extensions.unaccent'::regdictionary, p_title));

  -- Recorta subtítulo tras el primer separador.
  v := regexp_replace(v, '\s*[:\-–—].*$', '');

  -- Elimina marcadores de edición/tomo/volumen entre paréntesis o corchetes.
  v := regexp_replace(
    v,
    '\s*[\(\[]\s*(tomo|libro|vol(?:umen)?\.?|parte|ed(?:icion)?\.?|edition|ilustrad[ao])\b[^\)\]]*[\)\]]',
    '',
    'gi'
  );

  v := regexp_replace(v, '\s+', ' ', 'g');
  v := btrim(v);

  RETURN v;
END;
$$;

-- Backfill defensivo (la tabla está vacía por contrato, pero mantenemos idempotencia).
UPDATE public.books
   SET title_normalized = public.normalize_title(title)
 WHERE title_normalized IS NULL
   AND title IS NOT NULL;

-- Trigger para mantener `title_normalized` sincronizado.
CREATE OR REPLACE FUNCTION public.books_set_title_normalized()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.title_normalized := public.normalize_title(NEW.title);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS books_title_normalized_trg ON public.books;
CREATE TRIGGER books_title_normalized_trg
  BEFORE INSERT OR UPDATE OF title ON public.books
  FOR EACH ROW
  EXECUTE FUNCTION public.books_set_title_normalized();

-- ---------------------------------------------------------------------------
-- 5. GIN trigram sobre title_normalized.
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS books_title_normalized_trgm_idx
  ON public.books
  USING gin (title_normalized gin_trgm_ops);

-- ---------------------------------------------------------------------------
-- 6. Tabla `editions`.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.editions (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id            uuid REFERENCES public.books(id) ON DELETE CASCADE,
  isbn               text,
  isbn13             text,
  title              text,
  subtitle           text,
  cover_url          text,
  cover_resolution   integer,
  page_count         integer,
  published_date     date,
  publication_year   smallint,
  language           text,
  publisher          text,
  format             text,
  is_abridged        boolean NOT NULL DEFAULT false,
  source             text,
  source_id          text,
  external_ids       jsonb  NOT NULL DEFAULT '{}'::jsonb,
  quality_score      numeric(6,2),
  raw_payload        jsonb,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS editions_isbn_unique_idx
  ON public.editions (isbn)
  WHERE isbn IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS editions_isbn13_unique_idx
  ON public.editions (isbn13)
  WHERE isbn13 IS NOT NULL;

CREATE INDEX IF NOT EXISTS editions_book_id_idx
  ON public.editions (book_id);

CREATE INDEX IF NOT EXISTS editions_language_idx
  ON public.editions (language)
  WHERE language IS NOT NULL;

CREATE INDEX IF NOT EXISTS editions_quality_score_idx
  ON public.editions (book_id, quality_score DESC NULLS LAST);

-- ---------------------------------------------------------------------------
-- 7. FK deferrable books.preferred_edition_id -> editions.id.
--    DEFERRABLE permite insertar book y edition en la misma transacción con
--    referencias mutuas (book.preferred_edition_id <-> edition.book_id).
-- ---------------------------------------------------------------------------
ALTER TABLE public.books
  DROP CONSTRAINT IF EXISTS books_preferred_edition_fk;

ALTER TABLE public.books
  ADD CONSTRAINT books_preferred_edition_fk
    FOREIGN KEY (preferred_edition_id) REFERENCES public.editions(id)
    ON DELETE SET NULL
    DEFERRABLE INITIALLY DEFERRED;

-- ---------------------------------------------------------------------------
-- 8. edition_id opcional en user_books y reading_sessions.
-- ---------------------------------------------------------------------------
ALTER TABLE public.user_books
  ADD COLUMN IF NOT EXISTS edition_id uuid
    REFERENCES public.editions(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS user_books_edition_id_idx
  ON public.user_books (edition_id)
  WHERE edition_id IS NOT NULL;

ALTER TABLE public.reading_sessions
  ADD COLUMN IF NOT EXISTS edition_id uuid
    REFERENCES public.editions(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS reading_sessions_edition_id_idx
  ON public.reading_sessions (edition_id)
  WHERE edition_id IS NOT NULL;

-- ---------------------------------------------------------------------------
-- 9. Cola de revisión manual para ediciones con múltiples candidatos de obra.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.edition_review_queue (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  edition_id    uuid NOT NULL REFERENCES public.editions(id) ON DELETE CASCADE,
  candidates    jsonb NOT NULL,
  reason        text,
  status        text NOT NULL DEFAULT 'pending',
  resolved_at   timestamptz,
  resolved_by   uuid,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS edition_review_queue_status_idx
  ON public.edition_review_queue (status)
  WHERE status = 'pending';

COMMIT;
