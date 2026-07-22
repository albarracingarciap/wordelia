-- Monedas Wordelia W3: eventos organizados por Wordelia (oferta gastable además
-- de los clubs oficiales) + caducidad de monedas por inactividad.
-- Los eventos se precian directamente EN MONEDAS (no en euros).
-- Ejecutar una vez.

-- Amplía los motivos del ledger para incluir el gasto en eventos.
alter table public.coin_transactions drop constraint if exists coin_transactions_reason_check;
alter table public.coin_transactions add constraint coin_transactions_reason_check
    check (reason in (
        'referral_reward', 'referral_welcome', 'spend_official_club', 'spend_event', 'admin_adjust', 'expiry'
    ));

-- Eventos Wordelia.
create table if not exists public.wordelia_events (
    id uuid primary key default gen_random_uuid(),
    title text not null,
    description text,
    cover_url text,
    location text,                 -- p.ej. "Online" o una ciudad/lugar
    starts_at timestamptz not null,
    price_coins integer not null default 0 check (price_coins >= 0),
    capacity integer check (capacity is null or capacity > 0),
    is_published boolean not null default false,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);
create index if not exists wordelia_events_starts_idx on public.wordelia_events (starts_at);

-- Entradas (una por usuario y evento).
create table if not exists public.wordelia_event_tickets (
    id uuid primary key default gen_random_uuid(),
    event_id uuid not null references public.wordelia_events(id) on delete cascade,
    user_id uuid not null references public.profiles(id) on delete cascade,
    coins_spent integer not null default 0,
    created_at timestamptz not null default now(),
    unique (event_id, user_id)
);
create index if not exists wordelia_event_tickets_user_idx on public.wordelia_event_tickets (user_id);

-- RLS: eventos publicados legibles por autenticados; entradas propias.
alter table public.wordelia_events enable row level security;
drop policy if exists "published events read" on public.wordelia_events;
create policy "published events read" on public.wordelia_events
    for select to authenticated using (is_published = true);

alter table public.wordelia_event_tickets enable row level security;
drop policy if exists "own tickets read" on public.wordelia_event_tickets;
create policy "own tickets read" on public.wordelia_event_tickets
    for select to authenticated using (user_id = auth.uid());

-- Gastar monedas para conseguir entrada a un evento (espejo de spend_coins_official_club).
create or replace function public.spend_coins_event(target_event_id uuid)
returns table (already_ticket boolean, coins_spent integer, new_balance integer)
language plpgsql security definer set search_path = public as $$
declare
    v_uid uuid := auth.uid();
    v_event record;
    v_needed integer;
    v_balance integer;
    v_taken integer;
begin
    if v_uid is null then raise exception 'No autenticado'; end if;

    select id, is_published, price_coins, capacity, starts_at
      into v_event
      from public.wordelia_events where id = target_event_id;
    if v_event.id is null then raise exception 'Evento no encontrado'; end if;
    if not v_event.is_published then raise exception 'Este evento no está disponible'; end if;

    -- ¿Ya tiene entrada? Idempotente: no cobra de nuevo.
    if exists (select 1 from public.wordelia_event_tickets where event_id = target_event_id and user_id = v_uid) then
        select balance into v_balance from public.coin_wallets where user_id = v_uid;
        return query select true, 0, coalesce(v_balance, 0);
        return;
    end if;

    -- Aforo (si lo hay).
    if v_event.capacity is not null then
        select count(*) into v_taken from public.wordelia_event_tickets where event_id = target_event_id;
        if v_taken >= v_event.capacity then raise exception 'El evento ha alcanzado su aforo'; end if;
    end if;

    v_needed := v_event.price_coins;

    -- Bloquea la cartera para serializar gastos concurrentes.
    select balance into v_balance from public.coin_wallets where user_id = v_uid for update;
    if coalesce(v_balance, 0) < v_needed then
        raise exception 'No tienes monedas suficientes (necesitas %)', v_needed;
    end if;

    if v_needed > 0 then
        v_balance := public.credit_coins(v_uid, -v_needed, 'spend_event', target_event_id::text);
    else
        v_balance := coalesce(v_balance, 0);
    end if;

    insert into public.wordelia_event_tickets (event_id, user_id, coins_spent)
    values (target_event_id, v_uid, v_needed);

    return query select false, v_needed, v_balance;
end;
$$;
grant execute on function public.spend_coins_event(uuid) to authenticated;

-- Caducidad por inactividad: expira el saldo de carteras sin movimientos en
-- p_months meses (registra una fila 'expiry' en el ledger y pone el saldo a 0).
-- Interno: pensado para pg_cron o disparo administrativo. No se concede a public.
create or replace function public.expire_inactive_coins(p_months integer default 12)
returns integer language plpgsql security definer set search_path = public as $$
declare
    v_wallet record;
    v_count integer := 0;
begin
    for v_wallet in
        select user_id, balance from public.coin_wallets
        where balance > 0 and updated_at < now() - make_interval(months => p_months)
    loop
        perform public.credit_coins(v_wallet.user_id, -v_wallet.balance, 'expiry', null);
        v_count := v_count + 1;
    end loop;
    return v_count;
end;
$$;
revoke execute on function public.expire_inactive_coins(integer) from public;
