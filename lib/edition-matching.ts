// EditionMatchingService (Fase 3).
// Dada una edición entrante (de ISBNdb, Open Library o manual), decide a qué
// `book` (obra) pertenece y persiste el resultado en `editions`.
//
// Orquestación:
//   1. Calidad: filtros duros. Si fallan → rejected.
//   2. Idempotencia: si ya existe la edición por ISBN, devuelve duplicate.
//   3. Resuelve / crea el autor.
//   4. Llama al RPC `find_book_candidates_for_edition`:
//        · 1 candidato exacto/fuzzy → matched
//        · >1 candidatos            → queued (edition.book_id = null,
//                                     fila en edition_review_queue)
//        · 0 candidatos             → created (book nuevo)
//   5. Inserta la edición con su quality_score.
//   6. Actualiza books.preferred_edition_id si la nueva edición lo mejora.
//
// La capa de búsqueda (lib/book-search.ts) NO invoca este servicio: solo se
// dispara desde flujos donde el usuario añade un libro / edición concreta.

import { createAdminClient, hasSupabaseAdminConfig } from "@/utils/supabase/admin";
import {
    EditionQualityInput,
    QualityContext,
    evaluateEditionQuality,
} from "@/lib/edition-quality";
import type { Json } from "@/types/supabase";

export interface EditionInput {
    title: string;
    authorName: string;
    description: string | null;
    coverUrl: string | null;
    isbn: string | null;
    isbn13: string | null;
    language: string | null;
    publisher: string | null;
    publishedDate: string | null;   // ISO o yyyy-mm-dd
    pageCount: number | null;
    isAbridged: boolean;
    source: "isbndb" | "openlibrary" | "manual";
    sourceId: string | null;
    rawPayload?: unknown;
    /** Año de primera publicación de la obra, si lo conocemos (para scoring). */
    firstPublicationYear?: number | null;
}

export type MatchOutcome =
    | { kind: "matched"; bookId: string; editionId: string; method: "exact" | "fuzzy"; qualityScore: number }
    | { kind: "created"; bookId: string; editionId: string; qualityScore: number }
    | { kind: "queued"; bookId: string; editionId: string; candidateBookIds: string[]; qualityScore: number }
    | { kind: "duplicate"; bookId: string | null; editionId: string }
    | { kind: "rejected"; reasons: string[] };

interface CandidateRow {
    book_id: string;
    title: string;
    title_normalized: string | null;
    author_id: string | null;
    author?: string | null;
    similarity: number;
    is_exact: boolean;
}

const SIMILARITY_THRESHOLD = 0.6;
const MAX_CANDIDATES = 5;

export interface MatchContext extends QualityContext {
    /**
     * Si true, se omiten los filtros duros de calidad (cover, idioma, abreviada).
     * Útil cuando el usuario añade explícitamente un libro: respetamos su decisión
     * aunque la edición no pasaría los filtros de descubrimiento automático.
     * El quality_score sigue calculándose para ordenar `preferred_edition_id`.
     */
    bypassQuality?: boolean;
}

