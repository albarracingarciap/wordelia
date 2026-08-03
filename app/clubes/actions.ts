'use server';

import { createClient } from '@/utils/supabase/server';
import { bookAuthorName } from '@/lib/book-author';

/**
 * Club oficial tal y como se muestra en las páginas públicas (/clubes y
 * /clubes/[slug]). Se construye desde `clubs` + `club_books`, que es el modelo
 * vivo: es donde escribe el panel de administración. La antigua tabla
 * `official_clubs` quedó huérfana (sin portada, destacado ni pregunta de
 * apertura) y ya no se consulta.
 */
export interface PublicClub {
    id: string;
    slug: string | null;
    name: string;
    description: string | null;
    tags: string[] | null;
    /** Precio en euros (clubs.price es decimal, no céntimos). */
    price: number | null;
    currency: string | null;
    destacado: boolean;
    /** Imagen de cabecera del club (clubs.cover_url), banner propio. */
    headerImage: string | null;
    /** Fecha de inicio de la lectura actual o programada. */
    start_date: string | null;
    hook_question: string | null;
    /** Estilo de lectura del club: 'guided' | 'analysis' (null = guiada por defecto). */
    readingType: string | null;
    book: { title: string | null; author: string | null; cover_url: string | null } | null;
}

export interface HomeClub {
    id: string;
    slug?: string | null;
    name: string;
    description?: string | null;
    tags?: string[] | null;
    start_date?: string | null;
    hook_question?: string | null;
    readingType?: string | null;
    price?: number | null;
    currency?: string | null;
    destacado?: boolean;
    headerImage?: string | null;
    book?: { title?: string | null; author?: string | null; cover_url?: string | null } | null;
}

// Campos que necesitan las vistas públicas. El libro se toma de club_books:
// primero la lectura en curso y, si no hay, la programada.
const PUBLIC_CLUB_SELECT = `
    id, name, slug, description, tags, price, currency, destacado, cover_url, reading_type,
    club_books ( status, start_date, cover_url, pregunta_apertura, book:books ( title, author ) )
`;

function pickClubBook(club: any) {
    const books = Array.isArray(club.club_books) ? club.club_books : [];
    return books.find((b: any) => b.status === 'current')
        || books.find((b: any) => b.status === 'planned')
        || null;
}

function mapPublicClub(club: any): PublicClub {
    const clubBook = pickClubBook(club);
    const book = clubBook?.book || null;

    return {
        id: club.id,
        slug: club.slug ?? null,
        name: club.name,
        description: club.description ?? null,
        tags: club.tags ?? null,
        price: club.price != null ? Number(club.price) : null,
        currency: club.currency ?? null,
        destacado: Boolean(club.destacado),
        headerImage: club.cover_url ?? null,
        start_date: clubBook?.start_date ?? null,
        hook_question: clubBook?.pregunta_apertura ?? null,
        readingType: club.reading_type ?? null,
        book: book
            ? {
                title: book.title ?? null,
                author: bookAuthorName(book),
                cover_url: clubBook?.cover_url ?? null,
            }
            : null,
    };
}

/**
 * Todos los clubs oficiales activos para la página pública /clubes.
 * El destacado va primero; el resto, por nombre.
 */
export async function getPublicClubs(): Promise<PublicClub[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('clubs')
        .select(PUBLIC_CLUB_SELECT)
        .eq('is_official', true)
        .eq('is_archived', false)
        .order('name', { ascending: true });

    if (error) {
        console.error('Error fetching public clubs:', error.message, '| code:', error.code);
        return [];
    }

    const clubs = (data || []).map(mapPublicClub);
    clubs.sort((a, b) => Number(b.destacado) - Number(a.destacado));
    return clubs;
}

/**
 * Un club oficial por slug para /clubes/[slug]. Acepta también el id, porque
 * clubs.slug es nullable y algún club antiguo puede no tenerlo.
 * Devuelve null si no existe: la página responde con notFound().
 */
export async function getPublicClubBySlug(slugOrId: string): Promise<PublicClub | null> {
    const supabase = await createClient();

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slugOrId);

    const { data, error } = await supabase
        .from('clubs')
        .select(PUBLIC_CLUB_SELECT)
        .eq('is_official', true)
        .eq('is_archived', false)
        .eq(isUuid ? 'id' : 'slug', slugOrId)
        // maybeSingle: sin resultados devuelve null sin registrar un error,
        // a diferencia de single(), que trata "0 filas" como fallo.
        .maybeSingle();

    if (error) {
        console.error(`Error fetching club ${slugOrId}:`, error.message, '| code:', error.code);
        return null;
    }

    return data ? mapPublicClub(data) : null;
}


/**
 * Clubs oficiales marcados para el home (clubs.portada). El destacado va
 * primero. Máx. 4.
 */
export async function getHomeClubs(): Promise<HomeClub[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('clubs')
        .select(PUBLIC_CLUB_SELECT)
        .eq('is_official', true)
        .eq('portada', true)
        .eq('is_archived', false);

    if (error) {
        console.error('Error fetching home clubs:', error.message, '| details:', error.details, '| hint:', error.hint, '| code:', error.code);
        return [];
    }

    const clubs = (data || []).map(mapPublicClub);
    clubs.sort((a, b) => Number(b.destacado) - Number(a.destacado));
    return clubs.slice(0, 4);
}
