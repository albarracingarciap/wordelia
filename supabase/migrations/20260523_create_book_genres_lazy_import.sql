create table if not exists public.genres (
  id uuid default uuid_generate_v4() primary key,
  name text not null unique,
  slug text not null unique,
  description text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists public.book_genres (
  book_id uuid not null references public.books(id) on delete cascade,
  genre_id uuid not null references public.genres(id) on delete cascade,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (book_id, genre_id)
);

create unique index if not exists books_isbn_unique_idx
  on public.books (isbn)
  where isbn is not null and btrim(isbn) <> '';

create index if not exists idx_book_genres_book_id on public.book_genres(book_id);
create index if not exists idx_book_genres_genre_id on public.book_genres(genre_id);

alter table public.genres enable row level security;
alter table public.book_genres enable row level security;

drop policy if exists "Genres are viewable by everyone." on public.genres;
create policy "Genres are viewable by everyone."
  on public.genres for select
  using (true);

drop policy if exists "Book genres are viewable by everyone." on public.book_genres;
create policy "Book genres are viewable by everyone."
  on public.book_genres for select
  using (true);

create or replace function public.wordelia_slugify(value text)
returns text
language sql
immutable
as $$
  select trim(both '-' from regexp_replace(
    lower(translate(coalesce(value, ''), 'áàäâéèëêíìïîóòöôúùüûñçÁÀÄÂÉÈËÊÍÌÏÎÓÒÖÔÚÙÜÛÑÇ', 'aaaaeeeeiiiioooouuuuncAAAAEEEEIIIIOOOOUUUUNC')),
    '[^a-z0-9]+',
    '-',
    'g'
  ));
$$;

insert into public.genres (name, slug)
values
  ('Ficción contemporánea', public.wordelia_slugify('Ficción contemporánea')),
  ('Clásicos', public.wordelia_slugify('Clásicos')),
  ('Fantasía', public.wordelia_slugify('Fantasía')),
  ('Ciencia ficción', public.wordelia_slugify('Ciencia ficción')),
  ('Romance', public.wordelia_slugify('Romance')),
  ('Misterio/Thriller', public.wordelia_slugify('Misterio/Thriller')),
  ('No ficción', public.wordelia_slugify('No ficción')),
  ('Biografías', public.wordelia_slugify('Biografías')),
  ('Historia', public.wordelia_slugify('Historia')),
  ('Desarrollo personal', public.wordelia_slugify('Desarrollo personal')),
  ('Poesía', public.wordelia_slugify('Poesía')),
  ('Teatro', public.wordelia_slugify('Teatro')),
  ('Ensayo', public.wordelia_slugify('Ensayo')),
  ('Juvenil', public.wordelia_slugify('Juvenil')),
  ('Terror', public.wordelia_slugify('Terror')),
  ('Distopía', public.wordelia_slugify('Distopía')),
  ('Realismo mágico', public.wordelia_slugify('Realismo mágico')),
  ('Literatura LGBTQ+', public.wordelia_slugify('Literatura LGBTQ+')),
  ('Aventura', public.wordelia_slugify('Aventura')),
  ('Ficción histórica', public.wordelia_slugify('Ficción histórica')),
  ('Literatura universal', public.wordelia_slugify('Literatura universal')),
  ('Novela literaria', public.wordelia_slugify('Novela literaria')),
  ('General', public.wordelia_slugify('General'))
on conflict (slug) do update
set name = excluded.name;

create or replace function public.upsert_book_with_genres(
  p_title text,
  p_author_name text,
  p_cover_url text,
  p_description text,
  p_isbn text,
  p_page_count integer,
  p_published_date date,
  p_publisher text,
  p_language text,
  p_genres text[]
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_author_id uuid;
  v_book_id uuid;
  v_genre_name text;
  v_genre_slug text;
  v_genre_id uuid;
begin
  select id into v_author_id
  from public.authors
  where lower(name) = lower(coalesce(nullif(btrim(p_author_name), ''), 'Autor desconocido'))
  limit 1;

  if v_author_id is null then
    insert into public.authors (name)
    values (coalesce(nullif(btrim(p_author_name), ''), 'Autor desconocido'))
    returning id into v_author_id;
  end if;

  insert into public.books (
    title,
    author_id,
    cover_url,
    description,
    isbn,
    page_count,
    published_date,
    publisher,
    language,
    genome_data
  )
  values (
    p_title,
    v_author_id,
    p_cover_url,
    p_description,
    nullif(btrim(p_isbn), ''),
    p_page_count,
    p_published_date,
    p_publisher,
    p_language,
    '{}'::jsonb
  )
  on conflict (isbn) where isbn is not null and btrim(isbn) <> ''
  do update set
    title = excluded.title,
    author_id = excluded.author_id,
    cover_url = coalesce(excluded.cover_url, public.books.cover_url),
    description = coalesce(excluded.description, public.books.description),
    page_count = coalesce(excluded.page_count, public.books.page_count),
    published_date = coalesce(excluded.published_date, public.books.published_date),
    publisher = coalesce(excluded.publisher, public.books.publisher),
    language = coalesce(excluded.language, public.books.language)
  returning id into v_book_id;

  foreach v_genre_name in array coalesce(p_genres, array['General']::text[]) loop
    v_genre_name := coalesce(nullif(btrim(v_genre_name), ''), 'General');
    v_genre_slug := public.wordelia_slugify(v_genre_name);

    insert into public.genres (name, slug)
    values (v_genre_name, v_genre_slug)
    on conflict (slug) do update
    set name = excluded.name
    returning id into v_genre_id;

    insert into public.book_genres (book_id, genre_id)
    values (v_book_id, v_genre_id)
    on conflict do nothing;
  end loop;

  return v_book_id;
end;
$$;
