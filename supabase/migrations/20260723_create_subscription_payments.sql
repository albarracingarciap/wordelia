-- Fase 5 — Historial de pagos de suscripción.
--
-- Con suscripciones no hay una fila en `orders` por renovación (solo el alta), así
-- que cada cobro (inicial y renovaciones) se registra aquí desde el webhook
-- PAYMENT.SALE.COMPLETED. Alimenta el historial de la UI, los recibos por email y
-- la base para futuras facturas.

create table if not exists public.subscription_payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  provider text not null default 'paypal',
  provider_subscription_id text,               -- PayPal subscription id (I-XXXX)
  provider_payment_id text unique,             -- PayPal sale id (idempotencia)
  product_type text check (product_type in ('user_plan', 'org_subscription')),
  reference_id text,                           -- plan code | org id
  amount_cents integer not null,
  currency text not null default 'EUR',
  status text not null default 'completed' check (status in ('completed', 'refunded', 'failed')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists subscription_payments_user_idx on public.subscription_payments (user_id);
create index if not exists subscription_payments_sub_idx on public.subscription_payments (provider_subscription_id);

alter table public.subscription_payments enable row level security;

-- El usuario lee sus propios pagos; las escrituras (webhook) van solo por service role.
create policy "Users read own payments"
  on public.subscription_payments for select to authenticated using (user_id = auth.uid());
