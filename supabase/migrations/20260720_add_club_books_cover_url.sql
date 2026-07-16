-- Portada elegida para la lectura del club.
-- Guarda la portada del libro seleccionado (tal cual viene de isbndb), para
-- conservar la edición/portada escogida por el admin aunque el book_id resuelto
-- (ficha canónica en `books`) tenga otra portada o ninguna.
alter table public.club_books
  add column if not exists cover_url text;
