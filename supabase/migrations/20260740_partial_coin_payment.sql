-- Monedas Wordelia: descuento parcial (monedas + PayPal) al unirse a un club oficial.
-- Modelo escrow: al abrir el checkout se RESERVAN (debitan) las monedas; al capturar
-- el pago quedan gastadas; si el usuario abandona PayPal, un job de pg_cron las DEVUELVE.
-- Ejecutar una vez.

-- Nuevo motivo de ledger para la devolución de reservas abandonadas.
alter table public.coin_transactions drop constraint if exists coin_transactions_reason_check;
alter table public.coin_transactions add constraint coin_transactions_reason_check
    check (reason in (
        'referral_reward', 'referral_welcome', 'spend_official_club', 'spend_event',
        'admin_adjust', 'expiry', 'hold_release'
    ));

-- Reserva: debita monedas al iniciar el checkout parcial (bajo sesión de usuario).
-- Se registra como 'spend_official_club' para que el caso exitoso quede limpio en el
-- histórico; si se abandona, la liberación añade un 'hold_release' que lo revierte.
create or replace function public.reserve_coins_for_order(p_amount integer, p_reference text)
returns integer language plpgsql security definer set search_path = public as $$
declare
    v_uid uuid := auth.uid();
    v_balance integer;
begin
    if v_uid is null then raise exception 'No autenticado'; end if;
    if p_amount is null or p_amount <= 0 then raise exception 'Importe inválido'; end if;
    select balance into v_balance from public.coin_wallets where user_id = v_uid for update;
    if coalesce(v_balance, 0) < p_amount then
        raise exception 'No tienes monedas suficientes';
    end if;
    v_balance := public.credit_coins(v_uid, -p_amount, 'spend_official_club', p_reference);
    return v_balance;
end;
$$;
grant execute on function public.reserve_coins_for_order(integer, text) to authenticated;

-- Liberación: devuelve las monedas de reservas de órdenes 'club' que no se
-- capturaron en p_minutes minutos. Idempotente (marca coins_released en metadata).
-- Interno: lo llama pg_cron / service role.
create or replace function public.release_abandoned_coin_reserves(p_minutes integer default 60)
returns integer language plpgsql security definer set search_path = public as $$
declare
    v_order record;
    v_count integer := 0;
begin
    for v_order in
        select id, user_id, (metadata->>'applied_coins')::int as coins
        from public.orders
        where product_type = 'club'
          and fulfilled_at is null
          and (metadata->>'applied_coins') is not null
          and coalesce((metadata->>'coins_released')::boolean, false) = false
          and created_at < now() - make_interval(mins => p_minutes)
    loop
        update public.orders
           set metadata = metadata || '{"coins_released": true}'::jsonb,
               status = 'cancelled',
               updated_at = now()
         where id = v_order.id
           and coalesce((metadata->>'coins_released')::boolean, false) = false;
        if found and coalesce(v_order.coins, 0) > 0 then
            perform public.credit_coins(v_order.user_id, v_order.coins, 'hold_release', v_order.id::text);
            v_count := v_count + 1;
        end if;
    end loop;
    return v_count;
end;
$$;
revoke execute on function public.release_abandoned_coin_reserves(integer) from public;
grant execute on function public.release_abandoned_coin_reserves(integer) to service_role;

-- Job de limpieza cada 15 min (libera reservas abandonadas > 60 min).
create extension if not exists pg_cron;
select cron.schedule(
    'release-abandoned-coin-reserves',
    '*/15 * * * *',
    $$ select public.release_abandoned_coin_reserves(60); $$
);
