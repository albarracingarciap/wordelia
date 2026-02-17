-- Add current_page column to user_books table
ALTER TABLE public.user_books 
ADD COLUMN IF NOT EXISTS current_page integer DEFAULT 0;
