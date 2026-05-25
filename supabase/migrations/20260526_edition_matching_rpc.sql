-- RPC de soporte para EditionMatchingService (Fase 3).
-- Dada una edición entrante (título + author_id), devuelve hasta N candidatos
-- de `books` que comparten autor y cuyo título normalizado coincide exacto
-- o supera el umbral de similitud trigram.

BEGIN;

SET LOCAL search_path = public, extensions, pg_catalog;

DROP FUNCTION IF EXISTS public.find_book_candidates_for_edition(text, uuid, real, integer);

CREATE OR REPLACE FUNCTION public.find_book_candidates_for_edition(
    p_title                 text,
    p_author_id             uuid,
    p_similarity_threshold  real    DEFAULT 0.6,
    p_max_results           integer DEFAULT 5
)
RETURNS TABLE (
    book_id           uuid,
    title             text,
    title_normalized  text,
    author_id         uuid,
    similarity        real,
    is_exact          boolean
)
LANGUAGE plpgsql
STABLE
PARALLEL SAFE
SET search_path = public, extensions, pg_catalog
AS $$
DECLARE
    v_normalized text;
BEGIN
    v_normalized := public.normalize_title(p_title);

    IF v_normalized IS NULL OR v_normalized = '' OR p_author_id IS NULL THEN
        RETURN;
    END IF;

    RETURN QUERY
    SELECT
        b.id,
        b.title,
        b.title_normalized,
        b.author_id,
        extensions.similarity(b.title_normalized, v_normalized) AS sim,
        (b.title_normalized = v_normalized)                     AS is_exact
    FROM public.books b
    WHERE b.author_id = p_author_id
      AND b.title_normalized IS NOT NULL
      AND (
          b.title_normalized = v_normalized
          OR extensions.similarity(b.title_normalized, v_normalized) >= p_similarity_threshold
      )
    ORDER BY
        (b.title_normalized = v_normalized) DESC,
        extensions.similarity(b.title_normalized, v_normalized) DESC,
        b.created_at ASC
    LIMIT p_max_results;
END;
$$;

COMMIT;
