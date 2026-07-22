'use server';

import { createClient } from '@/utils/supabase/server';
import { isOrgProActive, isSubscriptionActive } from '@/lib/subscription-access';
import { Club } from '@/types/clubs';
import { revalidatePath } from 'next/cache';
import { BookSearchResult } from '@/lib/isbndb';
import { searchBooks as searchBooksCascade } from '@/lib/book-search';
import { resolveBookFromResult } from '@/lib/book-resolution';
import { bookAuthorLabel } from '@/lib/book-author';

export async function searchBooks(query: string): Promise<BookSearchResult[]> {
    if (!query || query.length < 3) return [];
    try {
        return await searchBooksCascade({ query, limit: 10 });
    } catch (error) {
        console.error("Search error:", error);
        return [];
    }
}

function generateJoinCode() {
    return Math.random().toString(36).substring(2, 8).toUpperCase() +
        Math.random().toString(36).substring(2, 6).toUpperCase();
}

export async function createClub(data: any) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: "Debes iniciar sesión para crear un club." };
    }

    const name = data.name;
    // Generate a simple slug from name + random suffix for now
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Math.random().toString(36).substring(7);

    // Parse price safely
    let price = 0;
    try {
        if (data.price) {
            price = parseFloat(data.price.toString().replace(',', '.'));
            if (isNaN(price)) price = 0;
        }
    } catch (e) {
        console.error("Error parsing price", e);
    }

    let clubId = "";

    // Club oficial de Wordelia: el flag del cliente se REVERIFICA en servidor
    // (solo admin/editor). Nunca se confía en el flag tal cual.
    let isOfficial = false;
    if (data.is_official === true) {
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .maybeSingle();
        if (profile?.role !== 'admin' && profile?.role !== 'editor') {
            return { error: 'No tienes permiso para crear clubs oficiales.' };
        }
        isOfficial = true;
    }

    // Optional: hosting this club under a bookstore ("librería").
    const organizationId: string | null = data.organizationId || null;
    if (organizationId) {
        // Caller must be owner/manager of the organization.
        const { data: membership } = await supabase
            .from('organization_members')
            .select('role')
            .eq('organization_id', organizationId)
            .eq('user_id', user.id)
            .maybeSingle();

        if (!membership || !['owner', 'manager'].includes(membership.role)) {
            return { error: 'No tienes permiso para crear clubs en esta librería.' };
        }

        // Free tier is limited to 1 active club. An expired Pro counts as free.
        const { data: sub } = await supabase
            .from('organization_subscriptions')
            .select('tier, status, current_period_end')
            .eq('organization_id', organizationId)
            .maybeSingle();

        if (!isOrgProActive(sub)) {
            const { count } = await supabase
                .from('clubs')
                .select('id', { count: 'exact', head: true })
                .eq('organization_id', organizationId)
                .eq('is_archived', false);

            if ((count || 0) >= 1) {
                return { error: 'Has alcanzado el límite del plan Gratis (1 club). Sube a Pro para crear más clubs.' };
            }
        }
    }

    const visibility = ['public', 'private', 'secret'].includes(data.privacy)
        ? data.privacy
        : 'public';

    // Personal (non-org) club: gate by user plan. Explorador (gratis) puede crear
    // 1 club PÚBLICO; los privados/secretos y crear varios requieren plan de pago.
    // Los clubs oficiales (admin) no pasan por este gate.
    if (!organizationId && !isOfficial) {
        const { data: sub } = await supabase
            .from('user_subscriptions')
            .select('status, current_period_end')
            .eq('user_id', user.id)
            .maybeSingle();
        const isPaid = isSubscriptionActive(sub?.status, sub?.current_period_end);
        if (!isPaid) {
            if (visibility !== 'public') {
                return { error: 'Los clubs privados y secretos son del plan Voraz. Sube de plan para crearlos.' };
            }
            const { count } = await supabase
                .from('clubs')
                .select('id', { count: 'exact', head: true })
                .eq('owner_id', user.id)
                .is('organization_id', null)
                .eq('is_archived', false);
            if ((count || 0) >= 1) {
                return { error: 'El plan gratuito permite crear 1 club. Sube a Voraz para crear clubs ilimitados.' };
            }
        }
    }

    try {
        const joinCode = visibility === 'private' || visibility === 'secret'
            ? generateJoinCode()
            : null;

        // 1. Create Club
        const { data: club, error: clubError } = await supabase
            .from('clubs')
            .insert({
                name,
                slug,
                description: data.description,
                visibility,
                owner_id: user.id,
                organization_id: organizationId,
                price: price,
                currency: 'EUR',
                tags: data.tags || [],
                is_official: isOfficial,
                is_archived: false,
                rules: data.rules || [],
                join_code: joinCode,
                cover_url: data.coverUrl || null,
                // Escaparate (home): solo configurable en clubs oficiales.
                destacado: isOfficial ? !!data.destacado : false,
                portada: isOfficial ? !!data.portada : false,
                // Eje 2 (estilo) + ajustes que el wizard recoge y antes se descartaban.
                reading_style: data.templateId || null,
                reading_type: data.readingType || null,
                spoiler_policy: data.spoilerPolicy || null,
                pace: data.pace || null,
                language: data.language || null,
                max_members: typeof data.maxMembers === 'number' ? data.maxMembers : (data.maxMembers ? Number(data.maxMembers) || null : null),
            })
            .select()
            .single();

        if (clubError) {
            console.error("Error creating club:", clubError);
            return { error: `Error DB: ${clubError.message}` };
        }

        clubId = club.id;

        // 2. Add creator as Admin
        const { error: memberError } = await supabase
            .from('club_members')
            .insert({
                club_id: club.id,
                user_id: user.id,
                role: 'admin',
            });

        if (memberError) console.error("Error adding admin:", memberError);

        // 3. Add Book if selected — delega en EditionMatchingService vía resolveBookFromResult
        if (data.book) {
            try {
                // Normaliza el objeto a BookSearchResult: el modo manual del modal
                // a veces pasa `author` (string) en vez de `authors` (string[]).
                const normalizedBook: BookSearchResult = {
                    id: data.book.id || `manual-${Date.now()}`,
                    title: data.book.title,
                    authors: data.book.authors && data.book.authors.length > 0
                        ? data.book.authors
                        : (data.book.author ? [data.book.author] : []),
                    cover_url: data.book.cover_url ?? null,
                    description: data.book.description ?? null,
                    isbn: data.book.isbn ?? null,
                    isbn13: data.book.isbn13 ?? null,
                    page_count: data.book.page_count ?? null,
                    published_date: data.book.published_date ?? null,
                    publisher: data.book.publisher ?? null,
                    categories: data.book.categories ?? [],
                    average_rating: data.book.average_rating ?? null,
                    ratings_count: data.book.ratings_count ?? null,
                    language: data.book.language ?? null,
                    price: null,
                    source: data.book.source ?? "manual",
                };

                const { bookId } = await resolveBookFromResult(normalizedBook);

                const paceConfig = (data.pace || data.progressMeasure)
                    ? { pace: data.pace ?? null, progressMeasure: data.progressMeasure ?? null }
                    : null;
                const { error: bookLinkError } = await supabase.from('club_books').insert({
                    club_id: club.id,
                    book_id: bookId,
                    status: 'current',
                    start_date: data.startDate || new Date().toISOString(),
                    checkpoints: data.checkpoints || [],
                    pace_config: paceConfig,
                });
                if (bookLinkError) console.error("Error linking book:", bookLinkError);
            } catch (bookError) {
                console.error("Could not resolve/persist book for club:", bookError);
                // No bloqueamos la creación del club si falla la asignación del libro.
            }
        }

    } catch (err: any) {
        console.error("Unknown error in createClub:", err);
        // Log the full error object for debugging
        console.dir(err, { depth: null });
        return { error: err.message || "Unknown error occurred" };
    }

    // Success
    if (clubId) {
        revalidatePath('/app/clubs');
        return { success: true, clubId };
    }
}

