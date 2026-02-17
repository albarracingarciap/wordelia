-- Create curated_collections table
-- Stores metadata for each curated collection (5 total: ritmo-cardiaco, densidad-mundo, coeficiente-debate, nivel-prosa, curva-aprendizaje)

create table if not exists public.curated_collections (
  id uuid default uuid_generate_v4() primary key,
  slug text unique not null,
  name text not null,
  description text not null,
  tag_line text not null,
  icon text not null, -- Lucide icon name (e.g., 'heart-pulse', 'network')
  color_theme text not null, -- CSS color values or theme identifier
  display_order integer not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create curated_collection_books table
-- Maps books to collections with ISBNs and cached book data from ISBNdb

create table if not exists public.curated_collection_books (
  id uuid default uuid_generate_v4() primary key,
  collection_id uuid references public.curated_collections(id) on delete cascade not null,
  isbn text not null,
  book_data jsonb, -- Cached book data from ISBNdb API
  display_order integer not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  unique(collection_id, isbn)
);

-- Create indexes for performance
create index if not exists idx_curated_collection_books_collection on public.curated_collection_books(collection_id);
create index if not exists idx_curated_collection_books_isbn on public.curated_collection_books(isbn);
create index if not exists idx_curated_collections_slug on public.curated_collections(slug);

-- Enable Row Level Security
alter table public.curated_collections enable row level security;
alter table public.curated_collection_books enable row level security;

-- RLS Policies: Allow public read access (for non-authenticated users on explore page)
create policy "Curated collections are viewable by everyone."
  on public.curated_collections for select
  using (true);

create policy "Curated collection books are viewable by everyone."
  on public.curated_collection_books for select
  using (true);

-- Only admins can modify (for future admin panel)
-- Note: For now, modifications will be done via migrations or seed scripts
-- In the future, you can add admin role checks here

-- Add comment for documentation
comment on table public.curated_collections is 'Stores curated book collections for the Explorar page showcase';
comment on table public.curated_collection_books is 'Maps books to curated collections with cached ISBNdb data';
