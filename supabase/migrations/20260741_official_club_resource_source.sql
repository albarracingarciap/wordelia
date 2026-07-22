-- Concesión unificada de recursos en clubs oficiales: nuevo origen de grant
-- 'official_club' para que unirse a un club oficial (por fundador, monedas o
-- PayPal) conceda la guía + genoma del libro de forma perpetua.
-- Ejecutar una vez.

alter table public.user_book_resource_access
  drop constraint if exists user_book_resource_access_access_source_check;

alter table public.user_book_resource_access
  add constraint user_book_resource_access_access_source_check
  check (access_source in ('purchase', 'subscription', 'admin_grant', 'org_club', 'official_club'));
