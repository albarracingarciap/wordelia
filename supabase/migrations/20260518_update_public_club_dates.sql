update public.club_books
set start_date = date '2026-07-15'
where book_id in (
    select id
    from public.books
    where title ilike '%Fahrenheit%'
       or title ilike '1984%'
)
and exists (
    select 1
    from public.clubs
    where clubs.id = club_books.club_id
      and clubs.is_official = true
);

update public.club_books
set start_date = date '2026-08-15'
where book_id in (
    select id
    from public.books
    where title ilike '%Matar a un ruise%'
       or title ilike 'Ensayo sobre la ceguera%'
       or title ilike '%Blindness%'
)
and exists (
    select 1
    from public.clubs
    where clubs.id = club_books.club_id
      and clubs.is_official = true
);

update public.books
set title = 'Ensayo sobre la ceguera'
where title ilike 'Ensayo sobre la ceguera%';

update public.official_clubs
set start_date = date '2026-07-15'
where coalesce(book_data->>'title', '') ilike '%Fahrenheit%'
   or coalesce(book_data->>'title', '') ilike '1984%';

update public.official_clubs
set start_date = date '2026-08-15'
where coalesce(book_data->>'title', '') ilike '%Matar a un ruise%'
   or coalesce(book_data->>'title', '') ilike 'Ensayo sobre la ceguera%'
   or coalesce(book_data->>'title', '') ilike '%Blindness%';

update public.official_clubs
set book_data = jsonb_set(book_data, '{title}', to_jsonb('Ensayo sobre la ceguera'::text), true)
where book_data is not null
  and coalesce(book_data->>'title', '') ilike 'Ensayo sobre la ceguera%';

update public.official_clubs
set start_date = date '2026-06-15'
where is_featured = true
   or coalesce(book_data->>'title', '') ilike '%cuento de la criada%'
   or coalesce(book_data->>'title', '') ilike '%handmaid%';
