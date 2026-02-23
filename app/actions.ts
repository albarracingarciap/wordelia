"use server";

import { createClient } from "@/utils/supabase/server";

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
                current_book: club_books(
                    status,
                    start_date,
                    book:books (
                        title,
                        author:authors(name),
                        cover_url
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
            const currentBookRel = club.current_book?.find((cb: any) => cb.status === 'current') || club.current_book?.[0];
            const bookData: any = currentBookRel?.book;

            return {
                ...club,
                start_date: currentBookRel?.start_date || null,
                book: bookData ? {
                    ...bookData,
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
