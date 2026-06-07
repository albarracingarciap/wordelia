// Resolves a search result into persisted `books` and `editions` ids.
// Used by user-facing flows that add a concrete edition to a library.

import { matchAndPersistEdition, type EditionInput, type MatchOutcome } from "@/lib/edition-matching";
import { BookSearchResult } from "@/lib/isbndb";
import { createClient as createServerSupabaseClient } from "@/utils/supabase/server";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface ResolvedBook {
    bookId: string;
    editionId: string | null;
}

/**
 * Resolves a BookSearchResult to database ids.
 * - Existing local UUID: reuse the book and its preferred edition.
 * - External/manual result: persist or match the concrete edition.
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
        case "queued":
            return { bookId: outcome.bookId, editionId: outcome.editionId };
        case "duplicate":
            if (!outcome.bookId) {
                throw new Error("Edicion duplicada sin obra asignada; necesita revision manual.");
            }
            return { bookId: outcome.bookId, editionId: outcome.editionId };
        case "rejected":
            throw new Error(`No se pudo guardar el libro: ${outcome.reasons.join(", ")}`);
    }
}
