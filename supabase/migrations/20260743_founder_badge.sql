-- Insignia "Miembro Fundador": permanente, para todo usuario registrado ANTES del
-- cierre de la ventana de fundador (app_settings.founder_window.ends_at, por
-- defecto 2026-09-01). La landing ya la promete; aquí se crea y se otorga.
-- Ejecutar una vez.

-- 1. Semilla de la insignia (categoría 'special'; sin threshold → check_user_badges la ignora).
insert into public.badges (slug, name, description, category, icon_name, criteria)
values (
    'miembro_fundador',
    'Miembro Fundador',
    'Estuviste con nosotros desde el principio.',
    'special',
    'Award',
    '{"type": "founder"}'::jsonb
)
on conflict (slug) do nothing;

-- 2. Otorga la insignia a un usuario si es elegible (registrado en/antes del cierre
-- de la ventana). Idempotente. Permanente: no se retira al cerrar la ventana.
create or replace function public.award_founder_badge(p_user uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
    v_badge uuid;
    v_ends text;
    v_created date;
begin
    select id into v_badge from public.badges where slug = 'miembro_fundador';
    if v_badge is null then return; end if;

    select value->>'ends_at' into v_ends from public.app_settings where key = 'founder_window';
    select created_at::date into v_created from public.profiles where id = p_user;
    if v_created is null then return; end if;

    -- Elegible si no hay fecha de cierre, o si se registró en/antes de esa fecha.
    if v_ends is null or v_created <= v_ends::date then
        insert into public.user_badges (user_id, badge_id)
        values (p_user, v_badge)
        on conflict (user_id, badge_id) do nothing;
    end if;
end;
$$;

-- 3. Al crear un perfil nuevo, evalúa la insignia de fundador (cubre altas futuras
-- mientras la ventana siga abierta). Trigger sobre profiles (no sobre auth.users).
create or replace function public.trigger_award_founder_badge()
returns trigger language plpgsql security definer set search_path = public as $$
begin
    perform public.award_founder_badge(new.id);
    return new;
end;
$$;

drop trigger if exists on_profile_created_founder_badge on public.profiles;
create trigger on_profile_created_founder_badge
    after insert on public.profiles
    for each row execute function public.trigger_award_founder_badge();

-- 4. Backfill: otorga la insignia a todos los usuarios actuales elegibles.
do $$
declare r record;
begin
    for r in select id from public.profiles loop
        perform public.award_founder_badge(r.id);
    end loop;
end $$;
