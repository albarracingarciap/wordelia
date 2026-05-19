-- Temporary candidate books captured from wishlist store mode.
-- Users can review these before adding them permanently to wishlist_items.

CREATE TABLE IF NOT EXISTS public.wishlist_candidates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wishlist_id UUID NOT NULL REFERENCES public.wishlists(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    source TEXT NOT NULL CHECK (source IN ('manual', 'isbn_scan', 'cover_photo')),
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'matched', 'needs_review', 'added', 'discarded')),
    title TEXT NOT NULL,
    author TEXT,
    isbn TEXT,
    cover_url TEXT,
    photo_url TEXT,
    price NUMERIC(10, 2),
    notes TEXT,
    confidence NUMERIC(4, 3),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS wishlist_candidates_wishlist_id_idx
ON public.wishlist_candidates(wishlist_id);

CREATE INDEX IF NOT EXISTS wishlist_candidates_user_id_status_idx
ON public.wishlist_candidates(user_id, status);

CREATE OR REPLACE FUNCTION public.handle_wishlist_candidate_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_wishlist_candidate_updated ON public.wishlist_candidates;

CREATE TRIGGER on_wishlist_candidate_updated
    BEFORE UPDATE ON public.wishlist_candidates
    FOR EACH ROW EXECUTE FUNCTION public.handle_wishlist_candidate_updated_at();

ALTER TABLE public.wishlist_candidates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owners can manage wishlist candidates" ON public.wishlist_candidates;

CREATE POLICY "Owners can manage wishlist candidates"
ON public.wishlist_candidates
FOR ALL
USING (
    EXISTS (
        SELECT 1
        FROM public.wishlists w
        WHERE w.id = wishlist_candidates.wishlist_id
        AND w.user_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM public.wishlists w
        WHERE w.id = wishlist_candidates.wishlist_id
        AND w.user_id = auth.uid()
    )
    AND user_id = auth.uid()
);
