-- Lista de deseos · Libro mayor de contribuciones al bote (simbólico, sin dinero real).
-- Antes solo existía un contador agregado (wishlist_items.crowdfunding_collected) sin
-- trazabilidad. Ahora cada contribución queda registrada (quién, cuánto, cuándo) y el
-- contador pasa a ser la SUMA de este mayor. No hay reembolsos (el bote es simbólico).

create table if not exists public.wishlist_contributions (
    id uuid primary key default gen_random_uuid(),
    item_id uuid not null references public.wishlist_items(id) on delete cascade,
    contributor_user_id uuid not null references auth.users(id) on delete cascade,
    contributor_name text,
    amount numeric(10, 2) not null check (amount > 0),
    note text,
    created_at timestamptz not null default now()
);

create index if not exists wishlist_contributions_item_idx on public.wishlist_contributions(item_id);

alter table public.wishlist_contributions enable row level security;

-- Las escrituras y las lecturas para mostrar mecenas se hacen con service role desde
-- los server actions. RLS directa: cada contribuyente puede ver las suyas.
do $$
begin
    if not exists (select 1 from pg_policies where tablename = 'wishlist_contributions' and policyname = 'own_contributions_select') then
        create policy "own_contributions_select" on public.wishlist_contributions
            for select using (auth.uid() = contributor_user_id);
    end if;
end $$;
