"use server";

import { createClient } from "@/utils/supabase/server";
import { searchISBNdb, getBookByISBN } from "@/lib/isbndb";
import { revalidatePath } from "next/cache";

export async function searchBooksAction(query: string) {
    if (!query || query.length < 3) return [];
    try {
        const results = await searchISBNdb(query, 1, 20);
        return results;
    } catch (error) {
        console.error("Search error:", error);
        throw new Error("Failed to search books");
    }
}

export async function getBookDetailsAction(isbn: string) {
    if (!isbn) return null;
    try {
        const result = await getBookByISBN(isbn);
        return result;
    } catch (error) {
        console.error("Error fetching book details:", error);
        throw new Error("Failed to fetch book details");
    }
}

export async function checkBookExistsAction(isbn: string) {
    const supabase = await createClient();
    const { data } = await supabase.from('books').select('id').eq('isbn', isbn).single();
    return !!data;
}

export async function importBookAction(data: {
    title: string;
    description: string;
    cover_url: string;
    isbn: string;
    page_count: number;
    published_date: string;
    author_name: string;
    genome_data: any;
}) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: "No autorizado" };

    const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

    if (profile?.role !== "admin" && profile?.role !== "editor") {
        return { error: "Permisos insuficientes" };
    }

    try {
        // Handle Author
        let authorId = null;
        if (data.author_name) {
            const { data: existingAuthor } = await supabase.from('authors').select('id').eq('name', data.author_name).single();
            if (existingAuthor) {
                authorId = existingAuthor.id;
            } else {
                const { data: newAuthor, error: authorError } = await supabase.from('authors').insert({ name: data.author_name }).select().single();
                if (newAuthor) authorId = newAuthor.id;
                if (authorError) throw new Error(`Error creando autor: ${authorError.message}`);
            }
        }

        // Handle Book
        const { data: newBook, error: bookInsertError } = await supabase.from('books').insert({
            title: data.title,
            author_id: authorId,
            cover_url: data.cover_url,
            description: data.description,
            isbn: data.isbn,
            page_count: data.page_count || null,
            published_date: data.published_date || null,
            genome_data: data.genome_data || {},
        }).select().single();

        if (bookInsertError) throw new Error(`Error insertando libro: ${bookInsertError.message}`);

        revalidatePath("/app/admin/catalogo");
        return { success: true, bookId: newBook.id };

    } catch (e: any) {
        console.error("Unknown error in importBook:", e);
        return { error: e.message || "Unknown error occurred" };
    }
}
