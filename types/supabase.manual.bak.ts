export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            profiles: {
                Row: {
                    id: string
                    username: string | null
                    full_name: string | null
                    avatar_url: string | null
                    website: string | null
                    email: string | null
                    onboarding_completed: boolean
                    updated_at: string | null
                    birth_date: string | null
                    reader_type: string | null
                    favorite_genres: Json | null
                    goals: Json | null
                    role: 'user' | 'admin' | 'editor' | 'moderator' | null
                }
                Insert: {
                    id: string
                    username?: string | null
                    full_name?: string | null
                    avatar_url?: string | null
                    website?: string | null
                    email?: string | null
                    onboarding_completed?: boolean
                    updated_at?: string | null
                    birth_date?: string | null
                    reader_type?: string | null
                    favorite_genres?: Json | null
                    goals?: Json | null
                    role?: 'user' | 'admin' | 'editor' | 'moderator' | null
                }
                Update: {
                    id?: string
                    username?: string | null
                    full_name?: string | null
                    avatar_url?: string | null
                    website?: string | null
                    email?: string | null
                    onboarding_completed?: boolean
                    updated_at?: string | null
                    birth_date?: string | null
                    reader_type?: string | null
                    favorite_genres?: Json | null
                    goals?: Json | null
                    role?: 'user' | 'admin' | 'editor' | 'moderator' | null
                }
            }
            authors: {
                Row: {
                    id: string
                    name: string
                    bio: string | null
                    photo_url: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    name: string
                    bio?: string | null
                    photo_url?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    name?: string
                    bio?: string | null
                    photo_url?: string | null
                    created_at?: string
                }
            }
            books: {
                Row: {
                    id: string
                    title: string
                    title_normalized: string | null
                    original_title: string | null
                    original_language: string | null
                    first_publication_year: number | null
                    author_id: string | null
                    description: string | null
                    preferred_edition_id: string | null
                    external_ids: Json
                    genre: string | null
                    experience: string | null
                    rating_avg: number | null
                    total_interactions: number | null
                    genome_data: Json | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    title: string
                    title_normalized?: string | null
                    original_title?: string | null
                    original_language?: string | null
                    first_publication_year?: number | null
                    author_id?: string | null
                    description?: string | null
                    preferred_edition_id?: string | null
                    external_ids?: Json
                    genre?: string | null
                    experience?: string | null
                    rating_avg?: number | null
                    total_interactions?: number | null
                    genome_data?: Json | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    title?: string
                    title_normalized?: string | null
                    original_title?: string | null
                    original_language?: string | null
                    first_publication_year?: number | null
                    author_id?: string | null
                    description?: string | null
                    preferred_edition_id?: string | null
                    external_ids?: Json
                    genre?: string | null
                    experience?: string | null
                    rating_avg?: number | null
                    total_interactions?: number | null
                    genome_data?: Json | null
                    created_at?: string
                }
            }
            editions: {
                Row: {
                    id: string
                    book_id: string | null
                    isbn: string | null
                    isbn13: string | null
                    title: string | null
                    subtitle: string | null
                    cover_url: string | null
                    cover_resolution: number | null
                    page_count: number | null
                    published_date: string | null
                    publication_year: number | null
                    language: string | null
                    publisher: string | null
                    format: string | null
                    is_abridged: boolean
                    source: string | null
                    source_id: string | null
                    external_ids: Json
                    quality_score: number | null
                    raw_payload: Json | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    book_id?: string | null
                    isbn?: string | null
                    isbn13?: string | null
                    title?: string | null
                    subtitle?: string | null
                    cover_url?: string | null
                    cover_resolution?: number | null
                    page_count?: number | null
                    published_date?: string | null
                    publication_year?: number | null
                    language?: string | null
                    publisher?: string | null
                    format?: string | null
                    is_abridged?: boolean
                    source?: string | null
                    source_id?: string | null
                    external_ids?: Json
                    quality_score?: number | null
                    raw_payload?: Json | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    book_id?: string | null
                    isbn?: string | null
                    isbn13?: string | null
                    title?: string | null
                    subtitle?: string | null
                    cover_url?: string | null
                    cover_resolution?: number | null
                    page_count?: number | null
                    published_date?: string | null
                    publication_year?: number | null
                    language?: string | null
                    publisher?: string | null
                    format?: string | null
                    is_abridged?: boolean
                    source?: string | null
                    source_id?: string | null
                    external_ids?: Json
                    quality_score?: number | null
                    raw_payload?: Json | null
                    created_at?: string
                    updated_at?: string
                }
            }
            edition_review_queue: {
                Row: {
                    id: string
                    edition_id: string
                    candidates: Json
                    reason: string | null
                    status: string
                    resolved_at: string | null
                    resolved_by: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    edition_id: string
                    candidates: Json
                    reason?: string | null
                    status?: string
                    resolved_at?: string | null
                    resolved_by?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    edition_id?: string
                    candidates?: Json
                    reason?: string | null
                    status?: string
                    resolved_at?: string | null
                    resolved_by?: string | null
                    created_at?: string
                }
            }
            user_books: {
                Row: {
                    id: string
                    user_id: string
                    book_id: string
                    edition_id: string | null
                    status: 'WANT_TO_READ' | 'READING' | 'READ' | 'DNF'
                    rating: number | null
                    review: string | null
                    start_date: string | null
                    finish_date: string | null
                    created_at: string
                    updated_at: string | null
                }
                Insert: {
                    id?: string
                    user_id: string
                    book_id: string
                    edition_id?: string | null
                    status: 'WANT_TO_READ' | 'READING' | 'READ' | 'DNF'
                    rating?: number | null
                    review?: string | null
                    start_date?: string | null
                    finish_date?: string | null
                    created_at?: string
                    updated_at?: string | null
                }
                Update: {
                    id?: string
                    user_id?: string
                    book_id?: string
                    edition_id?: string | null
                    status?: 'WANT_TO_READ' | 'READING' | 'READ' | 'DNF'
                    rating?: number | null
                    review?: string | null
                    start_date?: string | null
                    finish_date?: string | null
                    created_at?: string
                    updated_at?: string | null
                }
            }
            reading_sessions: {
                Row: {
                    id: string
                    user_id: string
                    book_id: string
                    edition_id: string | null
                    started_at: string | null
                    ended_at: string | null
                    pages_read: number | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    book_id: string
                    edition_id?: string | null
                    started_at?: string | null
                    ended_at?: string | null
                    pages_read?: number | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    book_id?: string
                    edition_id?: string | null
                    started_at?: string | null
                    ended_at?: string | null
                    pages_read?: number | null
                    created_at?: string
                }
            }
            lists: {
                Row: {
                    id: string
                    user_id: string
                    name: string
                    description: string | null
                    is_public: boolean
                    created_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    name: string
                    description?: string | null
                    is_public?: boolean
                    created_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    name?: string
                    description?: string | null
                    is_public?: boolean
                    created_at?: string
                }
            }
            list_items: {
                Row: {
                    id: string
                    list_id: string
                    book_id: string
                    added_at: string
                }
                Insert: {
                    id?: string
                    list_id: string
                    book_id: string
                    added_at?: string
                }
                Update: {
                    id?: string
                    list_id?: string
                    book_id?: string
                    added_at?: string
                }
            }
            challenges: {
                Row: {
                    id: string
                    title: string
                    description: string | null
                    start_date: string | null
                    end_date: string | null
                    rules: string | null
                    reward_badge_name: string | null
                    reward_badge_image_url: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    title: string
                    description?: string | null
                    start_date?: string | null
                    end_date?: string | null
                    rules?: string | null
                    reward_badge_name?: string | null
                    reward_badge_image_url?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    title?: string
                    description?: string | null
                    start_date?: string | null
                    end_date?: string | null
                    rules?: string | null
                    reward_badge_name?: string | null
                    reward_badge_image_url?: string | null
                    created_at?: string
                    updated_at?: string
                }
            }
        }
        // Supabase v2 exige estos slots para resolver los tipos de Row/Insert/Update.
        // Vacíos por ahora; cuando se regeneren los tipos automáticamente se llenarán.
        Views: { [_ in never]: never }
        Functions: { [_ in never]: never }
        Enums: { [_ in never]: never }
        CompositeTypes: { [_ in never]: never }
    }
}
