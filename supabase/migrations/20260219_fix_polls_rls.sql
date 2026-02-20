-- Enable RLS on polls table
ALTER TABLE polls ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts (and ensure we have the correct ones)
DROP POLICY IF EXISTS "Polls are viewable by everyone" ON polls;
DROP POLICY IF EXISTS "Club members can view polls" ON polls;
DROP POLICY IF EXISTS "Club admins can create polls" ON polls;
DROP POLICY IF EXISTS "Club admins can update polls" ON polls;
DROP POLICY IF EXISTS "Club admins can delete polls" ON polls;

-- 1. VIEW: Everyone can view polls (or maybe just members? usage suggests public or members)
-- Let's stick to members for now as per likely requirement, but usually read is open if club is public.
-- Safest is "Club members can view polls"
CREATE POLICY "Club members can view polls"
ON polls FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM club_members
    WHERE club_members.club_id = polls.club_id
    AND club_members.user_id = auth.uid()
  )
);

-- 2. CREATE: Admins and Moderators
CREATE POLICY "Club admins can create polls"
ON polls FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM club_members
    WHERE club_members.club_id = club_id -- poll has club_id on insert
    AND club_members.user_id = auth.uid()
    AND (club_members.role = 'admin' OR club_members.role = 'moderator')
  )
);

-- 3. UPDATE: Admins and Moderators (Fixes the issue)
CREATE POLICY "Club admins can update polls"
ON polls FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM club_members
    WHERE club_members.club_id = polls.club_id
    AND club_members.user_id = auth.uid()
    AND (club_members.role = 'admin' OR club_members.role = 'moderator')
  )
);

-- 4. DELETE: Admins and Moderators
CREATE POLICY "Club admins can delete polls"
ON polls FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM club_members
    WHERE club_members.club_id = polls.club_id
    AND club_members.user_id = auth.uid()
    AND (club_members.role = 'admin' OR club_members.role = 'moderator')
  )
);
