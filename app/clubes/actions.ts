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
