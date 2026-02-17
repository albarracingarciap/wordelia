-- Create Badges Table
create table if not exists public.badges (
  id uuid default uuid_generate_v4() primary key,
  slug text unique not null,
  name text not null,
  description text not null,
  category text not null, -- 'volume', 'streak', 'exploration', 'social', 'special'
  icon_name text not null, -- Phosphor/Lucide icon name or emoji
  criteria jsonb not null, -- Flexible criteria definition e.g. { "type": "books_read", "count": 10 }
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create User Badges Table (Join Table)
create table if not exists public.user_badges (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  badge_id uuid references public.badges(id) on delete cascade not null,
  awarded_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  unique(user_id, badge_id) -- User can only earn a badge once
);

-- RLS
alter table public.badges enable row level security;
create policy "Badges are viewable by everyone." on public.badges for select using ( true );

alter table public.user_badges enable row level security;
create policy "User badges are viewable by everyone." on public.user_badges for select using ( true );

-- Seed Data (Initial Badges)
insert into public.badges (slug, name, description, category, icon_name, criteria) values
  ('raton_biblioteca', 'Ratón de Biblioteca', 'Leer 10 libros', 'volume', 'Mouse', '{"type": "books_read", "threshold": 10}'),
  ('devoralibros', 'Devoralibros', 'Leer 50 libros', 'volume', 'Cookie', '{"type": "books_read", "threshold": 50}'),
  ('bibliotecario_mayor', 'Bibliotecario Mayor', 'Leer 100 libros', 'volume', 'Library', '{"type": "books_read", "threshold": 100}'),
  
  ('lector_diario', 'Lector Diario', 'Leer 3 días seguidos', 'streak', 'Sun', '{"type": "streak_days", "threshold": 3}'),
  ('semana_literaria', 'Semana Literaria', 'Leer 7 días seguidos', 'streak', 'CalendarCheck', '{"type": "streak_days", "threshold": 7}'),
  ('habito_acero', 'Hábito de Acero', 'Leer 30 días seguidos', 'streak', 'Shield', '{"type": "streak_days", "threshold": 30}'),
  
  ('explorador_mundos', 'Explorador de Mundos', 'Leer libros de 3 géneros diferentes', 'exploration', 'Compass', '{"type": "genres_count", "threshold": 3}'),
  
  ('critico_literario', 'Crítico Literario', 'Escribir tu primera reseña', 'social', 'PenTool', '{"type": "reviews_count", "threshold": 1}'),
  ('influencer', 'Influencer', 'Escribir 10 reseñas', 'social', 'Megaphone', '{"type": "reviews_count", "threshold": 10}')
on conflict (slug) do nothing;

-- Function to check and award badges
-- This function can be called by triggers or manually
create or replace function public.check_user_badges(target_user_id uuid)
returns void
language plpgsql
security definer
as $$
declare
  badge_record record;
  user_stats record;
  current_val integer;
begin
  -- Configurable stats gathering
  -- 1. Books Read
  select count(*) as books_read into user_stats from public.user_books where user_id = target_user_id and status = 'READ';
  
  -- 2. Reviews written
  select count(*) as reviews_written from public.user_books where user_id = target_user_id and review is not null and length(review) > 10;
  
  -- 3. Genres (Approximate via distinct genres in future, for now simple placeholder logic or needs join with books)
  -- select count(distinct ...) ...
  
  -- Iterate through all badges
  for badge_record in select * from public.badges loop
    -- Skip if already earned
    if exists (select 1 from public.user_badges where user_id = target_user_id and badge_id = badge_record.id) then
      continue;
    end if;
    
    -- Check criteria
    current_val := 0;
    
    if badge_record.criteria->>'type' = 'books_read' then
      current_val := user_stats.books_read;
    elsif badge_record.criteria->>'type' = 'reviews_count' then
      -- Re-query if needed or use variable
      select count(*) into current_val from public.user_books where user_id = target_user_id and review is not null and length(review) > 10;
    end if;
    
    -- Award if threshold met
    if current_val >= (badge_record.criteria->>'threshold')::integer then
      insert into public.user_badges (user_id, badge_id) values (target_user_id, badge_record.id);
    end if;
    
  end loop;
end;
$$;

-- Trigger for User Books changes (Finish book, write review)
create or replace function public.trigger_check_badges()
returns trigger
language plpgsql
as $$
begin
  perform public.check_user_badges(new.user_id);
  return new;
end;
$$;

create trigger on_user_books_change
  after insert or update
  on public.user_books
  for each row
  execute procedure public.trigger_check_badges();
