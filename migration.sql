-- Add missing columns to club_books table
ALTER TABLE club_books 
ADD COLUMN IF NOT EXISTS pace_config JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS checkpoints JSONB DEFAULT '[]'::jsonb;
