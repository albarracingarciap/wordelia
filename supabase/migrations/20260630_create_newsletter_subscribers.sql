-- =============================================
-- NEWSLETTER SUBSCRIBERS
-- Suscripciones a la newsletter desde la landing
-- (footer). Captura de email anónima (visitantes
-- no autenticados) + usuarios registrados.
-- =============================================

CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    -- El email se almacena siempre en minúsculas (normalizado en la app),
    -- por lo que UNIQUE a nivel de columna garantiza unicidad real.
    email       TEXT NOT NULL UNIQUE,
    source      TEXT NOT NULL DEFAULT 'footer',
    -- subscribed: activo / unsubscribed: dado de baja
    status      TEXT NOT NULL DEFAULT 'subscribed' CHECK (status IN ('subscribed', 'unsubscribed')),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION public.handle_newsletter_subscriber_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_newsletter_subscriber_updated ON public.newsletter_subscribers;
CREATE TRIGGER on_newsletter_subscriber_updated
    BEFORE UPDATE ON public.newsletter_subscribers
    FOR EACH ROW EXECUTE FUNCTION public.handle_newsletter_subscriber_updated_at();

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- Cualquiera (visitante anónimo o usuario autenticado) puede suscribirse.
-- No se concede SELECT: las suscripciones solo se leen vía service_role
-- (panel de administración / exportación), nunca desde el cliente.
CREATE POLICY "Anyone can subscribe to newsletter"
    ON public.newsletter_subscribers FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);
