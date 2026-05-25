"use server";

import { revalidatePath } from "next/cache";

import { BookSearchResult, searchISBNdb, getBookByISBN } from "@/lib/isbndb";
import { resolveBookFromResult } from "@/lib/book-resolution";
import { createClient } from "@/utils/supabase/server";

export async function searchBooksAction(query: string): Promise<BookSearchResult[]> {
    return await searchISBNdb(query);
}

export async function getBookDetailsAction(id: string): Promise<BookSearchResult | null> {
    return await getBookByISBN(id);
}

export async function addBookToLibrary(
    book: BookSearchResult,
    status: "WANT_TO_READ" | "READING" | "READ" = "WANT_TO_READ",
) {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
        return { error: "User not authenticated" };
    }

    try {
        const { bookId, editionId } = await resolveBookFromResult(book);

        const { error: userBookError } = await supabase
            .from("user_books")
            .upsert(
                {
                    user_id: user.id,
                    book_id: bookId,
                    edition_id: editionId,
                    status,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                },
                { onConflict: "user_id, book_id" },
            );

        if (userBookError) {
            throw new Error("Error adding to library: " + userBookError.message);
        }

        revalidatePath("/app/search");
        revalidatePath("/app/mi-lectura");

        return { success: true };
    } catch (e: unknown) {
        console.error("addBookToLibrary Exception:", e);
        return { error: e instanceof Error ? e.message : "Error adding to library" };
    }
}
