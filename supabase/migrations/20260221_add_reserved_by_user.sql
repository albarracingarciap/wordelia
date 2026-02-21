-- Migration to add reserved_by_user_id to wishlist_items table

ALTER TABLE public.wishlist_items
ADD COLUMN reserved_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Add a policy so users can always see the items they have reserved, 
-- even if the wishlist privacy changes later.
CREATE POLICY "Users can view items they have reserved"
ON public.wishlist_items FOR SELECT
USING (reserved_by_user_id = auth.uid());
