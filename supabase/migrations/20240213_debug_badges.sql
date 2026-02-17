-- Debug script to check badge assignment logic
do $$
declare
  -- Replace with specific user ID if known, or pick one with reviews
  target_user_id uuid; 
  review_count integer;
  badge_exists boolean;
begin
  -- Get a user who has written a review
  select user_id into target_user_id from public.reviews limit 1;
  
  if target_user_id is not null then
    -- Count reviews
    select count(*) into review_count from public.reviews where user_id = target_user_id;
    raise notice 'User % has % reviews total', target_user_id, review_count;
    
    -- Count reviews > 10 chars
    select count(*) into review_count from public.reviews where user_id = target_user_id and length(content) > 10;
     raise notice 'User % has % reviews > 10 chars', target_user_id, review_count;
     
    -- Check if badge awarded
    select exists (
      select 1 
      from public.user_badges ub
      join public.badges b on b.id = ub.badge_id
      where ub.user_id = target_user_id and b.slug = 'critico_literario'
    ) into badge_exists;
    
    raise notice 'Badge awarded: %', badge_exists;
    
    -- Force check
    perform public.check_user_badges(target_user_id);
    
  else
    raise notice 'No users with reviews found';
  end if;
end;
$$;
