-- Búsqueda por experiencia con ranking ponderado por géneros.
-- La función combina TRES fuentes para encontrar libros relevantes:
--   1. books.experience = label exacto (boost grande: el editor lo curó).
--   2. books.genre (texto legacy de single-genre).
--   3. book_genres -> genres.name (M:N moderno).
-- El score final es la SUMA de pesos de todos los matches por libro,
-- con boost de +100 si hay match de experiencia exacta.

BEGIN;

SET LOCAL search_path = public, pg_catalog;

DROP FUNCTION IF EXISTS public.find_books_by_experience(text, jsonb, integer);

CREATE OR REPLACE FUNCTION public.find_books_by_experience(
    p_experience_label text,
    p_genres           jsonb,    -- [{"name": "Terror", "weight": 3}, ...]
    p_limit            integer DEFAULT 40
)
RETURNS TABLE (
    book_id uuid,
    score   real
)
LANGUAGE sql
STABLE
PARALLEL SAFE
SET search_path = public, pg_catalog
AS $func$
    WITH genre_weights AS (
        SELECT
            (elem->>'name')::text  AS name,
            (elem->>'weight')::int AS weight
        FROM jsonb_array_elements(coalesce(p_genres, '[]'::jsonb)) AS elem
    ),
    matched_via_experience AS (
        SELECT id AS book_id, 100::real AS score
        FROM public.books
        WHERE p_experience_label IS NOT NULL
          AND experience = p_experience_label
    ),
    matched_via_genre_text AS (
        SELECT b.id AS book_id, gw.weight::real AS score
        FROM public.books b
        JOIN genre_weights gw ON gw.name = b.genre
        WHERE b.genre IS NOT NULL
    ),
    matched_via_book_genres AS (
        SELECT bg.book_id, gw.weight::real AS score
        FROM public.book_genres bg
        JOIN public.genres g ON g.id = bg.genre_id
        JOIN genre_weights gw ON gw.name = g.name
    ),
    combined AS (
        SELECT book_id, score FROM matched_via_experience
        UNION ALL
        SELECT book_id, score FROM matched_via_genre_text
        UNION ALL
        SELECT book_id, score FROM matched_via_book_genres
    )
    SELECT
        book_id,
        SUM(score)::real AS score
    FROM combined
    GROUP BY book_id
    ORDER BY SUM(score) DESC, book_id ASC
    LIMIT p_limit;
$func$;

COMMIT;
