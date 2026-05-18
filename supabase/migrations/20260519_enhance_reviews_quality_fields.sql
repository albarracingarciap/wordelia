alter table public.reviews
add column if not exists contains_spoilers boolean not null default false,
add column if not exists emotional_tone text null,
add column if not exists pace text null,
add column if not exists recommended_for text null,
add column if not exists tags text[] not null default array[]::text[];

do $$
begin
    if not exists (
        select 1
        from pg_constraint
        where conname = 'reviews_emotional_tone_check'
    ) then
        alter table public.reviews
        add constraint reviews_emotional_tone_check
        check (
            emotional_tone is null
            or emotional_tone in (
                'asombro',
                'tristeza',
                'alegria',
                'miedo',
                'enojo',
                'empatia',
                'inquietud',
                'esperanza',
                'confusion',
                'melancolia'
            )
        );
    end if;

    if not exists (
        select 1
        from pg_constraint
        where conname = 'reviews_pace_check'
    ) then
        alter table public.reviews
        add constraint reviews_pace_check
        check (
            pace is null
            or pace in ('lento', 'pausado', 'agil', 'rapido', 'irregular')
        );
    end if;
end $$;

create index if not exists idx_reviews_type_created
on public.reviews (type, created_at desc);

create index if not exists idx_reviews_emotional_tone
on public.reviews (emotional_tone);
