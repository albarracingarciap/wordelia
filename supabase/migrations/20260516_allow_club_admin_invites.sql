create or replace function public.is_club_admin_or_moderator(target_club_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
    select exists (
        select 1
        from public.club_members
        where club_id = target_club_id
          and user_id = auth.uid()
          and role in ('admin', 'moderator')
    );
$$;

grant execute on function public.is_club_admin_or_moderator(uuid) to authenticated;

drop policy if exists "Club admins can invite members" on public.club_members;

create policy "Club admins can invite members"
on public.club_members
for insert
with check (
    role = 'member'
    and public.is_club_admin_or_moderator(club_id)
);
