-- =============================================
-- PORTADAS DE LIBROS + COLECCIONES POR book_id
--
-- Dos cambios que van juntos para poder curar /explorar
-- desde el catálogo real (libros con guía y genoma) en
-- lugar de fotos JSON de ISBNdb:
--
-- 1. Bucket público `book-covers`, para dejar de depender
--    de que ISBNdb siga sirviendo sus imágenes.
-- 2. `curated_collection_books.book_id`, que sustituye al
--    par (isbn, book_data).
-- =============================================

-- ---------------------------------------------
-- 1. Bucket de portadas
-- ---------------------------------------------
insert into storage.buckets (id, name, public)
values ('book-covers', 'book-covers', true)
on conflict (id) do update set public = true;

drop policy if exists "Book covers are publicly readable" on storage.objects;
create policy "Book covers are publicly readable"
on storage.objects
for select
using (bucket_id = 'book-covers');

-- Solo el backend (service_role) sube portadas: se descargan desde el panel
-- de administración. No se concede insert/update/delete a usuarios.

-- ---------------------------------------------
-- 2. curated_collection_books -> book_id
-- ---------------------------------------------
alter table public.curated_collection_books
    add column if not exists book_id uuid references public.books(id) on delete cascade;

-- isbn y book_data dejan de ser obligatorios: durante la transición conviven
-- las filas antiguas (ISBN + JSON) con las nuevas (book_id). Se limpiarán
-- cuando /explorar lea solo del catálogo.
alter table public.curated_collection_books alter column isbn drop not null;
alter table public.curated_collection_books alter column book_data drop not null;

-- Un libro no debe aparecer dos veces en la misma colección.
create unique index if not exists curated_collection_books_collection_book_idx
    on public.curated_collection_books (collection_id, book_id)
    where book_id is not null;

-- Para resolver "¿en qué colección está este libro?" al pintar la cola.
create index if not exists curated_collection_books_book_idx
    on public.curated_collection_books (book_id)
    where book_id is not null;
