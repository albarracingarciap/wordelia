-- Add candidate priority so store captures can be reviewed before entering wishlist_items.

ALTER TABLE public.wishlist_candidates
ADD COLUMN IF NOT EXISTS priority TEXT NOT NULL DEFAULT 'MEDIUM'
CHECK (priority IN ('HIGH', 'MEDIUM', 'LOW'));
