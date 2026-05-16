create or replace function public.update_club_book_details_for_admin(
    target_club_id uuid,
    target_book_id uuid,
    book_title text,
    book_author text,
    book_cover_url text default null,
    book_description text default null,
    book_page_count integer default null,
    book_isbn text default null,
    book_publisher text default null
)
returns table (
    id uuid,
    title text,
    cover_url text,
    page_count integer,
    description text,
    isbn text,
    publisher text,
    author jsonb
)
language plpgsql
security definer
set search_path = public
as $$
declare
    clean_title text := nullif(trim(book_title), '');
    clean_author text := coalesce(nullif(trim(book_author), ''), 'Autor desconocido');
    resolved_author_id uuid;
begin
    if clean_title is null then
        raise exception 'El titulo es obligatorio';
    end if;

    if not exists (
        select 1
        from public.club_members
        where club_id = target_club_id
          and user_id = auth.uid()
          and role in ('admin', 'moderator')
    ) then
        raise exception 'Sin permisos';
    end if;

    if not exists (
        select 1
        from public.club_books
        where club_id = target_club_id
          and book_id = target_book_id
    ) then
        raise exception 'Este libro no pertenece al club';
    end if;

    select authors.id
    into resolved_author_id
    from public.authors
    where authors.name = clean_author
    limit 1;

    if resolved_author_id is null then
        insert into public.authors (name)
        values (clean_author)
        returning authors.id into resolved_author_id;
    end if;

    update public.books
    set
        title = clean_title,
        author_id = resolved_author_id,
        cover_url = nullif(trim(coalesce(book_cover_url, '')), ''),
        description = coalesce(book_description, ''),
        page_count = case when book_page_count is not null and book_page_count > 0 then book_page_count else null end,
        isbn = nullif(trim(coalesce(book_isbn, '')), ''),
        publisher = nullif(trim(coalesce(book_publisher, '')), '')
    where books.id = target_book_id;

    return query
    select
        books.id,
        books.title,
        books.cover_url,
        books.page_count,
        books.description,
        books.isbn,
        books.publisher,
        jsonb_build_object('name', authors.name) as author
    from public.books
    left join public.authors on authors.id = books.author_id
    where books.id = target_book_id;
end;
$$;

grant execute on function public.update_club_book_details_for_admin(
    uuid,
    uuid,
    text,
    text,
    text,
    text,
    integer,
    text,
    text
) to authenticated;
