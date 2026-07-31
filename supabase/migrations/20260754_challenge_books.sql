-- Retos CURADOS (goal_type = 'manual'): el usuario marca qué libros de su
-- biblioteca cuentan para el reto (temáticos, p.ej. "3 clásicos rusos").
-- El progreso = nº de libros atribuidos. Los retos automáticos (books/genre/pages)
-- no usan esta tabla.

create table if not exists public.challenge_books (
    id uuid primary key default gen_random_uuid(),
    challenge_id uuid not null references public.challenges(id) on delete cascade,
    user_id uuid not null references public.profiles(id) on delete cascade,
    book_id uuid not null references public.books(id) on delete cascade,
    created_at timestamptz not null default now(),
    unique (challenge_id, user_id, book_id)
);
create index if not exists challenge_books_lookup_idx on public.challenge_books (challenge_id, user_id);

-- RLS: cada usuario gestiona SOLO sus propias atribuciones.
alter table public.challenge_books enable row level security;

drop policy if exists "own challenge_books read" on public.challenge_books;
create policy "own challenge_books read" on public.challenge_books
    for select to authenticated using (user_id = auth.uid());

drop policy if exists "own challenge_books insert" on public.challenge_books;
create policy "own challenge_books insert" on public.challenge_books
    for insert to authenticated with check (user_id = auth.uid());

drop policy if exists "own challenge_books delete" on public.challenge_books;
create policy "own challenge_books delete" on public.challenge_books
    for delete to authenticated using (user_id = auth.uid());
