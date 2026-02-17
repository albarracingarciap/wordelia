-- Migration: Add PAUSED status to reading_status enum

-- 1. Add 'PAUSED' value to the enum type
ALTER TYPE public.reading_status ADD VALUE IF NOT EXISTS 'PAUSED';

-- Note: This change allows the 'PAUSED' status to be used in the user_books table immediately.
