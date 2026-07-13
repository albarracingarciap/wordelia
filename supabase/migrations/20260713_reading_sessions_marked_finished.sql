-- Track which reading session marked its book as finished (status='READ').
-- Without this we cannot know whether deleting/correcting a session should
-- revert the book's READ status and finish_date. Existing rows default to
-- false, so historical sessions won't retroactively un-finish anything.

alter table public.reading_sessions
  add column if not exists marked_finished boolean not null default false;
