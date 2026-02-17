-- Add publisher column to books table
ALTER TABLE public.books 
ADD COLUMN IF NOT EXISTS publisher text;
