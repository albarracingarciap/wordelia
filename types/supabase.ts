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
                    author_id: string | null
                    cover_url: string | null
                    description: string | null
                    isbn: string | null
                    page_count: number | null
                    published_date: string | null
                    genome_data: Json | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    title: string
                    author_id?: string | null
                    cover_url?: string | null
                    description?: string | null
                    isbn?: string | null
                    page_count?: number | null
                    published_date?: string | null
                    genome_data?: Json | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    title?: string
                    author_id?: string | null
                    cover_url?: string | null
                    description?: string | null
                    isbn?: string | null
                    page_count?: number | null
                    published_date?: string | null
                    genome_data?: Json | null
                    created_at?: string
                }
            }
            user_books: {
                Row: {
                    id: string
                    user_id: string
                    book_id: string
                    status: 'WANT_TO_READ' | 'READING' | 'READ' | 'DNF'
                    rating: number | null
                    review: string | null
                    start_date: string | null
                    finish_date: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    book_id: string
                    status: 'WANT_TO_READ' | 'READING' | 'READ' | 'DNF'
                    rating?: number | null
                    review?: string | null
                    start_date?: string | null
                    finish_date?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    book_id?: string
                    status?: 'WANT_TO_READ' | 'READING' | 'READ' | 'DNF'
                    rating?: number | null
                    review?: string | null
                    start_date?: string | null
                    finish_date?: string | null
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
    }
}
