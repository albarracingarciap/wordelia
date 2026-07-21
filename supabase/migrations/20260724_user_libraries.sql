-- "Mi librería" del lector: un lector adopta una o varias librerías de referencia,
-- con una marcada como principal. Base del wedge de fidelización. Ejecutar una vez.

create table if not exists public.user_libraries (
    user_id         uuid not null references public.profiles(id) on delete cascade,
    organization_id uuid not null references public.organizations(id) on delete cascade,
    is_primary      boolean not null default false,
    created_at      timestamptz not null default now(),
    primary key (user_id, organization_id)
);

create index if not exists idx_user_libraries_user on public.user_libraries (user_id);
create index if not exists idx_user_libraries_org on public.user_libraries (organization_id);

-- Como mucho una librería principal por lector (índice único parcial). La acción de
-- servidor degrada la anterior antes de marcar la nueva.
create unique index if not exists uniq_user_libraries_primary
    on public.user_libraries (user_id) where is_primary;

alter table public.user_libraries enable row level security;

-- Cada lector gestiona (y lee) solo sus propias adopciones.
drop policy if exists "user_libraries select own" on public.user_libraries;
create policy "user_libraries select own" on public.user_libraries
    for select to authenticated using (user_id = auth.uid());

drop policy if exists "user_libraries insert own" on public.user_libraries;
create policy "user_libraries insert own" on public.user_libraries
    for insert to authenticated with check (user_id = auth.uid());

drop policy if exists "user_libraries update own" on public.user_libraries;
create policy "user_libraries update own" on public.user_libraries
    for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "user_libraries delete own" on public.user_libraries;
create policy "user_libraries delete own" on public.user_libraries
    for delete to authenticated using (user_id = auth.uid());
