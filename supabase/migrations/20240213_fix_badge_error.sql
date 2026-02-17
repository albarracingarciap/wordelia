-- Fix error in check_user_badges function (remove dangling SELECT)
create or replace function public.check_user_badges(target_user_id uuid)
returns void
language plpgsql
security definer
as $$
declare
  badge_record record;
  user_stats record;
  current_val integer;
  max_streak integer;
begin
  -- 1. Books Read
  select count(*) as books_read into user_stats from public.user_books where user_id = target_user_id and status = 'READ';
  
  -- 2. Reviews written (Removed dangling select, logic moved inside loop)
  
  -- 3. Calculate Longest Streak
  with daily_sessions as (
    select distinct date_trunc('day', created_at)::date as session_date
    from public.reading_sessions
    where user_id = target_user_id
  ),
  groups as (
    select
      session_date,
      session_date - (row_number() over (order by session_date) * interval '1 day') as grp
    from daily_sessions
  )
  select count(*) into max_streak
  from groups
  group by grp
  order by count(*) desc
  limit 1;
  
  -- Default to 0 if null
  if max_streak is null then max_streak := 0; end if;
  
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
        select count(*) into current_val from public.user_books where user_id = target_user_id and review is not null and length(review) > 10;
    elsif badge_record.criteria->>'type' = 'streak_days' then
      current_val := max_streak;
    end if;
    
    -- Award if threshold met
    if current_val >= (badge_record.criteria->>'threshold')::integer then
      insert into public.user_badges (user_id, badge_id) values (target_user_id, badge_record.id);
    end if;
    
  end loop;
end;
$$;
