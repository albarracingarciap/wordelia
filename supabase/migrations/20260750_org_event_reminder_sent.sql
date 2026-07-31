-- PWA Fase 0.3c · Idempotencia del recordatorio de evento de librería.
-- El cron /api/cron/event-reminders marca reminder_sent_at para no reenviar el
-- aviso del mismo evento en ejecuciones sucesivas.

alter table public.organization_events
    add column if not exists reminder_sent_at timestamptz;
