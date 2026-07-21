-- Recomendaciones curadas por la librería: estanterías temáticas montadas a mano
-- por el librero (el anti-algoritmo). Ejecutar una vez en Supabase.

create table if not exists public.org_recommendation_lists (
    id              uuid primary key default gen_random_uuid(),
    organization_id uuid not null references public.organizations(id) on delete cascade,
    title           text not null,
    description     text,
    is_published    boolean not null default false,
    sort_order      int not null default 0,
    created_at      timestamptz not null default now(),
    updated_at      timestamptz not null default now()
);

create index if not exists org_reco_lists_org_idx on public.org_recommendation_lists (organization_id, sort_order);

create table if not exists public.org_recommendation_items (
    id          uuid primary key default gen_random_uuid(),
    list_id     uuid not null references public.org_recommendation_lists(id) on delete cascade,
    book_id     uuid references public.books(id) on delete set null, -- enlace best-effort al catálogo
    title       text not null,
    author      text,
    cover_url   text,
    isbn        text, -- para casar con la ficha de libro y construir enlaces de compra
    note        text, -- la nota personal del librero (el valor de la curación)
    sort_order  int not null default 0,
    created_at  timestamptz not null default now()
);

create index if not exists org_reco_items_list_idx on public.org_recommendation_items (list_id, sort_order);
create index if not exists org_reco_items_isbn_idx on public.org_recommendation_items (isbn);

alter table public.org_recommendation_lists enable row level security;
alter table public.org_recommendation_items enable row level security;

-- Lectura pública (la app filtra is_published para las superficies públicas; el
-- panel del gestor ve también las no publicadas de SU organización).
create policy "reco lists readable" on public.org_recommendation_lists for select using (true);
create policy "reco items readable" on public.org_recommendation_items for select using (true);

-- Escritura: solo owner/manager de la organización.
create policy "reco lists managed by org" on public.org_recommendation_lists for all to authenticated
    using (exists (
        select 1 from public.organization_members m
        where m.organization_id = org_recommendation_lists.organization_id
          and m.user_id = auth.uid() and m.role in ('owner', 'manager')
    ))
    with check (exists (
        select 1 from public.organization_members m
        where m.organization_id = org_recommendation_lists.organization_id
          and m.user_id = auth.uid() and m.role in ('owner', 'manager')
    ));

create policy "reco items managed by org" on public.org_recommendation_items for all to authenticated
    using (exists (
        select 1 from public.org_recommendation_lists l
        join public.organization_members m on m.organization_id = l.organization_id
        where l.id = org_recommendation_items.list_id
          and m.user_id = auth.uid() and m.role in ('owner', 'manager')
    ))
    with check (exists (
        select 1 from public.org_recommendation_lists l
        join public.organization_members m on m.organization_id = l.organization_id
        where l.id = org_recommendation_items.list_id
          and m.user_id = auth.uid() and m.role in ('owner', 'manager')
    ));