export async function matchAndPersistEdition(
    input: EditionInput,
    context: MatchContext = {},
): Promise<MatchOutcome> {
    if (!hasSupabaseAdminConfig()) {
        return { kind: "rejected", reasons: ["supabase_admin_not_configured"] };
    }

    const supabase = createAdminClient();

    // 0. Idempotencia.
    const existing = await findExistingEdition(supabase, input);
    if (existing) {
        return { kind: "duplicate", bookId: existing.book_id, editionId: existing.id };
    }

    // 1. Calidad (calculamos siempre el score, pero solo rechazamos en modo strict).
    const qualityInput: EditionQualityInput = {
        title: input.title,
        coverUrl: input.coverUrl,
        language: input.language,
        publisher: input.publisher,
        publishedDate: input.publishedDate,
        pageCount: input.pageCount,
        isAbridged: input.isAbridged,
        description: input.description,
        isbn: input.isbn,
        isbn13: input.isbn13,
    };
    const quality = evaluateEditionQuality(qualityInput, {
        ...context,
        firstPublicationYear: context.firstPublicationYear ?? input.firstPublicationYear ?? null,
    });

    if (!quality.accepted && !context.bypassQuality) {
        return { kind: "rejected", reasons: quality.reasons };
    }

    // 2. Autor.
    const authorId = await resolveAuthor(supabase, input.authorName);
    if (!authorId) {
        return { kind: "rejected", reasons: ["could_not_resolve_author"] };
    }

    // 3. Candidatos.
    const candidates = await findCandidates(supabase, input.title, authorId, input.authorName);

    // 4. Decisión + persistencia.
    if (candidates.length === 1) {
        const candidate = candidates[0];
        await ensureBookAuthor(supabase, candidate, authorId, input.authorName);
        const editionId = await insertEdition(supabase, input, candidate.book_id, quality.score);
        if (!editionId) return { kind: "rejected", reasons: ["could_not_insert_edition"] };
        await maybePromotePreferredEdition(supabase, candidate.book_id);
        return {
            kind: "matched",
            bookId: candidate.book_id,
            editionId,
            method: candidate.is_exact ? "exact" : "fuzzy",
            qualityScore: quality.score,
        };
    }

    if (candidates.length > 1) {
        // Múltiples candidatos: asignación provisional al primero. La fila
        // queda registrada en `edition_review_queue` para que un editor
        // confirme o reasigne. La BD exige `editions.book_id` NOT NULL, así
        // que no podemos dejarlo a null.
        const tentativeBookId = candidates[0].book_id;
        await ensureBookAuthor(supabase, candidates[0], authorId, input.authorName);
        const editionId = await insertEdition(supabase, input, tentativeBookId, quality.score);
        if (!editionId) return { kind: "rejected", reasons: ["could_not_insert_edition"] };
        await enqueueForReview(supabase, editionId, candidates);
        return {
            kind: "queued",
            bookId: tentativeBookId,
            editionId,
            candidateBookIds: candidates.map((c) => c.book_id),
            qualityScore: quality.score,
        };
    }

    // 0 candidatos → crear book nuevo (calidad ya garantizada).
    const newBookId = await createBookFromEdition(supabase, input, authorId);
    if (!newBookId) return { kind: "rejected", reasons: ["could_not_create_book"] };

    const editionId = await insertEdition(supabase, input, newBookId, quality.score);
    if (!editionId) return { kind: "rejected", reasons: ["could_not_insert_edition"] };

    await maybePromotePreferredEdition(supabase, newBookId);

    return {
        kind: "created",
        bookId: newBookId,
        editionId,
        qualityScore: quality.score,
    };
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers — todos asumen cliente admin (service role).
// ─────────────────────────────────────────────────────────────────────────────
type AdminClient = ReturnType<typeof createAdminClient>;

async function findExistingEdition(
    supabase: AdminClient,
    input: EditionInput,
): Promise<{ id: string; book_id: string | null } | null> {
    const filters: string[] = [];
    if (input.isbn13) filters.push(`isbn13.eq.${input.isbn13}`);
    if (input.isbn) filters.push(`isbn.eq.${input.isbn}`);
    if (filters.length === 0) return null;

    const { data, error } = await supabase
        .from("editions")
        .select("id, book_id")
        .or(filters.join(","))
        .maybeSingle();

    if (error || !data) return null;
    return data;
}

async function resolveAuthor(supabase: AdminClient, rawName: string): Promise<string | null> {
    const name = rawName.trim();
    if (!name) return null;

    const { data: existing } = await supabase
        .from("authors")
        .select("id")
        .ilike("name", name)
        .limit(1)
        .maybeSingle();

    if (existing?.id) return existing.id;

    const { data: inserted, error: insertError } = await supabase
        .from("authors")
        .insert({ name })
        .select("id")
        .single();

    if (insertError || !inserted?.id) {
        console.warn("[EditionMatching] Could not insert author:", insertError);
        return null;
    }

    return inserted.id;
}

async function findCandidates(
    supabase: AdminClient,
    title: string,
    authorId: string,
    authorName: string,
): Promise<CandidateRow[]> {
    const fallbackCandidates = await findFallbackCandidatesByTitle(supabase, title, authorName);
    if (fallbackCandidates.length > 0) return fallbackCandidates;

    const { data, error } = await supabase.rpc("find_book_candidates_for_edition", {
        p_title: title,
        p_author_id: authorId,
        p_similarity_threshold: SIMILARITY_THRESHOLD,
        p_max_results: MAX_CANDIDATES,
    });

    if (!error && data) {
        const rpcCandidates = data as CandidateRow[];
        if (rpcCandidates.length > 0) return rpcCandidates;
    }

    if (error) {
        if (error.code !== "42883") {
            console.warn("[EditionMatching] Candidate RPC failed:", error);
        }
    }

    return [];
}

async function findFallbackCandidatesByTitle(
    supabase: AdminClient,
    title: string,
    authorName: string,
): Promise<CandidateRow[]> {
    const titleKeys = getTitleMatchKeys(title);
    if (titleKeys.length === 0) return [];

    const { data, error } = await supabase
        .from("books")
        .select("id, title, title_normalized, author_id, author, created_at")
        .in("title_normalized", titleKeys)
        .order("created_at", { ascending: true })
        .limit(MAX_CANDIDATES);

    if (error || !data) {
        if (error) console.warn("[EditionMatching] Fallback title lookup failed:", error);
        return [];
    }

    const normalizedAuthor = normalizeAuthorForMatch(authorName);
    const rows = data as unknown as Array<{
        id: string;
        title: string;
        title_normalized: string | null;
        author_id: string | null;
        author?: string | null;
    }>;

    const authorMatches = rows.filter((row) => {
        if (!row.author) return true;
        return areLikelySameAuthor(row.author, authorName, normalizedAuthor);
    });
    const candidates = authorMatches.length > 0 ? authorMatches : rows.filter((row) => !row.author);

    return candidates.map((row) => ({
        book_id: row.id,
        title: row.title,
        title_normalized: row.title_normalized,
        author_id: row.author_id,
        author: row.author ?? null,
        similarity: 1,
        is_exact: true,
    }));
}

async function ensureBookAuthor(
    supabase: AdminClient,
    candidate: CandidateRow,
    authorId: string,
    authorName: string,
): Promise<void> {
    if (candidate.author_id && candidate.author) return;

    const updatePayload = {
        ...(candidate.author_id ? {} : { author_id: authorId }),
        ...(candidate.author ? {} : { author: authorName }),
    };

    if (Object.keys(updatePayload).length === 0) return;

    const { error } = await supabase
        .from("books")
        .update(updatePayload as never)
        .eq("id", candidate.book_id);

    if (error) {
        console.warn("[EditionMatching] Could not complete book author fields:", error);
    }
}

async function createBookFromEdition(
    supabase: AdminClient,
    input: EditionInput,
    authorId: string,
): Promise<string | null> {
    const externalIds: Record<string, string> = {};
    if (input.source === "openlibrary" && input.sourceId) externalIds.openlibrary = input.sourceId;
    if (input.source === "isbndb" && input.sourceId) externalIds.isbndb = input.sourceId;

    const { data, error } = await supabase
        .from("books")
        .insert({
            title: canonicalWorkTitle(input.title),
            author_id: authorId,
            author: input.authorName,
            description: input.description,
            original_language: input.language,
            first_publication_year: input.firstPublicationYear ?? extractYear(input.publishedDate),
            external_ids: externalIds,
            // title_normalized lo rellena el trigger BEFORE INSERT.
        } as never)
        .select("id")
        .single();

    if (error || !data?.id) {
        console.warn("[EditionMatching] Could not create book:", error);
        return null;
    }

    return data.id;
}

async function insertEdition(
    supabase: AdminClient,
    input: EditionInput,
    bookId: string,
    qualityScore: number,
): Promise<string | null> {
    const externalIds: Record<string, string> = {};
    if (input.source === "openlibrary" && input.sourceId) externalIds.openlibrary = input.sourceId;
    if (input.source === "isbndb" && input.sourceId) externalIds.isbndb = input.sourceId;

    const { data, error } = await supabase
        .from("editions")
        .insert({
            book_id: bookId,
            title: input.title,
            isbn: input.isbn,
            isbn13: input.isbn13,
            cover_url: input.coverUrl,
            page_count: input.pageCount,
            published_date: toIsoDate(input.publishedDate),
            publication_year: extractYear(input.publishedDate),
            // La columna `language` está NOT NULL en BD. Usamos código MARC "und"
            // (undetermined) como fallback cuando el input no especifica.
            language: input.language ?? "und",
            publisher: input.publisher,
            is_abridged: input.isAbridged,
            source: input.source,
            source_id: input.sourceId,
            external_ids: externalIds,
            quality_score: qualityScore,
            raw_payload: (input.rawPayload as Json | null) ?? null,
        })
        .select("id")
        .single();

    if (error || !data?.id) {
        console.warn("[EditionMatching] Could not insert edition:", error);
        return null;
    }

    return data.id;
}

async function enqueueForReview(
    supabase: AdminClient,
    editionId: string,
    candidates: CandidateRow[],
): Promise<void> {
    const { error } = await supabase.from("edition_review_queue").insert({
        edition_id: editionId,
        candidates: candidates.map((c) => ({
            book_id: c.book_id,
            title: c.title,
            similarity: c.similarity,
            is_exact: c.is_exact,
        })),
        reason: "multiple_candidates",
        status: "pending",
    });

    if (error) {
        console.warn("[EditionMatching] Could not enqueue for review:", error);
    }
}

async function maybePromotePreferredEdition(
    supabase: AdminClient,
    bookId: string,
): Promise<void> {
    const { data: best } = await supabase
        .from("editions")
        .select("id, quality_score")
        .eq("book_id", bookId)
        .order("quality_score", { ascending: false, nullsFirst: false })
        .limit(1)
        .maybeSingle();

    if (!best?.id) return;

    const { error } = await supabase
        .from("books")
        .update({ preferred_edition_id: best.id })
        .eq("id", bookId);

    if (error) {
        console.warn("[EditionMatching] Could not promote preferred edition:", error);
    }
}

function toIsoDate(value: string | null): string | null {
    if (!value) return null;
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) {
        const year = extractYear(value);
        return year ? `${year}-01-01` : null;
    }
    return d.toISOString().slice(0, 10);
}

