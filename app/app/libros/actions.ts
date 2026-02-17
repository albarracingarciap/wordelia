"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { getBookByISBN } from "@/lib/isbndb"; // Updated import
import { ensureBookInDb } from "@/app/app/search/actions";

export type ReviewState = {
    success?: boolean;
    error?: string;
};

export async function saveReview(bookId: string, rating: number, review: string): Promise<ReviewState> {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
        return { error: "Debes iniciar sesión para dejar una reseña." };
    }

    try {
        let realBookId = bookId;

        // Check if bookId is a UUID
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(bookId);

        if (!isUuid) {
            // It's likely an ISBN (from ISBNdb). Fetch details and ensure it's in DB.
            const isbnBook = await getBookByISBN(bookId);
            if (!isbnBook) {
                return { error: "El libro no se pudo encontrar en ISBNdb." };
            }
            realBookId = await ensureBookInDb(isbnBook);
        }

        // Check if the book is already in user_books
        const { data: existingEntry } = await supabase
            .from("user_books")
            .select("status")
            .eq("user_id", user.id)
            .eq("book_id", realBookId)
            .single();

        const status = existingEntry ? existingEntry.status : 'READ';

        const { error: upsertError } = await supabase
            .from("user_books")
            .upsert({
                user_id: user.id,
                book_id: realBookId,
                rating: rating,
                review: review,
                status: status,
                updated_at: new Date().toISOString()
            }, { onConflict: 'user_id, book_id' });

        if (upsertError) throw new Error(upsertError.message);

        revalidatePath(`/app/libros/${bookId}`); // Revalidate the Google ID path if we were there
        if (realBookId !== bookId) revalidatePath(`/app/libros/${realBookId}`); // Revalidate real ID path too
        revalidatePath("/app/mi-lectura");

        return { success: true };

    } catch (e: any) {
        console.error("saveReview Error:", e);
        return { error: e.message || "Error al guardar la reseña." };
    }
}
