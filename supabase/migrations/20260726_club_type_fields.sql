-- Robustez de clubs — modelo de "tipo" en dos ejes + persistir lo que el wizard ya
-- recogía pero se descartaba al crear. Ejecutar una vez en Supabase.
--
-- Eje 1 (titularidad): se DERIVA de is_official + organization_id (personal / de
-- librería / oficial); no necesita columna nueva.
-- Eje 2 (estilo de lectura): `reading_style` guarda la plantilla elegida
-- (slow/deep/social/private/challenge/emotional), que hasta ahora se perdía.

alter table public.clubs
    add column if not exists reading_style  text,  -- plantilla / estilo (eje 2)
    add column if not exists reading_type   text,  -- 'guided' | 'analysis'
    add column if not exists spoiler_policy text,  -- 'levels' | 'strict' | 'free'
    add column if not exists pace           text,  -- 'Suave' | 'Estándar' | 'Intenso' (ritmo sugerido)
    add column if not exists language        text,  -- 'es' | 'en' | 'ca'
    add column if not exists max_members    int;    -- tope de miembros (0/null = sin tope)
