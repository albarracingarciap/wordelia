-- Fase C · Formato de lectura por libro.
-- Grano correcto: un usuario lee un libro concreto en un formato (papel/ebook/audio).
-- Valores canónicos: 'paper' | 'ebook' | 'audio' (el perfil usa 'physical' → se mapea a 'paper').

alter table public.user_books
    add column if not exists format text;

do $$
begin
    if not exists (
        select 1 from pg_constraint where conname = 'user_books_format_check'
    ) then
        alter table public.user_books
            add constraint user_books_format_check
            check (format is null or format in ('paper', 'ebook', 'audio'));
    end if;
end $$;

-- Backfill inicial: hereda la preferencia global de formato del perfil, para que
-- el gráfico "Formatos" tenga datos desde el primer momento. Se refina al registrar.
update public.user_books ub
set format = case p.reading_format_preference
        when 'physical' then 'paper'
        when 'ebook' then 'ebook'
        when 'audio' then 'audio'
        else null
    end
from public.profiles p
where ub.user_id = p.id
    and ub.format is null
    and p.reading_format_preference is not null
    and p.reading_format_preference in ('physical', 'ebook', 'audio');
