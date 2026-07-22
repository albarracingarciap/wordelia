-- Monedas Wordelia: variante de maybe_qualify_referral que recibe el user_id
-- explícito, para poder cualificar un referido desde contexto service-role
-- (fulfillOrder de PayPal, donde auth.uid() es null). Solo service_role.
-- Ejecutar una vez.

create or replace function public.qualify_referral_for(p_user uuid)
returns boolean language plpgsql security definer set search_path = public as $$
declare
    v_referral uuid;
begin
    if p_user is null then return false; end if;
    select id into v_referral from public.referrals
        where referred_id = p_user and status = 'pending' limit 1;
    if v_referral is null then return false; end if;
    if not exists (select 1 from public.club_members where user_id = p_user) then return false; end if;
    perform public.award_referral(v_referral);
    return true;
end;
$$;
revoke execute on function public.qualify_referral_for(uuid) from public;
grant execute on function public.qualify_referral_for(uuid) to service_role;
