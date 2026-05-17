alter table public.user_book_emotions
add column if not exists reading_session_id uuid references public.reading_sessions(id) on delete set null;

create index if not exists idx_user_book_emotions_reading_session
on public.user_book_emotions (reading_session_id);
