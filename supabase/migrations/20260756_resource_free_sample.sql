-- Muestra gratis de recursos: un flag por recurso (guía/genoma) que concede
-- acceso a CUALQUIER usuario registrado, sin plan ni compra. Sustituye a las
-- demos públicas hardcodeadas como único acceso gratuito dentro de la app.
--
-- El túnel es la muestra gratis de lanzamiento: marcamos su guía y su genoma.
-- (Un admin podrá marcar/desmarcar más muestras en el futuro.)

alter table public.book_guides add column if not exists is_free boolean not null default false;
alter table public.book_literary_chromosomes add column if not exists is_free boolean not null default false;

-- Marca El túnel (todas sus fichas con recurso) como muestra gratis.
update public.book_guides g set is_free = true
from public.books b
where b.id = g.book_id and lower(btrim(b.title)) in ('el túnel', 'el tunel');

update public.book_literary_chromosomes c set is_free = true
from public.books b
where b.id = c.book_id and lower(btrim(b.title)) in ('el túnel', 'el tunel');
