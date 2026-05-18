create sequence if not exists public.founder_membership_number_seq
    start with 39
    increment by 1;

create table if not exists public.founder_memberships (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null unique references public.profiles(id) on delete cascade,
    founder_number integer not null unique default nextval('public.founder_membership_number_seq'),
    status text not null default 'active' check (status in ('active', 'waitlist', 'cancelled')),
    signup_source text,
    signup_intent text,
    requested_plan text check (requested_plan in ('explorador', 'voraz', 'ai')),
    billing_period text check (billing_period in ('monthly', 'annual')),
    newsletter_opt_in boolean not null default false,
    benefits jsonb not null default '["insignia_fundador", "prioridad_novedades", "voz_producto"]'::jsonb,
    joined_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists idx_founder_memberships_status
on public.founder_memberships (status);

create index if not exists idx_founder_memberships_plan
on public.founder_memberships (requested_plan);

alter table public.founder_memberships enable row level security;

drop policy if exists "Users can read own founder membership" on public.founder_memberships;
create policy "Users can read own founder membership"
on public.founder_memberships
for select
to authenticated
using (user_id = auth.uid());

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

    if clean_source = 'beta'
        or clean_intent = 'beta'
        or clean_intent like '%beta%'
        or clean_plan is not null
    then
        next_founder_number := nextval('public.founder_membership_number_seq');

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
            case when next_founder_number <= 200 then 'active' else 'waitlist' end,
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

    return new;
end;
$$;

create or replace function public.get_founder_membership_stats()
returns table (
    founder_count integer,
    available_spots integer,
    waitlist_count integer
)
language sql
security definer
set search_path = public
stable
as $$
    with stats as (
        select
            count(*) filter (where status = 'active')::integer as active_founders,
            count(*) filter (where status = 'waitlist')::integer as waitlist_founders
        from public.founder_memberships
    )
    select
        least(200, 38 + active_founders)::integer as founder_count,
        greatest(200 - (38 + active_founders), 0)::integer as available_spots,
        waitlist_founders as waitlist_count
    from stats;
$$;

grant execute on function public.get_founder_membership_stats() to anon, authenticated;
