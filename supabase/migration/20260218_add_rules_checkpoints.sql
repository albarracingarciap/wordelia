-- Add rules to clubs table
alter table public.clubs add column rules jsonb default '[]'::jsonb;

-- Add checkpoints to club_books table
alter table public.club_books add column checkpoints jsonb default '[]'::jsonb;
