'use server';

import { createClient } from '@/utils/supabase/server';
import { createAdminClient, hasSupabaseAdminConfig } from '@/utils/supabase/admin';
import { BookSearchResult } from '@/lib/isbndb';
import { discussionGuides } from '@/lib/guides';

export interface CuratedCollection {
    id: string;
    slug: string;
    name: string;
    description: string;
    tag_line: string;
    icon: string;
    color_theme: string;
    display_order: number;
}

/**
 * Datos reales que Wordelia tiene sobre un libro concreto, para enriquecer la
 * ficha de /explorar. Todo es opcional: si no hay nada, el modal no pinta el
 * bloque en lugar de inventar contenido.
 */
export interface BookExtras {
    /** Club oficial que lo lee ahora o lo tiene programado. */
    club: {
        name: string;
        slug: string | null;
        id: string;
        start_date: string | null;
        hook_question: string | null;
    } | null;
    /** Hay guía de discusión publicada para este libro. */
    guideSlug: string | null;
}

/**
 * Resuelve el ISBN a nuestro catálogo (editions -> books) y busca qué le consta
 * a Wordelia sobre ese libro. Los ISBN que nunca se han ingestado simplemente
 * no resuelven, y se devuelve todo a null.
 */
export async function getBookExtras(isbn: string, title?: string, knownBookId?: string): Promise<BookExtras> {
    const empty: BookExtras = { club: null, guideSlug: null };

    // La guía se resuelve por título porque el catálogo de guías es editorial
    // (lib/guides.ts) y no está indexado por ISBN.
    const normalized = (title || '').trim().toLowerCase();
    const guide = normalized
        ? discussionGuides.find((g) => g.bookTitle.toLowerCase() === normalized)
        : undefined;
    const guideSlug = guide?.slug ?? null;

    const cleanIsbn = (isbn || '').replace(/[^0-9Xx]/g, '');
    if (!knownBookId && !cleanIsbn) return { ...empty, guideSlug };

    try {
        const supabase = await createClient();

        // Si la ficha viene del catálogo ya sabemos el libro; solo hace falta
        // resolver por ISBN cuando el origen es una búsqueda externa.
        let bookId = knownBookId ?? null;

        if (!bookId) {
            const { data: edition } = await supabase
                .from('editions')
                .select('book_id')
                .or(`isbn13.eq.${cleanIsbn},isbn.eq.${cleanIsbn}`)
                .maybeSingle();
            bookId = edition?.book_id ?? null;
        }

        if (!bookId) return { ...empty, guideSlug };

        const { data: clubBooks } = await supabase
            .from('club_books')
            .select(`
                status, start_date, pregunta_apertura,
                club:clubs!inner ( id, name, slug, is_official, is_archived )
            `)
            .eq('book_id', bookId)
            .in('status', ['current', 'planned'])
            .eq('club.is_official', true)
            .eq('club.is_archived', false)
            .limit(1);

        const row: any = (clubBooks || [])[0];
        const club = row?.club
            ? {
                id: row.club.id,
                name: row.club.name,
                slug: row.club.slug ?? null,
                start_date: row.start_date ?? null,
                hook_question: row.pregunta_apertura ?? null,
            }
            : null;

        return { club, guideSlug };
    } catch (error) {
        console.error('Error fetching book extras:', error);
        return { ...empty, guideSlug };
    }
}

// =============================================
// VISTA PÚBLICA SOBRE EL CATÁLOGO
// Sustituye a las fotos JSON de ISBNdb: solo libros del catálogo con guía y
// genoma PUBLICADOS, curados desde el panel de administración.
// =============================================

export interface PublicBook {
    id: string;
    title: string;
    author: string | null;
    coverUrl: string | null;
    description: string | null;
    pageCount: number | null;
    publisher: string | null;
    publishedDate: string | null;
    isbn: string | null;
}

export interface PublicCollection {
    id: string;
    slug: string;
    name: string;
    description: string;
    tagLine: string;
    icon: string;
    colorTheme: string;
    books: PublicBook[];
    /** Total en la colección, aunque se muestren solo unos pocos. */
    totalBooks: number;
}

/**
 * Baraja determinista a partir de una semilla. Se usa la fecha del día para
 * que la selección rote a diario pero sea estable dentro del mismo día:
 * así la página se puede cachear y un buscador no ve contenido distinto en
 * cada rastreo.
 */
function seededShuffle<T>(items: T[], seed: number): T[] {
    const out = [...items];
    let state = seed || 1;

    for (let i = out.length - 1; i > 0; i--) {
        // mulberry32, suficiente para rotar un escaparate.
        state |= 0; state = (state + 0x6D2B79F5) | 0;
        let t = Math.imul(state ^ (state >>> 15), 1 | state);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        const rnd = ((t ^ (t >>> 14)) >>> 0) / 4294967296;

        const j = Math.floor(rnd * (i + 1));
        [out[i], out[j]] = [out[j], out[i]];
    }

    return out;
}