function extractYear(value: string | null): number | null {
    if (!value) return null;
    const match = value.match(/\b(1[5-9]\d{2}|20\d{2})\b/);
    return match ? Number(match[1]) : null;
}

function canonicalWorkTitle(title: string): string {
    return title
        .replace(/\s+\/\s+.*$/, "")
        .replace(/\s*\|\s*.*$/, "")
        .trim() || title.trim();
}

function getTitleMatchKeys(title: string): string[] {
    return Array.from(new Set([
        normalizeTitleForMatch(title),
        normalizeTitleForMatch(canonicalWorkTitle(title)),
    ].filter(Boolean)));
}

function normalizeTitleForMatch(title: string): string {
    return title
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/\s+\/\s+.*$/, "")
        .replace(/\s*\|\s*.*$/, "")
        .replace(/\s*[:\-–—].*$/, "")
        .replace(/\s*[\(\[]\s*(tomo|libro|vol(?:umen)?\.?|parte|ed(?:icion)?\.?|edition|ilustrad[ao])\b[^\)\]]*[\)\]]/gi, "")
        .replace(/\s+/g, " ")
        .trim();
}

function normalizeAuthorForMatch(author: string): string {
    return author
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/\b(fyodor|feodor)\b/g, "fiodor")
        .replace(/\b(fedor)\b/g, "fiodor")
        .replace(/\b([a-z])\.\s*/g, "")
        .replace(/\b(y|i)\b/g, "")
        .replace(/[^a-z\s]/g, " ")
        .replace(/y/g, "i")
        .replace(/\s+/g, " ")
        .trim();
}

