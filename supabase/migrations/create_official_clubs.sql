-- Create official_clubs table for Wordelia Originals reading clubs
-- This table stores curated official reading clubs starting March 15, 2026

CREATE TABLE IF NOT EXISTS official_clubs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    book_isbn TEXT NOT NULL,
    book_data JSONB,
    start_date DATE NOT NULL DEFAULT '2026-03-15',
    theme_color TEXT NOT NULL,
    theme_icon TEXT NOT NULL,
    is_featured BOOLEAN DEFAULT FALSE,
    display_order INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_official_clubs_slug ON official_clubs(slug);
CREATE INDEX IF NOT EXISTS idx_official_clubs_featured ON official_clubs(is_featured) WHERE is_featured = TRUE;
CREATE INDEX IF NOT EXISTS idx_official_clubs_display_order ON official_clubs(display_order);

-- Enable Row Level Security
ALTER TABLE official_clubs ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access (non-authenticated users can view)
CREATE POLICY "Public read access for official clubs"
    ON official_clubs
    FOR SELECT
    USING (true);

-- Create policy for authenticated admin write access (optional, for future admin panel)
CREATE POLICY "Admin write access for official clubs"
    ON official_clubs
    FOR ALL
    USING (auth.role() = 'authenticated');

-- Add comment for documentation
COMMENT ON TABLE official_clubs IS 'Official Wordelia reading clubs (Wordelia Originals) - publicly accessible for non-registered users';
COMMENT ON COLUMN official_clubs.slug IS 'URL-friendly identifier (e.g., mundo-distopico)';
COMMENT ON COLUMN official_clubs.book_data IS 'Cached book data from ISBNdb API in JSONB format';
COMMENT ON COLUMN official_clubs.is_featured IS 'Marks the featured "Club del Mes" for special display';
COMMENT ON COLUMN official_clubs.start_date IS 'Club start date - all clubs begin March 15, 2026';
