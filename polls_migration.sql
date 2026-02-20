-- Create Polls table
CREATE TABLE IF NOT EXISTS polls (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  club_id UUID REFERENCES clubs(id) ON DELETE CASCADE NOT NULL,
  question TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL
);

-- Create Poll Options table
CREATE TABLE IF NOT EXISTS poll_options (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  poll_id UUID REFERENCES polls(id) ON DELETE CASCADE NOT NULL,
  text TEXT NOT NULL,
  book_id UUID REFERENCES books(id) ON DELETE SET NULL, -- Optional link to a book
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create Poll Votes table
CREATE TABLE IF NOT EXISTS poll_votes (
  poll_id UUID REFERENCES polls(id) ON DELETE CASCADE NOT NULL,
  option_id UUID REFERENCES poll_options(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  PRIMARY KEY (poll_id, user_id) -- Prevent multiple votes per poll
);

-- Enable Row Level Security (RLS)
ALTER TABLE polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_votes ENABLE ROW LEVEL SECURITY;

-- Policies (Simplified for now - can be refined later)
-- Anyone in the club can view polls
CREATE POLICY "Club members can view polls" ON polls
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM club_members WHERE club_members.club_id = polls.club_id AND club_members.user_id = auth.uid()
  ));

-- Admins/Mods can create polls
CREATE POLICY "Admins can create polls" ON polls
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM club_members WHERE club_members.club_id = polls.club_id AND club_members.user_id = auth.uid() AND role IN ('admin', 'moderator')
  ));

-- Same for Options
CREATE POLICY "Club members can view options" ON poll_options
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM polls 
    JOIN club_members ON club_members.club_id = polls.club_id 
    WHERE polls.id = poll_options.poll_id AND club_members.user_id = auth.uid()
  ));

CREATE POLICY "Admins can create options" ON poll_options
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM polls 
    JOIN club_members ON club_members.club_id = polls.club_id 
    WHERE polls.id = poll_options.poll_id AND club_members.user_id = auth.uid() AND role IN ('admin', 'moderator')
  ));

-- Votes: Members can vote, but only once (enforced by PK)
CREATE POLICY "Members can view votes" ON poll_votes
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM polls 
    JOIN club_members ON club_members.club_id = polls.club_id 
    WHERE polls.id = poll_votes.poll_id AND club_members.user_id = auth.uid()
  ));

CREATE POLICY "Members can insert vote" ON poll_votes
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM polls 
    JOIN club_members ON club_members.club_id = polls.club_id 
    WHERE polls.id = poll_votes.poll_id AND club_members.user_id = auth.uid()
  ));
