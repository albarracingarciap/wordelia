-- Migration to add target_date to wishlists table

ALTER TABLE wishlists
ADD COLUMN target_date DATE NULL;

-- Optionally, we can also add a comment
COMMENT ON COLUMN wishlists.target_date IS 'Optional target date for the wishlist event (e.g., birthday, anniversary)';
