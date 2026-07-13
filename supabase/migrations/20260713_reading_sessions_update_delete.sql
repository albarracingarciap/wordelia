-- Allow users to correct/delete their own reading sessions.
-- reading_sessions previously had only SELECT/INSERT policies
-- (20240210_create_reading_features.sql), so update/delete were blocked by RLS.

create policy "Users can update their own reading sessions"
  on public.reading_sessions for update
  using (auth.uid() = user_id);

create policy "Users can delete their own reading sessions"
  on public.reading_sessions for delete
  using (auth.uid() = user_id);