function areLikelySameAuthor(existingAuthor: string, incomingAuthor: string, normalizedIncoming?: string): boolean {
    const existing = normalizeAuthorForMatch(existingAuthor);
    const incoming = normalizedIncoming ?? normalizeAuthorForMatch(incomingAuthor);
    if (!existing || !incoming) return false;
    if (existing === incoming) return true;

    const existingParts = existing.split(" ").filter(Boolean);
    const incomingParts = incoming.split(" ").filter(Boolean);
    const existingLast = existingParts.at(-1) || "";
    const incomingLast = incomingParts.at(-1) || "";
    const existingFirst = existingParts[0] || "";
    const incomingFirst = incomingParts[0] || "";

    if (existingLast && incomingLast && existingFirst && incomingFirst) {
        const firstCompatible = existingFirst === incomingFirst || stringSimilarity(existingFirst, incomingFirst) >= 0.8;
        const lastCompatible = existingLast === incomingLast || stringSimilarity(existingLast, incomingLast) >= 0.82;
        if (firstCompatible && lastCompatible) return true;
    }

    return stringSimilarity(existing, incoming) >= 0.86;
}

function stringSimilarity(a: string, b: string): number {
    if (a === b) return 1;
    if (!a || !b) return 0;

    const distance = levenshteinDistance(a, b);
    return 1 - distance / Math.max(a.length, b.length);
}

function levenshteinDistance(a: string, b: string): number {
    const previous = Array.from({ length: b.length + 1 }, (_, index) => index);
    const current = Array.from({ length: b.length + 1 }, () => 0);

    for (let i = 1; i <= a.length; i++) {
        current[0] = i;
        for (let j = 1; j <= b.length; j++) {
            const cost = a[i - 1] === b[j - 1] ? 0 : 1;
            current[j] = Math.min(
                current[j - 1] + 1,
                previous[j] + 1,
                previous[j - 1] + cost,
            );
        }
        for (let j = 0; j <= b.length; j++) {
            previous[j] = current[j];
        }
    }

    return previous[b.length];
}
