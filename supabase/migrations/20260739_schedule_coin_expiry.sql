-- Monedas Wordelia: programa la caducidad por inactividad con pg_cron.
-- Ejecuta expire_inactive_coins(12) cada día; la función solo toca carteras sin
-- movimientos en 12 meses (cualquier ganar/gastar resetea el reloj), así que
-- correrla a diario es barato e idempotente.
-- Ejecutar una vez.
--
-- Si la creación de la extensión falla por permisos, habilita "pg_cron" desde el
-- panel de Supabase (Database → Extensions) y vuelve a ejecutar esta migración:
-- el resto (cron.schedule) es idempotente.

create extension if not exists pg_cron;

-- cron.schedule hace upsert por nombre de job: re-ejecutar esta migración
-- actualiza el job en vez de duplicarlo.
select cron.schedule(
    'expire-inactive-coins',
    '15 3 * * *',                              -- cada día a las 03:15 UTC
    $$ select public.expire_inactive_coins(12); $$
);
