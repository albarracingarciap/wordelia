-- Migration to update RLS policies for real Privacy control on wishlists

-- We need to ensure that anonymous users or other logged-in users
-- can only read wishlists that are 'public' or 'shared'.
-- 'private' wishlists should only be readable by their owner.

-- Drop existing SELECT policy if it exists (usually it allows all or requires auth, depending on how it was set up)
DROP POLICY IF EXISTS "Anyone can view wishlists" ON wishlists;
DROP POLICY IF EXISTS "Users can view their own wishlists" ON wishlists;
DROP POLICY IF EXISTS "Public and shared wishlists are viewable by everyone" ON wishlists;


-- Create new policies
-- 1. Owner can do everything (this might already be covered by existing policies, but just to be safe)
CREATE POLICY "Owners have full access to their wishlists"
ON wishlists
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 2. Anyone (even guests) can view public or shared wishlists
CREATE POLICY "Public and shared wishlists are viewable by everyone"
ON wishlists
FOR SELECT
USING (privacy IN ('public', 'shared'));


-- Note: wishlist_items also need to inherit this privacy
DROP POLICY IF EXISTS "Anyone can view wishlist items" ON wishlist_items;
DROP POLICY IF EXISTS "Users can view their own wishlist items" ON wishlist_items;

CREATE POLICY "Owners have full access to their wishlist items"
ON wishlist_items
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM wishlists 
        WHERE wishlists.id = wishlist_items.wishlist_id 
        AND wishlists.user_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM wishlists 
        WHERE wishlists.id = wishlist_items.wishlist_id 
        AND wishlists.user_id = auth.uid()
    )
);

CREATE POLICY "Items in public/shared wishlists are viewable by everyone"
ON wishlist_items
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM wishlists 
        WHERE wishlists.id = wishlist_items.wishlist_id 
        AND wishlists.privacy IN ('public', 'shared')
    )
);
