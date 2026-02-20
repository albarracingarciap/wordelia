-- Add is_open column to polls for "End Vote" vs "Dismiss" functionality
ALTER TABLE polls ADD COLUMN IF NOT EXISTS is_open BOOLEAN DEFAULT TRUE;

COMMENT ON COLUMN polls.is_open IS 'If true, voting is allowed. If false, voting is closed but poll may still be visible.';
COMMENT ON COLUMN polls.is_active IS 'If true, poll is visible in the widget. If false, it is archived/dismissed.';
