'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

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
            let bookId = data.book.id;

            if (data.book.isbn) {
                const { data: existingBook } = await supabase.from('books').select('id').eq('isbn', data.book.isbn).single();
                if (existingBook) {
                    bookId = existingBook.id;
                } else {
                    let authorId = null;
                    const authorName = data.book.authors && data.book.authors.length > 0 ? data.book.authors[0] : (data.book.author || null);

                    if (authorName) {
                        const { data: existingAuthor } = await supabase.from('authors').select('id').eq('name', authorName).single();
                        if (existingAuthor) {
                            authorId = existingAuthor.id;
                        } else {
                            const { data: newAuthor, error: authorError } = await supabase.from('authors').insert({ name: authorName }).select().single();
                            if (newAuthor) authorId = newAuthor.id;
                        }
                    }

                    const { data: newBook, error: bookInsertError } = await supabase.from('books').insert({
                        title: data.book.title,
                        author_id: authorId,
                        cover_url: data.book.cover_url,
                        description: data.book.description,
                        isbn: data.book.isbn,
                        page_count: data.book.page_count,
                    }).select().single();

                    if (newBook) bookId = newBook.id;
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
        console.error("Unknown error in createOriginalClub:", err);
        return { error: err.message || "Unknown error occurred" };
    }

    if (clubId) {
        revalidatePath('/app/admin/clubes');
        revalidatePath('/app/clubs');
        return { success: true, clubId };
    }
}
