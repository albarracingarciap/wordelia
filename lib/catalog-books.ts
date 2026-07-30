import { createClient } from "@/utils/supabase/server";
import { selectInChunks } from "@/lib/supabase-chunks";

export type CatalogBook = {
    id: string;
    title: string;
    author: string | null;
    genre: string | null;
    firstPublicationYear: number | null;
    coverUrl: string | null;
};

type CatalogBookRow = {
    id: string;
    title: string;
    author: string | null;
    genre: string | null;
    first_publication_year: number | null;
    preferred_edition_id: string | null;
};

/**
 * Libros del catálogo público para /guias y /genomas: los que tienen un recurso
 * en `sourceTable` (guía o genoma), con su portada tomada de la edición
 * preferida. Ordenados por título.
 */
export async function getCatalogBooks(
    sourceTable: "book_guides" | "book_literary_chromosomes",
): Promise<CatalogBook[]> {
    const supabase = await createClient();

    const { data: rows, error } = await supabase.from(sourceTable).select("book_id");
    if (error) {
        console.error(`[Catálogo] Error leyendo ${sourceTable}:`, error.message);
        return [];
    }

    // book_literary_chromosomes tiene una fila por cromosoma (8 por libro): dedup.
    const bookIds = Array.from(
        new Set((rows ?? []).map((r) => (r as { book_id: string }).book_id).filter(Boolean)),
    );
    if (bookIds.length === 0) return [];

    // Troceado: bookIds puede ser todo el catálogo con recurso → .in() en una sola
    // URL daría 414. El orden por título se aplica en JS tras unir los lotes.
    const { data: books, error: booksError } = await selectInChunks<CatalogBookRow>(
        bookIds,
        (chunk) => supabase
            .from("books")
            .select("id, title, author, genre, first_publication_year, preferred_edition_id")
            .in("id", chunk),
    );

    if (booksError) {
        console.error("[Catálogo] Error leyendo books:", (booksError as { message?: string }).message);
        return [];
    }

    const bookRows = books ?? [];
    const editionIds = bookRows
        .map((b) => b.preferred_edition_id)
        .filter((id): id is string => Boolean(id));

    const { data: editions } = await selectInChunks<{ id: string; cover_url: string | null }>(
        editionIds,
        (chunk) => supabase.from("editions").select("id, cover_url").in("id", chunk),
    );

    const coverByEdition = new Map(
        (editions ?? []).map((e) => [e.id, e.cover_url]),
    );

    return bookRows
        .map((b) => ({
            id: b.id,
            title: b.title,
            author: b.author,
            genre: b.genre,
            firstPublicationYear: b.first_publication_year,
            coverUrl: b.preferred_edition_id ? coverByEdition.get(b.preferred_edition_id) ?? null : null,
        }))
        .sort((a, b) => a.title.localeCompare(b.title, "es"));
}
