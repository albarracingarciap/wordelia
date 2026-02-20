-- Create club_posts table
CREATE TABLE IF NOT EXISTS club_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    parent_id UUID REFERENCES club_posts(id) ON DELETE CASCADE, -- For replies
    checkpoint_index INTEGER, -- Linked to reading checkpoint (0-based index or 1-based?) Let's say 1-based matches UI "Checkpoint 1"
    is_spoiler BOOLEAN DEFAULT FALSE,
    is_pinned BOOLEAN DEFAULT FALSE,
    is_announcement BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create post_likes table
CREATE TABLE IF NOT EXISTS post_likes (
    post_id UUID NOT NULL REFERENCES club_posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (post_id, user_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_club_posts_club_id ON club_posts(club_id);
CREATE INDEX IF NOT EXISTS idx_club_posts_parent_id ON club_posts(parent_id);
CREATE INDEX IF NOT EXISTS idx_club_posts_created_at ON club_posts(created_at DESC);

-- RLS for club_posts
ALTER TABLE club_posts ENABLE ROW LEVEL SECURITY;

-- Policy: Members can view posts
CREATE POLICY "Club members can view posts"
ON club_posts FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM club_members
    WHERE club_members.club_id = club_posts.club_id
    AND club_members.user_id = auth.uid()
  ) OR 
  EXISTS ( -- Or if club is public? Assuming private conversation for now, but maybe public clubs allow reading?
      SELECT 1 FROM clubs
      WHERE clubs.id = club_posts.club_id
      AND clubs.visibility = 'public'
  )
);

-- Policy: Members can insert posts
CREATE POLICY "Club members can insert posts"
ON club_posts FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM club_members
    WHERE club_members.club_id = club_id
    AND club_members.user_id = auth.uid()
  )
);

-- Policy: Authors can update own posts (content, spoiler)
CREATE POLICY "Authors can update own posts"
ON club_posts FOR UPDATE
USING (auth.uid() = user_id);

-- Policy: Admins/Mods can update any post (pin, header)
CREATE POLICY "Admins can update any post"
ON club_posts FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM club_members
    WHERE club_members.club_id = club_posts.club_id
    AND club_members.user_id = auth.uid()
    AND (club_members.role = 'admin' OR club_members.role = 'moderator')
  )
);

-- Policy: Authors can delete own posts
CREATE POLICY "Authors can delete own posts"
ON club_posts FOR DELETE
USING (auth.uid() = user_id);

-- Policy: Admins/Mods can delete any post
CREATE POLICY "Admins can delete any post"
ON club_posts FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM club_members
    WHERE club_members.club_id = club_posts.club_id
    AND club_members.user_id = auth.uid()
    AND (club_members.role = 'admin' OR club_members.role = 'moderator')
  )
);

-- RLS for post_likes
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;

-- View likes
CREATE POLICY "Members can view likes"
ON post_likes FOR SELECT
USING (true); -- Public read for simplicity if post is visible

-- Insert likes (Member of club)
CREATE POLICY "Members can like posts"
ON post_likes FOR INSERT
WITH CHECK (
    -- Simplify: if you can see the post, you can like it? Or must be member?
    -- Let's enforce membership via the post access roughly or just allow auth users
    auth.role() = 'authenticated'
);

-- Delete likes (Own like)
CREATE POLICY "Users can unlike"
ON post_likes FOR DELETE
USING (auth.uid() = user_id);
