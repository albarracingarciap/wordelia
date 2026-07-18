-- =============================================
-- LIMPIEZA DE LAS COLECCIONES POR ISBN
--
-- /explorar (pública y de la app) lee ya desde `book_id` -> books -> editions,
-- filtrando por guía y genoma publicados. Las filas antiguas guardaban un ISBN
-- y una copia del JSON de ISBNdb en `book_data`, desconectada del catálogo:
-- de 30 ISBN, solo 1 resolvía a un libro nuestro.
--
-- Ya no hay código que lea `isbn` ni `book_data`: se eliminaron
-- getAllCuratedCollectionsWithBooks, getCollectionBooks y getBookForPreview.
--
-- IRREVERSIBLE: borra filas y columnas. Haz copia de seguridad antes.
-- =============================================

-- Filas huérfanas del modelo antiguo (las nuevas siempre traen book_id).
delete from public.curated_collection_books
where book_id is null;

-- Las columnas quedan sin uso una vez borradas esas filas.
alter table public.curated_collection_books drop column if exists book_data;
alter table public.curated_collection_books drop column if exists isbn;

-- A partir de aquí book_id es obligatorio: una fila sin libro no significa nada.
alter table public.curated_collection_books
    alter column book_id set not null;
