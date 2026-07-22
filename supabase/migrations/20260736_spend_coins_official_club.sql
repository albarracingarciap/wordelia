-- Monedas Wordelia W2: gastar monedas para unirse a un club oficial de pago.
-- Espejo de redeem_founder_free_official_club: valida club oficial, debita monedas
-- (cobertura total, 1 moneda = 1 €) e inscribe en club_members con join_source='coins'.
-- Idempotente por (user, club): si ya es miembro, no cobra.
-- Ejecutar una vez.

create or replace function public.spend_coins_official_club(target_club_id uuid)
returns table (already_member boolean, coins_spent integer, new_balance integer)
language plpgsql security definer set search_path = public as $$
declare
    v_uid uuid := auth.uid();
    v_club record;
    v_price numeric;
    v_needed integer;
    v_balance integer;
    v_role text;
begin
    if v_uid is null then raise exception 'No autenticado'; end if;

    select id, is_official, coalesce(is_archived, false) as archived, price
      into v_club
      from public.clubs where id = target_club_id;
    if v_club.id is null then raise exception 'Club no encontrado'; end if;
    if not coalesce(v_club.is_official, false) or v_club.archived then
        raise exception 'Solo puedes usar monedas en clubs oficiales de Wordelia';
    end if;

    v_price := v_club.price;
    if v_price is null or v_price <= 0 then
        raise exception 'Este club no tiene un precio válido';
    end if;
    v_needed := ceil(v_price)::integer;

    -- ¿Ya es miembro (por cualquier vía)? No cobramos de nuevo.
    select role into v_role from public.club_members
        where club_id = target_club_id and user_id = v_uid;
    if v_role is not null and v_role <> 'pending' then
        select balance into v_balance from public.coin_wallets where user_id = v_uid;
        return query select true, 0, coalesce(v_balance, 0);
        return;
    end if;

    -- Bloquea la cartera para serializar gastos concurrentes del mismo usuario.
    select balance into v_balance from public.coin_wallets where user_id = v_uid for update;
    if coalesce(v_balance, 0) < v_needed then
        raise exception 'No tienes monedas suficientes (necesitas %)', v_needed;
    end if;

    -- Debita y registra en el ledger.
    v_balance := public.credit_coins(v_uid, -v_needed, 'spend_official_club', target_club_id::text);

    -- Inscribe o promociona de 'pending' a 'member'.
    if v_role is null then
        insert into public.club_members (club_id, user_id, role, join_source, price_paid_cents)
        values (target_club_id, v_uid, 'member', 'coins', round(v_price * 100)::integer);
    else
        update public.club_members
           set role = 'member', join_source = 'coins', price_paid_cents = round(v_price * 100)::integer
         where club_id = target_club_id and user_id = v_uid;
    end if;

    return query select false, v_needed, v_balance;
end;
$$;
grant execute on function public.spend_coins_official_club(uuid) to authenticated;
