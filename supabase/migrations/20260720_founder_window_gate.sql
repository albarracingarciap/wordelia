-- Cablea la "ventana de fundador" (app_settings.founder_window) en el alta de
-- usuarios. Redefine handle_new_user() añadiendo la comprobación de ventana.
--
-- Regla acordada: el beneficio fundador termina cuando ocurra lo PRIMERO de
--   (a) llegar la fecha de fin (ends_at) o desactivarse el toggle, o
--   (b) agotarse las 200 plazas (números 39..200 del sequence).
-- A partir de ahí SE SIGUEN ADMITIENDO ALTAS, pero como usuarios normales: no se
-- crea founder_membership. A los fundadores ya existentes no se les toca (el
-- trigger solo corre en altas nuevas y el RPC de canje no cambia).
--
-- Salvaguardas: si el setting falta o la tabla app_settings aún no existe, la
-- ventana se considera ABIERTA (comportamiento previo) para no romper registros.
--
-- Depende de app_settings_migration.sql (idealmente ejecutado antes, aunque el
-- bloque exception tolera su ausencia).

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
    clean_source text := nullif(trim(coalesce(new.raw_user_meta_data->>'signup_source', '')), '');
    clean_intent text := nullif(trim(coalesce(new.raw_user_meta_data->>'signup_intent', '')), '');
    clean_plan text := nullif(trim(coalesce(new.raw_user_meta_data->>'requested_plan', '')), '');
    clean_billing text := nullif(trim(coalesce(new.raw_user_meta_data->>'billing_period', '')), '');
    wants_newsletter boolean := coalesce((new.raw_user_meta_data->>'newsletter_opt_in')::boolean, false);
    next_founder_number integer;
    fw jsonb;
    window_open boolean;
begin
    insert into public.profiles (id, email, full_name, avatar_url)
    values (
        new.id,
        new.email,
        new.raw_user_meta_data->>'full_name',
        new.raw_user_meta_data->>'avatar_url'
    )
    on conflict (id) do update
    set
        email = excluded.email,
        full_name = coalesce(excluded.full_name, public.profiles.full_name),
        avatar_url = coalesce(excluded.avatar_url, public.profiles.avatar_url),
        updated_at = now();

    if clean_plan is null and clean_intent like 'plan-%' then
        clean_plan := replace(clean_intent, 'plan-', '');
    end if;

    if clean_plan not in ('explorador', 'voraz', 'ai') then
        clean_plan := null;
    end if;

    if clean_billing not in ('monthly', 'annual') then
        clean_billing := null;
    end if;

    -- ¿Está abierta la ventana de fundador? (default: abierta si no hay setting).
    begin
        select value into fw from public.app_settings where key = 'founder_window';
    exception when undefined_table then
        fw := null;
    end;

    window_open := coalesce((fw->>'enabled')::boolean, true)
        and (fw->>'ends_at' is null or (fw->>'ends_at')::date >= current_date);

    -- Solo se crea founder_membership si la persona califica (beta o plan de pago)
    -- Y la ventana sigue abierta Y quedan plazas (número <= 200). En cualquier otro
    -- caso el alta continúa con normalidad, pero como usuario normal (sin membership).
    if window_open
        and (
            clean_source = 'beta'
            or clean_intent = 'beta'
            or clean_intent like '%beta%'
            or clean_plan is not null
        )
    then
        next_founder_number := nextval('public.founder_membership_number_seq');

        if next_founder_number <= 200 then
            insert into public.founder_memberships (
                user_id,
                founder_number,
                status,
                signup_source,
                signup_intent,
                requested_plan,
                billing_period,
                newsletter_opt_in
            )
            values (
                new.id,
                next_founder_number,
                'active',
                clean_source,
                clean_intent,
                clean_plan,
                clean_billing,
                wants_newsletter
            )
            on conflict (user_id) do update
            set
                signup_source = coalesce(excluded.signup_source, public.founder_memberships.signup_source),
                signup_intent = coalesce(excluded.signup_intent, public.founder_memberships.signup_intent),
                requested_plan = coalesce(excluded.requested_plan, public.founder_memberships.requested_plan),
                billing_period = coalesce(excluded.billing_period, public.founder_memberships.billing_period),
                newsletter_opt_in = excluded.newsletter_opt_in,
                updated_at = now();
        end if;
        -- next_founder_number > 200 → cupo agotado → usuario normal (sin membership).
    end if;

    return new;
end;
$$;
