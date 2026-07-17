-- Fase 1 — Renovación automática con PayPal Subscriptions API.
--
-- Convierte el modelo "pay-per-period" (Orders API) en suscripción recurrente:
--   * user_subscriptions y organization_subscriptions ganan los campos que
--     identifican la suscripción en PayPal (provider_subscription_id) y su plan.
--   * Se amplían los estados posibles para reflejar el ciclo de vida de PayPal
--     (past_due, expired, paused).
--   * Nueva tabla payment_webhook_events: idempotencia real de webhooks. Con
--     suscripciones no hay una fila en `orders` por renovación, así que la
--     de-duplicación se hace por el id de evento de PayPal.
--
-- Nota: los datos actuales son de prueba (pay-per-period). Se resetean para
-- partir limpio; no se conserva ninguna suscripción antigua.

-- 0. Reset de datos de prueba ------------------------------------------------

-- Usuarios: sin fila => plan gratuito (explorador), que es el default correcto.
truncate table public.user_subscriptions;

-- Organizaciones: NO truncar (dejaría orgs sin su fila free y el trigger solo
-- provisiona en el INSERT de la organización). Reseteamos a free/active limpio.
update public.organization_subscriptions
  set tier = 'free',
      status = 'active',
      billing_period = null,
      current_period_end = null,
      external_ref = null,
      metadata = '{}'::jsonb,
      updated_at = now();

-- Red de seguridad: cualquier organización sin fila recibe su free.
insert into public.organization_subscriptions (organization_id, tier, status)
select o.id, 'free', 'active'
from public.organizations o
left join public.organization_subscriptions s on s.organization_id = o.id
where s.organization_id is null
on conflict (organization_id) do nothing;

-- 1. user_subscriptions ------------------------------------------------------

alter table public.user_subscriptions
  add column if not exists provider text not null default 'paypal',
  add column if not exists provider_subscription_id text,
  add column if not exists provider_plan_id text;

-- Estados: PayPal puede llevar la suscripción a past_due (fallo de cobro),
-- paused (suspendida) o expired, además de active/cancelled.
alter table public.user_subscriptions
  drop constraint if exists user_subscriptions_status_check;
alter table public.user_subscriptions
  add constraint user_subscriptions_status_check
  check (status in ('active', 'past_due', 'cancelled', 'expired', 'paused'));

-- Una suscripción de PayPal (I-XXXX) mapea a una sola fila.
create unique index if not exists user_subscriptions_provider_sub_idx
  on public.user_subscriptions (provider_subscription_id)
  where provider_subscription_id is not null;

-- 2. organization_subscriptions ---------------------------------------------

alter table public.organization_subscriptions
  add column if not exists provider text not null default 'paypal',
  add column if not exists provider_subscription_id text,
  add column if not exists provider_plan_id text;

alter table public.organization_subscriptions
  drop constraint if exists organization_subscriptions_status_check;
alter table public.organization_subscriptions
  add constraint organization_subscriptions_status_check
  check (status in ('active', 'trialing', 'past_due', 'cancelled', 'expired', 'paused'));

create unique index if not exists organization_subscriptions_provider_sub_idx
  on public.organization_subscriptions (provider_subscription_id)
  where provider_subscription_id is not null;

-- 3. payment_webhook_events (idempotencia de webhooks) ----------------------

create table if not exists public.payment_webhook_events (
  id text primary key,                       -- id del evento de PayPal (clave de idempotencia)
  event_type text not null,                  -- p.ej. BILLING.SUBSCRIPTION.ACTIVATED
  resource_type text,                        -- p.ej. subscription / sale
  provider text not null default 'paypal',
  payload jsonb not null default '{}'::jsonb,
  processed_at timestamptz not null default now()
);

create index if not exists payment_webhook_events_type_idx
  on public.payment_webhook_events (event_type);

-- Solo el service role (webhook) escribe/lee; nadie más. RLS activo sin
-- políticas => bloqueado para authenticated/anon, service role la bypassa.
alter table public.payment_webhook_events enable row level security;
