-- Add updated_at column to user_books table
ALTER TABLE public.user_books 
ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone default timezone('utc'::text, now());