// Fetch clubs the user has joined or created
export async function getUserClubs() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { active: [], archived: [] };

    // Fetch memberships to get club IDs
    const { data: memberships, error: memberError } = await supabase
        .from('club_members')
        .select(`
            club_id,
            role,
            clubs (
                *,
                current_book: club_books(
                    *,
                    book: books(
                        *,
                        author
                    )
                )
            )
        `)
        .eq('user_id', user.id);

    if (memberError) {
        console.error("Error fetching user clubs:", memberError);
        return { active: [], archived: [] };
    }

    if (!memberships) return { active: [], archived: [] };

    const clubs = await Promise.all(memberships.map(async (m: any) => {
        const club = m.clubs;
        // Count members
        const { count } = await supabase
            .from('club_members')
            .select('*', { count: 'exact', head: true })
            .eq('club_id', club.id);

        const currentBook = Array.isArray(club.current_book)
            ? club.current_book.find((b: any) => b.status === 'current')
            : null;

        return {
            ...club,
            members: Array(count || 0).fill({}),
            memberCount: count || 0,
            currentBook: currentBook && currentBook.book ? {
                title: currentBook.book.title,
                author: bookAuthorLabel(currentBook.book),
                coverUrl: currentBook.book.cover_url
            } : null,
            role: m.role,
            isMember: true,
            isAdmin: m.role === 'admin' || m.role === 'moderator'
        };
    }));

    return {
        active: clubs.filter(c => !c.is_archived),
        archived: clubs.filter(c => c.is_archived)
    };
}

// Fetch public clubs for exploration
export async function getExploreClubs(search?: string, tags?: string[]) {
    const supabase = await createClient();

    let query = supabase
        .from('clubs')
        .select(`
            *,
            current_book: club_books(
                *,
                book: books(
                    *,
                    author
                )
            )
        `)
        .eq('visibility', 'public')
        .eq('is_archived', false)
        .order('created_at', { ascending: false });

    if (search) {
        query = query.ilike('name', `%${search}%`);
    }

    if (tags && tags.length > 0) {
        query = query.contains('tags', tags);
    }

    const { data, error } = await query;

    if (error) {
        console.error("Error fetching explore clubs:", error);
        return [];
    }

    // Process to match UI needs (counts, book details)
    const clubs = await Promise.all(data.map(async (club: any) => {
        const { count } = await supabase
            .from('club_members')
            .select('*', { count: 'exact', head: true })
            .eq('club_id', club.id);

        const currentBook = Array.isArray(club.current_book)
            ? club.current_book.find((b: any) => b.status === 'current')
            : null;

        return {
            ...club,
            memberCount: count,
            currentBook: currentBook && currentBook.book ? {
                title: currentBook.book.title,
                author: bookAuthorLabel(currentBook.book),
                coverUrl: currentBook.book.cover_url
            } : null,
        };
    }));

    return clubs;
}

