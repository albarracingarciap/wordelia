"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/utils/supabase/server";
import { getBookByISBN } from "@/lib/isbndb";
import { searchBooks as searchBooksCascade } from "@/lib/book-search";
import { matchAndPersistEdition } from "@/lib/edition-matching";
import type { Json } from "@/types/supabase";

export async function searchBooksAction(query: string) {
    if (!query || query.length < 3) return [];
    try {
        return await searchBooksCascade({ query, limit: 20 });
    } catch (error) {
        console.error("Search error:", error);
        throw new Error("Failed to search books");
    }
}

export async function getBookDetailsAction(isbn: string) {
    if (!isbn) return null;
    try {
        return await getBookByISBN(isbn);
    } catch (error) {
        console.error("Error fetching book details:", error);
        throw new Error("Failed to fetch book details");
    }
}

/**
 * Comprueba si un ISBN ya está en el catálogo. Ahora consulta `editions`
 * (donde viven los ISBN), no `books` (que ya no tiene columna isbn).
 */
export async function checkBookExistsAction(isbn: string) {
    const supabase = await createClient();
    const normalized = normalizeISBN(isbn) || isbn;
    const { data } = await supabase
        .from("editions")
        .select("id")
        .or(`isbn13.eq.${normalized},isbn.eq.${normalized}`)
        .maybeSingle();
    return !!data;
}

/**
 * Importa un libro al catálogo desde el panel de admin.
 * Delega en EditionMatchingService con bypassQuality:true (admin sabe lo que hace).
 * El campo `genome_data` se aplica directamente al `book` tras la creación si llega.
 */
export async function importBookAction(data: {
    title: string;
    description: string;
    cover_url: string;
    isbn: string;
    page_count: number;
    published_date: string;
    author_name: string;
    genome_data: Json;
}) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "No autorizado" };

    const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

    if (profile?.role !== "admin" && profile?.role !== "editor") {
        return { error: "Permisos insuficientes" };
    }

    try {
        const normalizedIsbn = normalizeISBN(data.isbn);
        const isbn10 = normalizedIsbn && normalizedIsbn.length === 10 ? normalizedIsbn : null;
        const isbn13 = normalizedIsbn && normalizedIsbn.length === 13 ? normalizedIsbn : null;

        const outcome = await matchAndPersistEdition(
            {
                title: data.title,
                authorName: data.author_name || "Autor desconocido",
                description: data.description || null,
                coverUrl: data.cover_url || null,
                isbn: isbn10 || (isbn13 ? null : data.isbn || null),
                isbn13,
                language: null,
                publisher: null,
                publishedDate: data.published_date || null,
                pageCount: data.page_count || null,
                isAbridged: false,
                source: "manual",
                sourceId: null,
            },
            { bypassQuality: true },
        );

        let bookId: string | null;
        switch (outcome.kind) {
            case "matched":
            case "created":
            case "duplicate":
                bookId = outcome.bookId;
                break;
            case "queued":
                return { error: "El libro tiene varias coincidencias y necesita revisión manual." };
            case "rejected":
                return { error: `No se pudo importar: ${outcome.reasons.join(", ")}` };
        }

        if (!bookId) {
            return { error: "No se pudo resolver el book_id del libro importado." };
        }

        // genome_data sigue siendo un atributo del book (obra), no de la edición.
        if (data.genome_data && Object.keys(data.genome_data as object).length > 0) {
            const { error: genomeError } = await supabase
                .from("books")
                .update({ genome_data: data.genome_data })
                .eq("id", bookId);
            if (genomeError) {
                console.warn("Could not update genome_data:", genomeError);
            }
        }

        revalidatePath("/app/admin/catalogo");
        return { success: true, bookId };
    } catch (e: unknown) {
        console.error("importBook Exception:", e);
        return { error: e instanceof Error ? e.message : "Unknown error occurred" };
    }
}

function normalizeISBN(value: string) {
    const normalized = value.replace(/[^0-9Xx]/g, "").toUpperCase();
    return normalized.length === 10 || normalized.length === 13 ? normalized : null;
}
