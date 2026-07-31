-- Lista de deseos · Contribución anónima opcional al bote.
-- El mecenas puede ocultar su nombre al destinatario (el propietario ve "Anónimo").
-- El nombre real se conserva en la fila (para el propio mecenas), pero no se envía
-- al propietario cuando is_anonymous = true.

alter table public.wishlist_contributions
    add column if not exists is_anonymous boolean not null default false;
