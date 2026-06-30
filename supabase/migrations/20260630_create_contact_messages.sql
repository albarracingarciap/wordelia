-- =============================================
-- CONTACT MESSAGES
-- Mensajes enviados desde el formulario de /contacto.
-- Captura anónima (visitantes no autenticados) y
-- usuarios registrados.
-- =============================================

CREATE TABLE IF NOT EXISTS public.contact_messages (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        TEXT NOT NULL,
    email       TEXT NOT NULL,
    -- subject = motivo del mensaje (general, clubs, librerias, educacion, otro)
    subject     TEXT NOT NULL DEFAULT 'general',
    message     TEXT NOT NULL,
    -- source = de dónde vino el visitante (?source=... en la URL)
    source      TEXT,
    -- status del mensaje para gestión interna
    status      TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'read', 'replied', 'archived')),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índice para listar por estado y fecha en el panel de administración
CREATE INDEX IF NOT EXISTS contact_messages_status_created_idx
    ON public.contact_messages (status, created_at DESC);

-- Actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION public.handle_contact_message_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_contact_message_updated ON public.contact_messages;
CREATE TRIGGER on_contact_message_updated
    BEFORE UPDATE ON public.contact_messages
    FOR EACH ROW EXECUTE FUNCTION public.handle_contact_message_updated_at();

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

-- Cualquiera (visitante anónimo o usuario autenticado) puede enviar un mensaje.
-- No se concede SELECT: los mensajes solo se leen vía service_role
-- (panel de administración), nunca desde el cliente.
CREATE POLICY "Anyone can send a contact message"
    ON public.contact_messages FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);
