'use server';

import { createClient } from '@/utils/supabase/server';
import { BookSearchResult } from '@/lib/isbndb';

export interface OfficialClub {
    id: string;
    slug: string;
    name: string;
    description: string;
    book_isbn: string;
    book_data: BookSearchResult | null;
    start_date: string;
    theme_color: string;
    theme_icon: string;
    is_featured: boolean;
    display_order: number;
    price_cents?: number | null;
    currency?: string | null;
}

export interface HomeClub {
    id: string;
    slug?: string | null;
    name: string;
    description?: string | null;
    tags?: string[] | null;
    start_date?: string | null;
    hook_question?: string | null;
    price?: number | null;
    currency?: string | null;
    destacado?: boolean;
    book?: { title?: string | null; author?: string | null; cover_url?: string | null } | null;
}

/**
 * Clubs oficiales marcados para el home (clubs.portada), con el libro (current o
 * planned) de club_books. El destacado (clubs.destacado) va primero. Máx. 4.
 */
export async function getHomeClubs(): Promise<HomeClub[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('clubs')
        .select(`
            id, name, slug, description, tags, price, currency, destacado,
            club_books ( status, start_date, cover_url, pregunta_apertura, book:books ( title, author:authors(name) ) )
        `)
        .eq('is_official', true)
        .eq('portada', true)
        .eq('is_archived', false);

    if (error) {
        console.error('Error fetching home clubs:', error.message, '| details:', error.details, '| hint:', error.hint, '| code:', error.code);
        return [];
    }

    const clubs: HomeClub[] = (data || []).map((club: any) => {
        const books = Array.isArray(club.club_books) ? club.club_books : [];
        const clubBook = books.find((b: any) => b.status === 'current')
            || books.find((b: any) => b.status === 'planned')
            || null;
        const book = clubBook?.book || null;

        return {
            id: club.id,
            slug: club.slug ?? null,
            name: club.name,
            description: club.description ?? null,
            tags: club.tags ?? null,
            start_date: clubBook?.start_date ?? null,
            hook_question: clubBook?.pregunta_apertura ?? null,
            price: typeof club.price === 'number' ? club.price : (club.price != null ? Number(club.price) : null),
            currency: club.currency ?? null,
            destacado: Boolean(club.destacado),
            book: book
                ? {
                    title: book.title ?? null,
                    author: book.author?.name ?? null,
                    cover_url: clubBook?.cover_url ?? null,
                }
                : null,
        };
    });

    // Destacado primero; como mucho 4 clubs en el home.
    clubs.sort((a, b) => Number(b.destacado) - Number(a.destacado));
    return clubs.slice(0, 4);
}

/**
 * Get all official clubs ordered by display_order
 */
export async function getOfficialClubs(): Promise<OfficialClub[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('official_clubs')
        .select('*')
        .order('display_order', { ascending: true });

    if (error) {
        console.error('Error fetching official clubs:', error);
        return [];
    }

    return data || [];
}

/**
 * Get the featured club (Club del Mes)
 */
export async function getFeaturedClub(): Promise<OfficialClub | null> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('official_clubs')
        .select('*')
        .eq('is_featured', true)
        .single();

    if (error) {
        console.error('Error fetching featured club:', error);
        return null;
    }

    return data;
}

/**
 * Get a specific club by slug
 */
export async function getClubBySlug(slug: string): Promise<OfficialClub | null> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('official_clubs')
        .select('*')
        .eq('slug', slug)
        .single();

    if (error) {
        console.error(`Error fetching club ${slug}:`, error);
        return null;
    }

    return data;
}

/**
 * Get non-featured clubs (the 4 official clubs excluding Club del Mes)
 */
export async function getRegularClubs(): Promise<OfficialClub[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('official_clubs')
        .select('*')
        .eq('is_featured', false)
        .order('display_order', { ascending: true });

    if (error) {
        console.error('Error fetching regular clubs:', error);
        return [];
    }

    return data || [];
}
