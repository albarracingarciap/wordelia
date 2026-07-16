-- Pregunta de apertura de la lectura del club (una por libro/lectura).
-- Se muestra como gancho en la sección de clubs del home y en la ficha del club.
alter table public.club_books
  add column if not exists pregunta_apertura text;
