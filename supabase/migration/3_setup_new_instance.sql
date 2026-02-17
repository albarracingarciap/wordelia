-- Setup script for new Supabase instance
-- This script applies the base schema and all migrations

\echo '🚀 Setting up new Supabase instance...'
\echo ''

-- 1. Base Schema
\echo '📋 Applying base schema...'
\i ../schema.sql
\echo '✅ Base schema applied'
\echo ''

-- 2. Migrations (in chronological order)
\echo '📋 Applying migrations...'

\i ../migrations/20240210_add_current_page.sql
\echo '  ✅ 20240210_add_current_page'

\i ../migrations/20240210_add_language_to_books.sql
\echo '  ✅ 20240210_add_language_to_books'

\i ../migrations/20240210_add_onboarding_fields.sql
\echo '  ✅ 20240210_add_onboarding_fields'

\i ../migrations/20240210_add_paused_status.sql
\echo '  ✅ 20240210_add_paused_status'

\i ../migrations/20240210_add_publisher_to_books.sql
\echo '  ✅ 20240210_add_publisher_to_books'

\i ../migrations/20240210_add_updated_at_to_user_books.sql
\echo '  ✅ 20240210_add_updated_at_to_user_books'

\i ../migrations/20240210_allow_user_inserts.sql
\echo '  ✅ 20240210_allow_user_inserts'

\i ../migrations/20240210_create_reading_features.sql
\echo '  ✅ 20240210_create_reading_features'

\i ../migrations/20240210_create_storage_bucket.sql
\echo '  ✅ 20240210_create_storage_bucket'

\i ../migrations/20240211_add_current_page.sql
\echo '  ✅ 20240211_add_current_page'

\i ../migrations/20240212_create_reviews_table.sql
\echo '  ✅ 20240212_create_reviews_table'

\i ../migrations/20240213_add_spoiler_preference.sql
\echo '  ✅ 20240213_add_spoiler_preference'

\i ../migrations/20240213_badge_logic_update.sql
\echo '  ✅ 20240213_badge_logic_update'

\i ../migrations/20240213_create_badges.sql
\echo '  ✅ 20240213_create_badges'

\i ../migrations/20240213_debug_badges.sql
\echo '  ✅ 20240213_debug_badges'

\i ../migrations/20240213_extend_profiles.sql
\echo '  ✅ 20240213_extend_profiles'

\i ../migrations/20240213_fix_badge_error.sql
\echo '  ✅ 20240213_fix_badge_error'

\i ../migrations/20240213_fix_json_casting.sql
\echo '  ✅ 20240213_fix_json_casting'

\i ../migrations/20240213_fix_reviews_logic.sql
\echo '  ✅ 20240213_fix_reviews_logic'

\i ../migrations/20240213_force_fix_badges.sql
\echo '  ✅ 20240213_force_fix_badges'

\i ../migrations/20240213_profile_polish.sql
\echo '  ✅ 20240213_profile_polish'

\i ../migrations/20240213_relax_review_check.sql
\echo '  ✅ 20240213_relax_review_check'

\echo ''
\echo '✅ All migrations applied successfully!'
\echo ''
\echo '📊 Verifying schema...'

-- Verify tables exist
SELECT 
  schemaname,
  tablename
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

\echo ''
\echo '✅ Schema setup completed!'
