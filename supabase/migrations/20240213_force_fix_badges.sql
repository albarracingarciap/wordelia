-- 1. Ensure function is robust (Fixing JSON casting again to be sure)
create or replace function public.check_user_badges(target_user_id uuid)
returns void
language plpgsql
security definer -- IMPORTANT: bypassing RLS
as $$
declare
  badge_record record;
  user_stats record;
  current_val integer;
  max_streak integer;
  threshold_val integer;
  reviews_found integer;
begin
  -- 1. Books Read
  select count(*) as books_read into user_stats from public.user_books where user_id = target_user_id and status = 'READ';
  
  -- 2. Calculate Longest Streak
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
  
  if max_streak is null then max_streak := 0; end if;
  
  -- Iterate through all badges
  for badge_record in select * from public.badges loop
    -- Skip if already earned
    if exists (select 1 from public.user_badges where user_id = target_user_id and badge_id = badge_record.id) then
      continue;
    end if;
    
    current_val := 0;
    
    -- Robust JSON extraction
    begin
        threshold_val := (badge_record.criteria->>'threshold')::integer;
    exception when others then
        threshold_val := 999;
    end;

    if badge_record.criteria->>'type' = 'books_read' then
      current_val := user_stats.books_read;
      
    elsif badge_record.criteria->>'type' = 'reviews_count' then
        -- Count reviews for user (ANY length > 0)
        select count(*) into reviews_found from public.reviews where user_id = target_user_id and length(content) > 0;
        current_val := reviews_found;
        
    elsif badge_record.criteria->>'type' = 'streak_days' then
      current_val := max_streak;
    end if;
    
    if current_val >= threshold_val then
      insert into public.user_badges (user_id, badge_id) values (target_user_id, badge_record.id);
    end if;
    
  end loop;
end;
$$;

-- 2. Force execution for ALL users immediately
do $$
declare
  user_rec record;
begin
  for user_rec in select id from auth.users loop
    perform public.check_user_badges(user_rec.id);
  end loop;
end;
$$;
