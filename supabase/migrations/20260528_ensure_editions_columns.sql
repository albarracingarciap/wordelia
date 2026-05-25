-- Garantiza que la tabla `editions` tiene todas las columnas que el código
-- TypeScript espera. Necesario cuando la migración 20260525 se aplicó
-- parcialmente (p. ej. la tabla ya existía con un subconjunto de columnas
-- antes del DROP/recreate, y `CREATE TABLE IF NOT EXISTS` no la rehizo).
--
-- Todas las cláusulas son idempotentes (ADD COLUMN IF NOT EXISTS).

BEGIN;

ALTER TABLE public.editions
    ADD COLUMN IF NOT EXISTS subtitle            text,
    ADD COLUMN IF NOT EXISTS cover_resolution    integer,
    ADD COLUMN IF NOT EXISTS publication_year    smallint,
    ADD COLUMN IF NOT EXISTS format              text,
    ADD COLUMN IF NOT EXISTS is_abridged         boolean NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS source              text,
    ADD COLUMN IF NOT EXISTS source_id           text,
    ADD COLUMN IF NOT EXISTS external_ids        jsonb NOT NULL DEFAULT '{}'::jsonb,
    ADD COLUMN IF NOT EXISTS quality_score       numeric(6,2),
    ADD COLUMN IF NOT EXISTS raw_payload         jsonb,
    ADD COLUMN IF NOT EXISTS created_at          timestamptz NOT NULL DEFAULT now(),
    ADD COLUMN IF NOT EXISTS updated_at          timestamptz NOT NULL DEFAULT now();

-- También por seguridad: las columnas básicas de edición que pueden no estar
-- si la tabla existió previamente con otro esquema.
ALTER TABLE public.editions
    ADD COLUMN IF NOT EXISTS isbn                text,
    ADD COLUMN IF NOT EXISTS isbn13              text,
    ADD COLUMN IF NOT EXISTS title               text,
    ADD COLUMN IF NOT EXISTS cover_url           text,
    ADD COLUMN IF NOT EXISTS page_count          integer,
    ADD COLUMN IF NOT EXISTS published_date      date,
    ADD COLUMN IF NOT EXISTS language            text,
    ADD COLUMN IF NOT EXISTS publisher           text;

-- Índices que la 20260525 declara: reaplicamos por idempotencia.
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

COMMIT;
