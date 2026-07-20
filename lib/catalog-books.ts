import { createClient } from "@/utils/supabase/server";

export type CatalogBook = {
    id: string;
    title: string;
    author: string | null;
    genre: string | null;
    firstPublicationYear: number | null;
    coverUrl: string | null;
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

    const { data: books, error: booksError } = await supabase
        .from("books")
        .select("id, title, author, genre, first_publication_year, preferred_edition_id")
        .in("id", bookIds)
        .order("title", { ascending: true });

    if (booksError) {
        console.error("[Catálogo] Error leyendo books:", booksError.message);
        return [];
    }

    const editionIds = (books ?? [])
        .map((b) => b.preferred_edition_id)
        .filter((id): id is string => Boolean(id));

    const { data: editions } = editionIds.length
        ? await supabase.from("editions").select("id, cover_url").in("id", editionIds)
        : { data: [] as { id: string; cover_url: string | null }[] };

    const coverByEdition = new Map(
        (editions ?? []).map((e) => [e.id, e.cover_url as string | null]),
    );

    return (books ?? []).map((b) => ({
        id: b.id,
        title: b.title,
        author: b.author,
        genre: b.genre,
        firstPublicationYear: b.first_publication_year,
        coverUrl: b.preferred_edition_id ? coverByEdition.get(b.preferred_edition_id) ?? null : null,
    }));
}
