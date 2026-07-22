-- Monedas Wordelia: programa de fidelización de bucle cerrado (NO dinero real / no canjeable).
-- W1 = cartera + ledger + referidos (invitar amigos → monedas al unirse a su primer club).
-- El saldo es server-authoritative: nunca se edita a mano, solo mediante funciones security definer.
-- Ejecutar una vez.

-- 1. Cartera: saldo materializado por usuario.
create table if not exists public.coin_wallets (
    user_id uuid primary key references public.profiles(id) on delete cascade,
    balance integer not null default 0 check (balance >= 0),
    lifetime_earned integer not null default 0,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- 2. Ledger de movimientos (fuente de la verdad; el saldo es su acumulado).
create table if not exists public.coin_transactions (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references public.profiles(id) on delete cascade,
    amount integer not null,  -- >0 gana, <0 gasta
    reason text not null check (reason in (
        'referral_reward', 'referral_welcome', 'spend_official_club', 'admin_adjust', 'expiry'
    )),
    reference text,           -- id de referencia (referral_id, club_id, etc.)
    balance_after integer not null,
    created_at timestamptz not null default now()
);
create index if not exists coin_transactions_user_idx on public.coin_transactions (user_id, created_at desc);

-- 3. Código de invitación estable por usuario.
create table if not exists public.referral_codes (
    user_id uuid primary key references public.profiles(id) on delete cascade,
    code text unique not null,
    created_at timestamptz not null default now()
);

-- 4. Referidos (un usuario solo puede ser referido una vez).
create table if not exists public.referrals (
    id uuid primary key default gen_random_uuid(),
    referrer_id uuid not null references public.profiles(id) on delete cascade,
    referred_id uuid not null unique references public.profiles(id) on delete cascade,
    code text,
    status text not null default 'pending' check (status in ('pending', 'rewarded')),
    created_at timestamptz not null default now(),
    rewarded_at timestamptz,
    check (referrer_id <> referred_id)
);
create index if not exists referrals_referrer_idx on public.referrals (referrer_id);

-- RLS: cada quien lee lo suyo. Las escrituras van por funciones security definer / service role.
alter table public.coin_wallets enable row level security;
drop policy if exists "own wallet read" on public.coin_wallets;
create policy "own wallet read" on public.coin_wallets
    for select to authenticated using (user_id = auth.uid());

alter table public.coin_transactions enable row level security;
drop policy if exists "own tx read" on public.coin_transactions;
create policy "own tx read" on public.coin_transactions
    for select to authenticated using (user_id = auth.uid());

alter table public.referral_codes enable row level security;
drop policy if exists "own code read" on public.referral_codes;
create policy "own code read" on public.referral_codes
    for select to authenticated using (user_id = auth.uid());

alter table public.referrals enable row level security;
drop policy if exists "referral parties read" on public.referrals;
create policy "referral parties read" on public.referrals
    for select to authenticated using (referrer_id = auth.uid() or referred_id = auth.uid());

-- Helper interno: acredita/debita monedas y registra el movimiento de forma atómica.
-- NO se concede a authenticated (solo lo llaman otras funciones definer).
create or replace function public.credit_coins(p_user uuid, p_amount integer, p_reason text, p_reference text)
returns integer language plpgsql security definer set search_path = public as $$
declare
    v_balance integer;
begin
    insert into public.coin_wallets (user_id, balance, lifetime_earned)
    values (p_user, greatest(p_amount, 0), greatest(p_amount, 0))
    on conflict (user_id) do update set
        balance = public.coin_wallets.balance + p_amount,
        lifetime_earned = public.coin_wallets.lifetime_earned + greatest(p_amount, 0),
        updated_at = now()
    returning balance into v_balance;

    insert into public.coin_transactions (user_id, amount, reason, reference, balance_after)
    values (p_user, p_amount, p_reason, p_reference, v_balance);

    return v_balance;
end;
$$;
revoke execute on function public.credit_coins(uuid, integer, text, text) from public;

-- Devuelve (creándolo si no existe) el código de invitación del usuario actual.
create or replace function public.get_or_create_referral_code()
returns text language plpgsql security definer set search_path = public as $$
declare
    v_uid uuid := auth.uid();
    v_code text;
begin
    if v_uid is null then raise exception 'No autenticado'; end if;
    select code into v_code from public.referral_codes where user_id = v_uid;
    if v_code is not null then return v_code; end if;
    loop
        v_code := upper(substr(md5(random()::text || v_uid::text || clock_timestamp()::text), 1, 8));
        begin
            insert into public.referral_codes (user_id, code) values (v_uid, v_code);
            return v_code;
        exception when unique_violation then
            select code into v_code from public.referral_codes where user_id = v_uid;
            if v_code is not null then return v_code; end if;
        end;
    end loop;
end;
$$;
grant execute on function public.get_or_create_referral_code() to authenticated;

-- Registra un referido pendiente para el usuario actual (llamado en el alta).
-- Anti-fraude: no auto-referido, y el invitado no puede estar ya referido.
create or replace function public.record_referral(p_code text)
returns boolean language plpgsql security definer set search_path = public as $$
declare
    v_uid uuid := auth.uid();
    v_referrer uuid;
begin
    if v_uid is null or p_code is null then return false; end if;
    select user_id into v_referrer from public.referral_codes where code = upper(trim(p_code));
    if v_referrer is null or v_referrer = v_uid then return false; end if;
    if exists (select 1 from public.referrals where referred_id = v_uid) then return false; end if;
    insert into public.referrals (referrer_id, referred_id, code, status)
    values (v_referrer, v_uid, upper(trim(p_code)), 'pending')
    on conflict (referred_id) do nothing;
    return true;
end;
$$;
grant execute on function public.record_referral(text) to authenticated;

-- Premia un referido pendiente (invitador + invitado). Idempotente. Interno.
create or replace function public.award_referral(p_referral_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
    v_ref record;
    v_reward constant integer := 5;   -- monedas al invitador
    v_welcome constant integer := 5;  -- monedas al invitado
    v_cap constant integer := 50;     -- tope de referidos premiados por invitador (anti-fraude)
    v_rewarded integer;
begin
    select * into v_ref from public.referrals where id = p_referral_id for update;
    if v_ref is null or v_ref.status <> 'pending' then return; end if;

    select count(*) into v_rewarded from public.referrals
        where referrer_id = v_ref.referrer_id and status = 'rewarded';

    update public.referrals set status = 'rewarded', rewarded_at = now() where id = p_referral_id;

    perform public.credit_coins(v_ref.referred_id, v_welcome, 'referral_welcome', p_referral_id::text);
    if v_rewarded < v_cap then
        perform public.credit_coins(v_ref.referrer_id, v_reward, 'referral_reward', p_referral_id::text);
    end if;
end;
$$;
revoke execute on function public.award_referral(uuid) from public;

-- Cualifica el referido pendiente del usuario actual al unirse a su primer club.
-- El referido se registra en el alta (antes de cualquier membresía), así que su
-- primera membresía es genuinamente la primera. Requiere una membresía real.
create or replace function public.maybe_qualify_referral()
returns boolean language plpgsql security definer set search_path = public as $$
declare
    v_uid uuid := auth.uid();
    v_referral uuid;
begin
    if v_uid is null then return false; end if;
    select id into v_referral from public.referrals
        where referred_id = v_uid and status = 'pending' limit 1;
    if v_referral is null then return false; end if;
    if not exists (select 1 from public.club_members where user_id = v_uid) then return false; end if;
    perform public.award_referral(v_referral);
    return true;
end;
$$;
grant execute on function public.maybe_qualify_referral() to authenticated;
