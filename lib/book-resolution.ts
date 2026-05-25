// Capa de resolución book ⇄ resultado de búsqueda.
// Convierte un BookSearchResult (de la cascada de búsqueda) en un `book_id` y
// `edition_id` persistidos en BD. Delega en EditionMatchingService.
//
// Se usa desde:
// - app/app/search/actions.ts        (mi-lectura/nuevo)
// - app/app/clubs/crear/actions.ts   (creación de club con libro)
// - app/app/admin/catalogo/actions.ts (importación manual de catálogo)

import { matchAndPersistEdition, type EditionInput, type MatchOutcome } from "@/lib/edition-matching";
import { BookSearchResult } from "@/lib/isbndb";
import { createClient as createServerSupabaseClient } from "@/utils/supabase/server";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface ResolvedBook {
    bookId: string;
    editionId: string | null;
}

/**
 * Resuelve un BookSearchResult a sus IDs en BD.
 * - UUID local existente → reusa.
 * - Cualquier otra fuente → matchAndPersistEdition con bypassQuality:true
 *   (es un alta explícita del usuario, no descubrimiento automático).
 *
 * Lanza si el outcome es `queued` (necesita revisión humana) o `rejected`.
 */
export async function resolveBookFromResult(book: BookSearchResult): Promise<ResolvedBook> {
    if (UUID_RE.test(book.id)) {
        const supabase = await createServerSupabaseClient();
        const { data } = await supabase
            .from("books")
            .select("id, preferred_edition_id")
            .eq("id", book.id)
            .maybeSingle();
        if (data?.id) {
            return { bookId: data.id, editionId: data.preferred_edition_id ?? null };
        }
    }

    const outcome = await matchAndPersistEdition(toEditionInput(book), { bypassQuality: true });
    return outcomeToIds(outcome);
}

export function toEditionInput(book: BookSearchResult): EditionInput {
    const source: EditionInput["source"] =
        book.source === "openlibrary" ? "openlibrary" :
        book.source === "isbndb" ? "isbndb" :
        "manual";

    let sourceId: string | null = null;
    if (source === "openlibrary" && book.id.startsWith("ol:")) {
        sourceId = book.id.slice(3);
    } else if (source === "isbndb") {
        sourceId = book.isbn13 || book.isbn;
    }

    return {
        title: book.title,
        authorName: book.authors[0] || "Autor desconocido",
        description: book.description,
        coverUrl: book.cover_url,
        isbn: book.isbn,
        isbn13: book.isbn13,
        language: book.language,
        publisher: book.publisher,
        publishedDate: book.published_date,
        pageCount: book.page_count,
        isAbridged: false,
        source,
        sourceId,
    };
}

function outcomeToIds(outcome: MatchOutcome): ResolvedBook {
    switch (outcome.kind) {
        case "matched":
        case "created":
            return { bookId: outcome.bookId, editionId: outcome.editionId };
        case "duplicate":
            if (!outcome.bookId) {
                throw new Error("Edición duplicada sin obra asignada; necesita revisión manual.");
            }
            return { bookId: outcome.bookId, editionId: outcome.editionId };
        case "queued":
            throw new Error("Este libro tiene varias coincidencias y un editor lo revisará pronto.");
        case "rejected":
            throw new Error(`No se pudo guardar el libro: ${outcome.reasons.join(", ")}`);
    }
}
