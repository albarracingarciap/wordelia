alter table public.official_clubs
add column if not exists price_cents integer not null default 990,
add column if not exists currency text not null default 'EUR';

alter table public.club_members
add column if not exists join_source text,
add column if not exists price_paid_cents integer;

create table if not exists public.founder_benefit_redemptions (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references public.profiles(id) on delete cascade,
    founder_membership_id uuid references public.founder_memberships(id) on delete set null,
    benefit_type text not null default 'free_official_club'
        check (benefit_type in ('free_official_club')),
    club_id uuid not null references public.clubs(id) on delete cascade,
    official_club_id uuid references public.official_clubs(id) on delete set null,
    redeemed_at timestamptz not null default now(),
    created_at timestamptz not null default now(),
    unique (user_id, benefit_type)
);

alter table public.club_members
add column if not exists benefit_redemption_id uuid references public.founder_benefit_redemptions(id) on delete set null;

create index if not exists idx_founder_benefit_redemptions_user
on public.founder_benefit_redemptions (user_id);

create index if not exists idx_founder_benefit_redemptions_club
on public.founder_benefit_redemptions (club_id);

alter table public.founder_benefit_redemptions enable row level security;

drop policy if exists "Users can read own founder benefit redemptions" on public.founder_benefit_redemptions;
create policy "Users can read own founder benefit redemptions"
on public.founder_benefit_redemptions
for select
using (user_id = auth.uid());

create or replace function public.redeem_founder_free_official_club(target_club_id uuid)
returns table (
    club_id uuid,
    redemption_id uuid,
    already_member boolean
)
language plpgsql
security definer
set search_path = public
as $$
declare
    current_user_id uuid := auth.uid();
    founder_row public.founder_memberships%rowtype;
    redemption_row public.founder_benefit_redemptions%rowtype;
    existing_role text;
    public_official_id uuid;
begin
    if current_user_id is null then
        raise exception 'No autenticado';
    end if;

    select *
    into founder_row
    from public.founder_memberships
    where user_id = current_user_id
      and status = 'active'
    limit 1;

    if founder_row.id is null then
        raise exception 'Solo los lectores fundadores activos pueden usar este beneficio';
    end if;

    if not exists (
        select 1
        from public.clubs
        where id = target_club_id
          and is_official = true
          and coalesce(is_archived, false) = false
    ) then
        raise exception 'Este beneficio solo se puede usar en clubs oficiales de Wordelia';
    end if;

    select role
    into existing_role
    from public.club_members
    where club_members.club_id = target_club_id
      and club_members.user_id = current_user_id
    limit 1;

    select id
    into public_official_id
    from public.official_clubs
    where lower(name) = (
        select lower(name)
        from public.clubs
        where clubs.id = target_club_id
    )
    limit 1;

    select *
    into redemption_row
    from public.founder_benefit_redemptions
    where user_id = current_user_id
      and benefit_type = 'free_official_club'
    limit 1;

    if redemption_row.id is not null and redemption_row.club_id <> target_club_id then
        raise exception 'Ya has usado tu acceso gratuito de fundador en otro club oficial';
    end if;

    if redemption_row.id is null then
        insert into public.founder_benefit_redemptions (
            user_id,
            founder_membership_id,
            club_id,
            official_club_id
        )
        values (
            current_user_id,
            founder_row.id,
            target_club_id,
            public_official_id
        )
        returning * into redemption_row;
    end if;

    if existing_role is null then
        insert into public.club_members (
            club_id,
            user_id,
            role,
            join_source,
            price_paid_cents,
            benefit_redemption_id
        )
        values (
            target_club_id,
            current_user_id,
            'member',
            'founder_benefit',
            0,
            redemption_row.id
        );
    else
        update public.club_members
        set
            join_source = coalesce(join_source, 'founder_benefit'),
            price_paid_cents = coalesce(price_paid_cents, 0),
            benefit_redemption_id = coalesce(benefit_redemption_id, redemption_row.id),
            role = case when role = 'pending' then 'member' else role end
        where club_members.club_id = target_club_id
          and club_members.user_id = current_user_id;
    end if;

    return query
    select target_club_id, redemption_row.id, existing_role is not null;
end;
$$;

grant execute on function public.redeem_founder_free_official_club(uuid) to authenticated;