function todaySeed(): number {
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    let hash = 0;
    for (let i = 0; i < today.length; i++) hash = (hash * 31 + today.charCodeAt(i)) | 0;
    return hash;
}

type BookRow = { id: string; title: string; author: string | null; description: string | null; preferred_edition_id: string | null };

/**
 * Carga los libros publicados agrupados por colección.
 * `perCollection` limita cuántos se devuelven de cada una (rotación diaria);
 * sin límite, devuelve todos (para las páginas de categoría).
 */
async function loadPublicCollections(perCollection?: number, onlySlug?: string): Promise<PublicCollection[]> {
    if (!hasSupabaseAdminConfig()) {
        console.error('Explorar: falta la configuración de service role.');
        return [];
    }

    const db = createAdminClient() as unknown as { from: (t: string) => any };

    let collectionsQuery = db.from('curated_collections')
        .select('id, slug, name, description, tag_line, icon, color_theme, display_order')
        .order('display_order', { ascending: true });
    if (onlySlug) collectionsQuery = collectionsQuery.eq('slug', onlySlug);

    const [{ data: collections, error: cErr }, { data: guides }] = await Promise.all([
        collectionsQuery,
        db.from('book_guides').select('book_id').eq('status', 'published'),
    ]);

    if (cErr || !collections?.length) {
        if (cErr) console.error('Error fetching collections:', cErr.message);
        return [];
    }

    const publishedIds = new Set((guides ?? []).map((g: any) => g.book_id).filter(Boolean));
    if (publishedIds.size === 0) {
        return collections.map((c: any) => mapCollection(c, [], 0));
    }

    const { data: links } = await db.from('curated_collection_books')
        .select('book_id, collection_id, display_order')
        .not('book_id', 'is', null)
        .in('collection_id', collections.map((c: any) => c.id));

    const eligible = (links ?? []).filter((l: any) => publishedIds.has(l.book_id));
    if (eligible.length === 0) return collections.map((c: any) => mapCollection(c, [], 0));

    const { data: books } = await db.from('books')
        .select('id, title, author, description, preferred_edition_id')
        .in('id', eligible.map((l: any) => l.book_id));

    const editionIds = (books ?? []).map((b: BookRow) => b.preferred_edition_id).filter(Boolean);
    const { data: editions } = editionIds.length
        ? await db.from('editions')
            .select('id, cover_url, page_count, publisher, published_date, isbn13, isbn')
            .in('id', editionIds)
        : { data: [] };

    const editionById = new Map<string, any>((editions ?? []).map((e: any) => [e.id, e]));
    const bookById = new Map<string, BookRow>((books ?? []).map((b: any) => [b.id, b as BookRow]));
    const seed = todaySeed();

    return collections.map((collection: any) => {
        const ids = eligible
            .filter((l: any) => l.collection_id === collection.id)
            .map((l: any) => l.book_id);

        const all: PublicBook[] = ids
            .map((id: string) => {
                const book = bookById.get(id);
                if (!book) return null;
                const ed = book.preferred_edition_id ? editionById.get(book.preferred_edition_id) : null;
                return {
                    id: book.id,
                    title: book.title,
                    author: book.author ?? null,
                    coverUrl: ed?.cover_url ?? null,
                    description: book.description ?? null,
                    pageCount: ed?.page_count ?? null,
                    publisher: ed?.publisher ?? null,
                    publishedDate: ed?.published_date ?? null,
                    isbn: ed?.isbn13 ?? ed?.isbn ?? null,
                };
            })
            .filter(Boolean) as PublicBook[];

        // Rotación diaria; sin límite se ordenan por título para la página completa.
        const shown = perCollection
            ? seededShuffle(all, seed + collection.slug.length).slice(0, perCollection)
            : [...all].sort((a, b) => a.title.localeCompare(b.title, 'es'));

        return mapCollection(collection, shown, all.length);
    });
}

function mapCollection(c: any, books: PublicBook[], total: number): PublicCollection {
    return {
        id: c.id,
        slug: c.slug,
        name: c.name,
        description: c.description,
        tagLine: c.tag_line,
        icon: c.icon,
        colorTheme: c.color_theme,
        books,
        totalBooks: total,
    };
}

/** Colecciones con 6 libros del día cada una, para /explorar. */
export async function getPublicCollections(perCollection = 6): Promise<PublicCollection[]> {
    return loadPublicCollections(perCollection);
}

/** Todos los libros publicados de una colección, para /explorar/[slug]. */
export async function getPublicCollectionBySlug(slug: string): Promise<PublicCollection | null> {
    const [collection] = await loadPublicCollections(undefined, slug);
    return collection ?? null;
}
