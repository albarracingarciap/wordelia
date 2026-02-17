-- Add extended profile fields
alter table public.profiles
add column if not exists bio text,
add column if not exists location text,
add column if not exists pronouns text,
-- website already exists in schema.sql but making sure
add column if not exists website text,
add column if not exists reading_format_preference text, -- 'physical', 'ebook', 'audio'
add column if not exists story_complexity_preference integer check (story_complexity_preference >= 1 and story_complexity_preference <= 5),
add column if not exists engagement_elements jsonb default '[]'::jsonb, -- Array of strings
add column if not exists notification_settings jsonb default '{
  "email_reading_reminders": true,
  "push_reading_reminders": true,
  "email_recommendations": true,
  "push_recommendations": false,
  "email_social": false,
  "push_social": true,
  "email_achievements": true,
  "push_achievements": true
}'::jsonb,
add column if not exists privacy_settings jsonb default '{
  "profile_visibility": "public",
  "show_name_photo": true,
  "show_location": true,
  "show_recent_reads": true,
  "show_stats": true
}'::jsonb;
