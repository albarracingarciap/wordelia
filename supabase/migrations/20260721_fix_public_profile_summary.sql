-- Fix: get_public_profile_summary referenciaba b.cover_url, pero las portadas se
-- movieron de books a editions (edición preferida). Rompía la ficha pública de
-- perfil. Aquí se toma la portada de la edición preferida. Ejecutar en Supabase.

CREATE OR REPLACE FUNCTION public.get_public_profile_summary(profile_username TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    target_profile public.profiles%ROWTYPE;
    privacy JSONB;
    visibility TEXT;
    is_owner BOOLEAN;
    can_view BOOLEAN;
    books_read_count INTEGER := 0;
    pages_read_count INTEGER := 0;
    reading_count INTEGER := 0;
    badges_count INTEGER := 0;
    recent_books JSONB := '[]'::JSONB;
BEGIN
    SELECT *
    INTO target_profile
    FROM public.profiles
    WHERE lower(username) = lower(profile_username)
    LIMIT 1;

    IF target_profile.id IS NULL THEN
        RETURN NULL;
    END IF;

    privacy := COALESCE(target_profile.privacy_settings, '{}'::JSONB);
    visibility := COALESCE(privacy->>'profile_visibility', 'public');
    is_owner := auth.uid() = target_profile.id;
    can_view := is_owner
        OR visibility = 'public'
        OR (visibility = 'members' AND auth.uid() IS NOT NULL);

    IF NOT can_view THEN
        RETURN jsonb_build_object(
            'profile', jsonb_build_object(
                'username', target_profile.username,
                'full_name', CASE WHEN COALESCE((privacy->>'show_name_photo')::BOOLEAN, TRUE) THEN target_profile.full_name ELSE 'Perfil privado' END,
                'avatar_url', CASE WHEN COALESCE((privacy->>'show_name_photo')::BOOLEAN, TRUE) THEN target_profile.avatar_url ELSE NULL END,
                'banner_color', target_profile.banner_color
            ),
            'locked', TRUE,
            'privacy', privacy
        );
    END IF;

    IF is_owner OR COALESCE((privacy->>'show_stats')::BOOLEAN, TRUE) THEN
        SELECT COUNT(*)
        INTO books_read_count
        FROM public.user_books
        WHERE user_id = target_profile.id
        AND status = 'READ';

        SELECT COUNT(*)
        INTO reading_count
        FROM public.user_books
        WHERE user_id = target_profile.id
        AND status = 'READING';

        SELECT COALESCE(SUM(COALESCE(pages_read, 0)), 0)
        INTO pages_read_count
        FROM public.reading_sessions
        WHERE user_id = target_profile.id;

        SELECT COUNT(*)
        INTO badges_count
        FROM public.user_badges
        WHERE user_id = target_profile.id;
    END IF;

    IF is_owner OR COALESCE((privacy->>'show_recent_reads')::BOOLEAN, TRUE) THEN
        SELECT COALESCE(jsonb_agg(book_payload), '[]'::JSONB)
        INTO recent_books
        FROM (
            SELECT jsonb_build_object(
                'id', b.id,
                'title', b.title,
                'cover_url', ed.cover_url,
                'status', ub.status,
                'finish_date', ub.finish_date
            ) AS book_payload
            FROM public.user_books ub
            JOIN public.books b ON b.id = ub.book_id
            LEFT JOIN public.editions ed ON ed.id = b.preferred_edition_id
            WHERE ub.user_id = target_profile.id
            AND ub.status IN ('READ', 'READING')
            ORDER BY ub.finish_date DESC NULLS LAST, ub.created_at DESC
            LIMIT 6
        ) books;
    END IF;

    RETURN jsonb_build_object(
        'profile', jsonb_build_object(
            'id', target_profile.id,
            'username', target_profile.username,
            'full_name', CASE WHEN is_owner OR COALESCE((privacy->>'show_name_photo')::BOOLEAN, TRUE) THEN target_profile.full_name ELSE 'Lector de Wordelia' END,
            'avatar_url', CASE WHEN is_owner OR COALESCE((privacy->>'show_name_photo')::BOOLEAN, TRUE) THEN target_profile.avatar_url ELSE NULL END,
            'bio', target_profile.bio,
            'location', CASE WHEN is_owner OR COALESCE((privacy->>'show_location')::BOOLEAN, TRUE) THEN target_profile.location ELSE NULL END,
            'banner_color', target_profile.banner_color,
            'favorite_genres', target_profile.favorite_genres,
            'created_at', target_profile.created_at
        ),
        'stats', jsonb_build_object(
            'books_read', books_read_count,
            'pages_read', pages_read_count,
            'reading', reading_count,
            'badges', badges_count
        ),
        'recent_books', recent_books,
        'locked', FALSE,
        'privacy', privacy
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_public_profile_summary(TEXT) TO authenticated, anon;
