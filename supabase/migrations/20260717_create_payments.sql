-- Payments: generic orders + user subscriptions (PayPal Orders API, pay-per-period).

-- 1. orders — one row per checkout attempt, product-agnostic.
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  product_type text not null check (product_type in ('org_subscription', 'user_plan', 'resource', 'club')),
  reference_id text not null,                 -- org_id | plan code | book_id | club_id
  plan_period text check (plan_period in ('monthly', 'annual')),
  resource_kind text check (resource_kind in ('guide', 'genome')),
  amount_cents integer not null,
  currency text not null default 'EUR',
  status text not null default 'created' check (status in ('created', 'approved', 'captured', 'failed', 'cancelled')),
  provider text not null default 'paypal',
  provider_order_id text unique,              -- PayPal order id (idempotency)
  provider_capture_id text,
  fulfilled_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists orders_user_idx on public.orders (user_id);
create index if not exists orders_provider_order_idx on public.orders (provider_order_id);

alter table public.orders enable row level security;

-- Users read their own orders; insert their own (create-order). Updates
-- (capture/webhook fulfillment) happen only via the service role.
create policy "Users read own orders"
  on public.orders for select to authenticated using (user_id = auth.uid());
create policy "Users create own orders"
  on public.orders for insert to authenticated with check (user_id = auth.uid());

-- 2. user_subscriptions — fulfillment target for paid user plans.
create table if not exists public.user_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles(id) on delete cascade,
  plan text not null check (plan in ('voraz', 'ai')),
  status text not null default 'active' check (status in ('active', 'expired', 'cancelled')),
  period text check (period in ('monthly', 'annual')),
  current_period_end timestamptz,
  external_ref text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_subscriptions enable row level security;

-- Users read their own subscription; writes only via service role.
create policy "Users read own subscription"
  on public.user_subscriptions for select to authenticated using (user_id = auth.uid());
