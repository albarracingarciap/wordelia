-- Affiliation: per-bookstore "buy this book" URL template.
-- Supports {isbn} and {title} placeholders, e.g.
--   https://milibreria.com/buscar?isbn={isbn}
alter table public.organizations
  add column if not exists buy_link_template text;
