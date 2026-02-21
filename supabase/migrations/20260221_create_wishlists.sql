-- =============================================
-- WISHLISTS (Mis Deseos)
-- Listas personales de libros que el usuario
-- quiere que le regalen.
-- =============================================

CREATE TABLE IF NOT EXISTS public.wishlists (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name        TEXT NOT NULL,
    description TEXT,
    emoji       TEXT DEFAULT '📚',
    -- public: cualquiera con el enlace puede ver la lista completa
    -- private: solo el propietario 
    -- shared: amigos específicos (compartido por enlace, reservas ocultas)
    privacy     TEXT NOT NULL DEFAULT 'public' CHECK (privacy IN ('public', 'private', 'shared')),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION public.handle_wishlist_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

CREATE TRIGGER on_wishlist_updated
    BEFORE UPDATE ON public.wishlists
    FOR EACH ROW EXECUTE FUNCTION public.handle_wishlist_updated_at();

-- Índice para consultas por usuario
CREATE INDEX IF NOT EXISTS wishlists_user_id_idx ON public.wishlists(user_id);

-- =============================================
-- WISHLIST ITEMS (Libros dentro de cada lista)
-- =============================================

CREATE TABLE IF NOT EXISTS public.wishlist_items (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wishlist_id     UUID NOT NULL REFERENCES public.wishlists(id) ON DELETE CASCADE,
    -- Referencia al libro en la tabla books de Google Books
    book_id         TEXT,               -- Google Books volume ID
    -- Campos desnormalizados del libro (snapshot)
    title           TEXT NOT NULL,
    author          TEXT,
    cover_url       TEXT,
    price           NUMERIC(10, 2),
    -- priority: HIGH priority items appear first
    priority        TEXT NOT NULL DEFAULT 'MEDIUM' CHECK (priority IN ('HIGH', 'MEDIUM', 'LOW')),
    -- status: estado del ítem
    status          TEXT NOT NULL DEFAULT 'AVAILABLE' CHECK (status IN ('AVAILABLE', 'RESERVED', 'PURCHASED')),
    reserved_by     TEXT,               -- Nombre/info del reservante (no userId para mantener anonimato)
    -- Crowdfunding opcional
    crowdfunding_target     NUMERIC(10, 2),
    crowdfunding_collected  NUMERIC(10, 2) DEFAULT 0,
    -- Dedicatoria secreta (json)
    dedication      JSONB,              -- { message, from, style }
    -- Nota privada del dueño (solo la ve él)
    private_note    TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION public.handle_wishlist_item_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

CREATE TRIGGER on_wishlist_item_updated
    BEFORE UPDATE ON public.wishlist_items
    FOR EACH ROW EXECUTE FUNCTION public.handle_wishlist_item_updated_at();

CREATE INDEX IF NOT EXISTS wishlist_items_wishlist_id_idx ON public.wishlist_items(wishlist_id);

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlist_items ENABLE ROW LEVEL SECURITY;

-- wishlists: el propietario puede hacer todo
CREATE POLICY "Owner can manage wishlists"
    ON public.wishlists FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- wishlists: listas públicas y compartidas son visibles para cualquier usuario autenticado
CREATE POLICY "Public/shared wishlists are visible to authenticated users"
    ON public.wishlists FOR SELECT
    USING (
        auth.uid() = user_id       -- siempre puede ver las suyas
        OR privacy IN ('public', 'shared')
    );

-- wishlist_items: el propietario de la lista gestiona sus ítems
CREATE POLICY "Owner can manage wishlist items"
    ON public.wishlist_items FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.wishlists w
            WHERE w.id = wishlist_id AND w.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.wishlists w
            WHERE w.id = wishlist_id AND w.user_id = auth.uid()
        )
    );

-- wishlist_items: ítems de listas públicas/compartidas son visibles
CREATE POLICY "Items of public/shared wishlists are visible"
    ON public.wishlist_items FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.wishlists w
            WHERE w.id = wishlist_id
              AND (w.user_id = auth.uid() OR w.privacy IN ('public', 'shared'))
        )
    );
