-- Gift preparation checklist status.
-- Keeps gift ideas useful beyond purchase: idea -> reserved -> purchased -> wrapped -> delivered.

ALTER TABLE public.gift_ideas
ADD COLUMN IF NOT EXISTS gift_status TEXT NOT NULL DEFAULT 'IDEA'
CHECK (gift_status IN ('IDEA', 'RESERVED', 'PURCHASED', 'WRAPPED', 'DELIVERED'));

UPDATE public.gift_ideas
SET gift_status = 'PURCHASED'
WHERE is_purchased = TRUE
AND gift_status = 'IDEA';
