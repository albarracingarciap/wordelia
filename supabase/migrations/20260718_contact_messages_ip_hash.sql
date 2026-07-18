-- =============================================
-- CONTACT MESSAGES · RATE LIMIT POR IP
-- Añade un hash de la IP del remitente para poder
-- limitar envíos de forma persistente (el contador en
-- memoria no se comparte entre instancias serverless).
--
-- Se guarda el HASH y nunca la IP en claro: sigue siendo
-- dato personal bajo RGPD, y para contar envíos basta con
-- un identificador estable.
-- =============================================

ALTER TABLE public.contact_messages
    ADD COLUMN IF NOT EXISTS ip_hash TEXT;

-- Índice para la consulta del rate limit: envíos de una IP
-- dentro de la ventana de tiempo reciente.
CREATE INDEX IF NOT EXISTS contact_messages_ip_created_idx
    ON public.contact_messages (ip_hash, created_at DESC);

-- Índice equivalente para el límite por email.
CREATE INDEX IF NOT EXISTS contact_messages_email_created_idx
    ON public.contact_messages (email, created_at DESC);

-- La política de INSERT existente sigue valiendo: el visitante anónimo
-- no puede leer nada, y el recuento del rate limit se hace con service_role.
