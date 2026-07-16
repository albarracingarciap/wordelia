-- Escaparate de clubs en el home.
-- portada:   el club aparece en la sección de clubs de la página de inicio
--            (se recomienda marcar como máximo 4).
-- destacado: el club se muestra como club destacado / "Libro del mes".
--            Debe ser único (lo garantiza la lógica de updateClubSettings).
alter table public.clubs
  add column if not exists portada boolean not null default false;

alter table public.clubs
  add column if not exists destacado boolean not null default false;

-- Índice parcial para localizar rápido los clubs marcados para el home.
create index if not exists clubs_portada_idx
  on public.clubs (portada)
  where portada = true;
