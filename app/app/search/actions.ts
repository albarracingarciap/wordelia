"use server";

import { createClient } from "@/utils/supabase/server";
import { BookSearchResult, searchISBNdb, getBookByISBN } from "@/lib/isbndb";
import { revalidatePath } from "next/cache";

export async function searchBooksAction(query: string): Promise<BookSearchResult[]> {
    return await searchISBNdb(query);
}

export async function getBookDetailsAction(id: string): Promise<BookSearchResult | null> {
    // Assuming ID from client for non-db users is the ISBN
    return await getBookByISBN(id);
}

// Helper to ensure author and book exist in DB, returns bookId
export async function ensureBookInDb(book: BookSearchResult): Promise<string> {
    const supabase = await createClient();

    // 1. Handle Author
    const authorName = book.authors && book.authors.length > 0 ? book.authors[0] : "Autor Desconocido";

    let authorId: string | null = null;

    const { data: existingAuthor } = await supabase
        .from("authors")
        .select("id")
        .eq("name", authorName)
        .single();

    if (existingAuthor) {
        authorId = existingAuthor.id;
    } else {
        const { data: newAuthor, error: createAuthorError } = await supabase
            .from("authors")
            .insert({ name: authorName })
            .select("id")
            .single();

        if (createAuthorError) throw new Error("Error creating author: " + createAuthorError.message);
        authorId = newAuthor.id;
    }

    // 2. Handle Book
    let bookId: string | null = null;

    let query = supabase.from("books").select("id");
    if (book.isbn) {
        query = query.eq("isbn", book.isbn);
    } else {
        query = query.eq("title", book.title).eq("author_id", authorId);
    }

    const { data: existingBook } = await query.single();

    if (existingBook) {
        bookId = existingBook.id;
    } else {
        const { data: newBook, error: createBookError } = await supabase
            .from("books")
            .insert({
                title: book.title,
                author_id: authorId,
                cover_url: book.cover_url,
                description: book.description,
                isbn: book.isbn,
                page_count: book.page_count,
                published_date: book.published_date ? new Date(book.published_date).toISOString() : null,
                publisher: book.publisher,
                language: book.language,
            } as any)
            .select("id")
            .single();

        if (createBookError) throw new Error("Error creating book: " + createBookError.message);
        bookId = newBook.id;
    }

    if (!bookId) {
        throw new Error("Unexpected error: Book ID is missing");
    }

    return bookId;
}

export async function addBookToLibrary(book: BookSearchResult, status: 'WANT_TO_READ' | 'READING' | 'READ' = 'WANT_TO_READ') {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
        return { error: "User not authenticated" };
    }

    try {
        const bookId = await ensureBookInDb(book);

        // 3. Add to User Library (user_books)
        const { error: userBookError } = await supabase
            .from("user_books")
            .upsert({
                user_id: user.id,
                book_id: bookId,
                status: status,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString() // Ensure updated_at is refreshed
            }, { onConflict: 'user_id, book_id' });

        if (userBookError) throw new Error("Error adding to library: " + userBookError.message);

        revalidatePath("/app/search");
        revalidatePath("/app/mi-lectura");

        return { success: true };

    } catch (e: any) {
        console.error("addBookToLibrary Exception:", e);
        return { error: e.message };
    }
}
