'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { BookSearchResult } from '@/lib/isbndb';
import { resolveBookFromResult } from '@/lib/book-resolution';

export async function createOriginalClub(data: any) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: "No autorizado." };
    }

    // Role check - strictly require admin or editor to create official clubs here
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (profile?.role !== 'admin' && profile?.role !== 'editor') {
        return { error: "Permisos insuficientes." };
    }

    const name = data.name;
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Math.random().toString(36).substring(7);

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

    try {
        // 1. Create Official Club
        const { data: club, error: clubError } = await supabase
            .from('clubs')
            .insert({
                name,
                slug,
                description: data.description,
                visibility: data.privacy === 'private' ? 'private' : 'public',
                owner_id: user.id, // Or perhaps a general system user, but owner is fine
                price: price,
                currency: 'EUR',
                tags: data.tags || [],
                is_official: true, // FORCED true
                is_archived: false,
                rules: data.rules || [],
            })
            .select()
            .single();

        if (clubError) {
            console.error("Error creating official club:", clubError);
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

        // 3. Add Book if selected (using existing logic pattern)
        if (data.book) {
            let bookId: string | null = null;

            try {
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
                    average_rating: null,
                    ratings_count: null,
                    language: data.book.language ?? null,
                    price: null,
                    source: data.book.source ?? "manual",
                };
                const resolved = await resolveBookFromResult(normalizedBook);
                bookId = resolved.bookId;
            } catch (bookError) {
                console.error("Could not resolve book for admin club:", bookError);
            }

            if (bookId) {
                const { error: bookLinkError } = await supabase.from('club_books').insert({
                    club_id: club.id,
                    book_id: bookId,
                    status: 'current',
                    start_date: data.startDate || new Date().toISOString(),
                    checkpoints: data.checkpoints || [],
                });
                if (bookLinkError) console.error("Error linking book:", bookLinkError);
            }
        }

    } catch (err: any) {
        console.error("Unknown error in createOriginalClub:", err);
        return { error: err.message || "Unknown error occurred" };
    }

    if (clubId) {
        revalidatePath('/app/admin/clubes');
        revalidatePath('/app/clubs');
        return { success: true, clubId };
    }
}

