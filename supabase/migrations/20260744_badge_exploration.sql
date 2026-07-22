-- Completa el criterio de las insignias: además de libros leídos, reseñas y racha
-- (ya implementados), añade EXPLORACIÓN (genres_count: nº de géneros distintos
-- entre los libros leídos). Versión autoritativa de check_user_badges.
-- También reevalúa a todos los usuarios para otorgar lo que ya cumplan.
-- Ejecutar una vez.

create or replace function public.check_user_badges(target_user_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
    badge_record record;
    books_read_count integer;
    max_streak integer;
    genre_count integer;
    reviews_found integer;
    current_val integer;
    threshold_val integer;
begin
    -- Libros leídos
    select count(*) into books_read_count
    from public.user_books where user_id = target_user_id and status = 'READ';

    -- Racha más larga (días consecutivos con sesión de lectura)
    with daily_sessions as (
        select distinct date_trunc('day', created_at)::date as session_date
        from public.reading_sessions where user_id = target_user_id
    ), groups as (
        select session_date,
               session_date - (row_number() over (order by session_date) * interval '1 day') as grp
        from daily_sessions
    )
    select count(*) into max_streak from groups group by grp order by count(*) desc limit 1;
    if max_streak is null then max_streak := 0; end if;

    -- Exploración: géneros distintos entre los libros leídos
    select count(distinct b.genre) into genre_count
    from public.user_books ub
    join public.books b on b.id = ub.book_id
    where ub.user_id = target_user_id
      and ub.status = 'READ'
      and b.genre is not null
      and btrim(b.genre) <> '';
    if genre_count is null then genre_count := 0; end if;

    for badge_record in select * from public.badges loop
        if exists (select 1 from public.user_badges where user_id = target_user_id and badge_id = badge_record.id) then
            continue;
        end if;

        -- Insignias sin threshold (p.ej. 'miembro_fundador') no se otorgan aquí.
        begin
            threshold_val := (badge_record.criteria->>'threshold')::integer;
        exception when others then
            threshold_val := null;
        end;
        if threshold_val is null then continue; end if;

        current_val := 0;
        if badge_record.criteria->>'type' = 'books_read' then
            current_val := books_read_count;
        elsif badge_record.criteria->>'type' = 'reviews_count' then
            select count(*) into reviews_found
            from public.reviews where user_id = target_user_id and length(coalesce(content, '')) > 0;
            current_val := reviews_found;
        elsif badge_record.criteria->>'type' = 'streak_days' then
            current_val := max_streak;
        elsif badge_record.criteria->>'type' = 'genres_count' then
            current_val := genre_count;
        end if;

        if current_val >= threshold_val then
            insert into public.user_badges (user_id, badge_id)
            values (target_user_id, badge_record.id)
            on conflict (user_id, badge_id) do nothing;
        end if;
    end loop;
end;
$$;

-- Reevaluar a todos los usuarios (otorga exploración/racha a quien ya cumpla).
do $$
declare r record;
begin
    for r in select id from public.profiles loop
        perform public.check_user_badges(r.id);
    end loop;
end $$;
