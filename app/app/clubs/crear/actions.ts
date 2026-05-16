'use server';

import { createClient } from '@/utils/supabase/server';
import { Club } from '@/types/clubs';
import { revalidatePath } from 'next/cache';
import { searchISBNdb, BookSearchResult } from '@/lib/isbndb';

export async function searchBooks(query: string): Promise<BookSearchResult[]> {
    if (!query || query.length < 3) return [];
    try {
        const results = await searchISBNdb(query, 1, 10);
        return results;
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

    try {
        const visibility = ['public', 'private', 'secret'].includes(data.privacy)
            ? data.privacy
            : 'public';
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
                price: price,
                currency: 'EUR',
                tags: data.tags || [],
                is_official: false,
                is_archived: false,
                rules: data.rules || [],
                join_code: joinCode,
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

        // 3. Add Book if selected
        if (data.book) {
            let bookId = data.book.id;

            // Handle ISBNdb results which don't exist in our DB yet
            if (data.book.isbn) {
                const { data: existingBook } = await supabase.from('books').select('id').eq('isbn', data.book.isbn).single();
                if (existingBook) {
                    bookId = existingBook.id;
                } else {
                    // Handle Author creation/lookup
                    let authorId = null;
                    const authorName = data.book.authors && data.book.authors.length > 0 ? data.book.authors[0] : (data.book.author || null);

                    if (authorName) {
                        const { data: existingAuthor } = await supabase.from('authors').select('id').eq('name', authorName).single();
                        if (existingAuthor) {
                            authorId = existingAuthor.id;
                        } else {
                            const { data: newAuthor, error: authorError } = await supabase.from('authors').insert({ name: authorName }).select().single();
                            if (newAuthor) authorId = newAuthor.id;
                            if (authorError) console.error("Error creating author:", authorError);
                        }
                    }

                    // Insert new book
                    const { data: newBook, error: bookInsertError } = await supabase.from('books').insert({
                        title: data.book.title,
                        author_id: authorId,
                        cover_url: data.book.cover_url,
                        description: data.book.description,
                        isbn: data.book.isbn,
                        page_count: data.book.page_count,
                    }).select().single();

                    if (newBook) bookId = newBook.id;
                    else if (bookInsertError) {
                        console.error("Error inserting book:", bookInsertError);
                        // Usually failing to insert book shouldn't fail club creation entirely, but good to know
                    }
                }
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
                        author: authors(name)
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
                author: currentBook.book.author?.name || 'Autor desconocido',
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
                    author: authors(name)
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
                author: currentBook.book.author?.name || 'Autor desconocido',
                coverUrl: currentBook.book.cover_url
            } : null,
        };
    }));

    return clubs;
}
