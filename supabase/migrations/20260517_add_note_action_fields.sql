alter table public.book_notes
add column if not exists is_highlighted boolean not null default false,
add column if not exists resolved_at timestamptz;

create index if not exists idx_book_notes_user_highlighted
on public.book_notes (user_id, is_highlighted);

create index if not exists idx_book_notes_user_resolved
on public.book_notes (user_id, resolved_at);
