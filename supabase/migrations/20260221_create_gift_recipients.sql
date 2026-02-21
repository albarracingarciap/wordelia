-- =============================================
-- GIFT RECIPIENTS (Mis Regalos)
-- Perfiles de personas a las que el usuario
-- quiere regalar libros.
-- =============================================

CREATE TABLE IF NOT EXISTS public.gift_recipients (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name            TEXT NOT NULL,
    relation        TEXT,               -- "Pareja 💖", "Sobrino", "Amigo", etc.
    avatar_url      TEXT,               -- URL de foto (storage bucket)
    notes           TEXT,               -- Gustos literarios, notas
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION public.handle_gift_recipient_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

CREATE TRIGGER on_gift_recipient_updated
    BEFORE UPDATE ON public.gift_recipients
    FOR EACH ROW EXECUTE FUNCTION public.handle_gift_recipient_updated_at();

CREATE INDEX IF NOT EXISTS gift_recipients_user_id_idx ON public.gift_recipients(user_id);

-- =============================================
-- GIFT EVENTS (Fechas importantes por persona)
-- Recordatorios de cumpleaños, aniversarios, etc.
-- =============================================

CREATE TABLE IF NOT EXISTS public.gift_events (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_id    UUID NOT NULL REFERENCES public.gift_recipients(id) ON DELETE CASCADE,
    name            TEXT NOT NULL,      -- "Cumpleaños", "Aniversario", "Navidad"
    event_date      DATE NOT NULL,      -- Fecha del evento (año irrelevante si es anual)
    is_recurring    BOOLEAN NOT NULL DEFAULT TRUE,  -- Si se repite cada año
    remind_days_before INT DEFAULT 7,   -- Días de antelación para el aviso
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS gift_events_recipient_id_idx ON public.gift_events(recipient_id);

-- =============================================
-- GIFT IDEAS (Libros guardados para regalar)
-- Los ítems que el usuario quiere regalar a
-- cada persona.
-- =============================================

CREATE TABLE IF NOT EXISTS public.gift_ideas (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_id    UUID NOT NULL REFERENCES public.gift_recipients(id) ON DELETE CASCADE,
    book_id         TEXT,               -- Google Books volume ID
    title           TEXT NOT NULL,
    author          TEXT,
    cover_url       TEXT,
    price           NUMERIC(10, 2),
    is_purchased    BOOLEAN NOT NULL DEFAULT FALSE,
    is_secret       BOOLEAN NOT NULL DEFAULT TRUE,   -- Siempre secreto por defecto
    private_note    TEXT,               -- Por qué crees que le gustará
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS gift_ideas_recipient_id_idx ON public.gift_ideas(recipient_id);

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

ALTER TABLE public.gift_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gift_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gift_ideas ENABLE ROW LEVEL SECURITY;

-- Solo el propietario gestiona sus perfiles de regalo
CREATE POLICY "Owner manages gift recipients"
    ON public.gift_recipients FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Solo el propietario ve los eventos de sus perfiles
CREATE POLICY "Owner manages gift events"
    ON public.gift_events FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.gift_recipients r
            WHERE r.id = recipient_id AND r.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.gift_recipients r
            WHERE r.id = recipient_id AND r.user_id = auth.uid()
        )
    );

-- Solo el propietario ve sus ideas de regalo (siempre privadas)
CREATE POLICY "Owner manages gift ideas"
    ON public.gift_ideas FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.gift_recipients r
            WHERE r.id = recipient_id AND r.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.gift_recipients r
            WHERE r.id = recipient_id AND r.user_id = auth.uid()
        )
    );
