-- Fase 0 · Progreso agnóstico del formato.
-- Métrica canónica cross-formato: progress_percent (0-100), calculada desde la unidad
-- nativa de cada formato (páginas para paper/ebook, tiempo para audio) y usada por rachas,
-- comparativas y visualización. Los campos nativos (current_page, reading_sessions.duration_seconds)
-- se conservan; audio_total_seconds guarda la duración total del audiolibro (la mete el usuario).

alter table public.user_books
    add column if not exists progress_percent numeric;

alter table public.user_books
    add column if not exists audio_total_seconds integer;

do $$
begin
    if not exists (
        select 1 from pg_constraint where conname = 'user_books_progress_percent_check'
    ) then
        alter table public.user_books
            add constraint user_books_progress_percent_check
            check (progress_percent is null or (progress_percent >= 0 and progress_percent <= 100));
    end if;

    if not exists (
        select 1 from pg_constraint where conname = 'user_books_audio_total_seconds_check'
    ) then
        alter table public.user_books
            add constraint user_books_audio_total_seconds_check
            check (audio_total_seconds is null or audio_total_seconds > 0);
    end if;
end $$;

-- Backfill de progress_percent para el estado existente (todo es papel/páginas hasta ahora):
-- current_page / page_count de la edición del usuario, o la edición preferida del libro.
update public.user_books ub
set progress_percent = least(100, round((ub.current_page::numeric / e.page_count) * 100, 1))
from public.editions e
where e.id = coalesce(
        ub.edition_id,
        (select b.preferred_edition_id from public.books b where b.id = ub.book_id)
    )
    and ub.progress_percent is null
    and ub.current_page is not null and ub.current_page > 0
    and e.page_count is not null and e.page_count > 0;

-- Libros marcados como terminados: 100% aunque no haya page_count.
update public.user_books ub
set progress_percent = 100
where ub.status = 'READ'
    and ub.progress_percent is null;
