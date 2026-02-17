
-- Add current_page column to user_books
alter table public.user_books 
add column current_page integer default 0;
