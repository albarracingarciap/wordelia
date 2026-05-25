"use server";

import { createClient } from "@/utils/supabase/server";

type BookWithEdition = {
    title: string | null;
    author: { name: string | null } | { name: string | null }[] | null;
    preferred_edition:
        | { cover_url: string | null }
        | { cover_url: string | null }[]
        | null;
};

type OfficialClubBookRelation = {
    status: string | null;
    start_date: string | null;
    book: BookWithEdition | BookWithEdition[] | null;
};

export async function getRegisteredUsersCount() {
    try {
        const supabase = await createClient();

        // Count all rows in the profiles table to get registered users
        const { count, error } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true });

        if (error) {
            console.error("Error fetching user count:", error);
            return 0;
        }

        return count || 0;
    } catch (error) {
        console.error("Unexpected error fetching user count:", error);
        return 0;
    }
}

export async function getOfficialClubs() {
    try {
        const supabase = await createClient();

        const { data: clubs, error } = await supabase
            .from('clubs')
            .select(`
                id,
                name,
                description,
                tags,
                price,
                currency,
                current_book: club_books(
                    status,
                    start_date,
                    book:books (
                        title,
                        author:authors(name),
                        preferred_edition:editions!books_preferred_edition_fk(cover_url)
                    )
                )
            `)
            .eq('is_official', true) // Assuming there might be an is_official flag, or we limit
            .limit(4);

        if (error) {
            console.error("Error fetching official clubs:", error);
            return [];
        }

        // Map the current_book relation to just the book object for consistency
        const mappedClubs = (clubs || []).map(club => {
            // Find the current book (usually the first one, or filter by status='current')
            const currentBookRelations = (club.current_book || []) as unknown as OfficialClubBookRelation[];
            const currentBookRel = currentBookRelations.find((cb) => cb.status === 'current') || currentBookRelations[0];
            const bookData = Array.isArray(currentBookRel?.book)
                ? currentBookRel.book[0]
                : currentBookRel?.book;

            const edition = bookData
                ? (Array.isArray(bookData.preferred_edition)
                    ? bookData.preferred_edition[0]
                    : bookData.preferred_edition)
                : null;

            return {
                ...club,
                start_date: currentBookRel?.start_date || null,
                book: bookData ? {
                    title: bookData.title,
                    cover_url: edition?.cover_url ?? null,
                    author: Array.isArray(bookData.author)
                        ? bookData.author[0]?.name
                        : (bookData.author?.name || 'Autor Desconocido')
                } : null
            };
        });

        return mappedClubs;
    } catch (error) {
        console.error("Unexpected error fetching official clubs:", error);
        return [];
    }
}
