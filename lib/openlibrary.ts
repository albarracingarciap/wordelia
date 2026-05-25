// Cliente Open Library — discovery de obras (work-centric).
// Solo /search.json: devuelve works (no ediciones).
// Filtros aplicados por defecto: language ∈ {spa, cat} y edition_count >= 3.

const OPEN_LIBRARY_BASE = "https://openlibrary.org";
const REQUEST_TIMEOUT_MS = 8000;
const USER_AGENT = "Wordelia/1.0 (+https://wordelia.es; contacto@wordelia.es)";

const DEFAULT_LANGUAGES = ["spa", "cat"] as const;
const DEFAULT_MIN_EDITION_COUNT = 3;

export type OpenLibraryLanguage = (typeof DEFAULT_LANGUAGES)[number];

export interface OpenLibraryWork {
    workKey: string;                    // "/works/OL123W"
    title: string;
    authors: string[];
    authorKeys: string[];               // "/authors/OL123A"
    firstPublicationYear: number | null;
    editionCount: number;
    languages: string[];                // marc codes ("spa", "cat", ...)
    coverId: number | null;
    coverUrl: string | null;
    subjects: string[];
    /** Personas que son SUJETO de la obra (no autoras). Útil para filtrar biografías. */
    subjectPeople: string[];
    isbnExamples: string[];             // first known ISBNs (any edition)
    rawScore: number | null;            // OL's "score" (relevance)
}

export interface SearchOpenLibraryOptions {
    /** ISO/MARC language codes to include. Defaults to ['spa', 'cat']. */
    languages?: readonly OpenLibraryLanguage[] | readonly string[];
    /** Minimum number of known editions for a work to be included. Defaults to 3. */
    minEditionCount?: number;
    /** Page (1-indexed). */
    page?: number;
    /** Page size (OL caps at 100). */
    limit?: number;
    /** Optional author filter (matched against OL's author_name). */
    author?: string;
}

interface OpenLibrarySearchDoc {
    key: string;                        // "/works/OL123W"
    title?: string;
    author_name?: string[];
    author_key?: string[];
    first_publish_year?: number;
    edition_count?: number;
    language?: string[];
    cover_i?: number;
    subject?: string[];
    subject_person?: string[];
    isbn?: string[];
    score?: number;
}

interface OpenLibrarySearchResponse {
    numFound: number;
    docs: OpenLibrarySearchDoc[];
}

/**
 * Resultado de una búsqueda en Open Library.
 *
 * - `works`: lista (puede ser vacía cuando OL respondió pero no había hits).
 * - `ok`: true si la API respondió correctamente, false si hubo timeout o
 *   error de red. Útil para que el llamante distinga "no hay resultados" de
 *   "no pudimos consultar".
 */
export interface OpenLibrarySearchResult {
    works: OpenLibraryWork[];
    ok: boolean;
}

export async function searchOpenLibraryWorks(
    query: string,
    options: SearchOpenLibraryOptions = {},
): Promise<OpenLibrarySearchResult> {
    const trimmed = query.trim();
    const author = options.author?.trim();
    // Se permite búsqueda solo-por-autor (query vacía + author).
    if (!trimmed && !author) return { works: [], ok: true };

    const languages = options.languages ?? DEFAULT_LANGUAGES;
    const minEditionCount = options.minEditionCount ?? DEFAULT_MIN_EDITION_COUNT;
    const limit = Math.min(options.limit ?? 30, 100);
    const page = options.page ?? 1;

    const params = new URLSearchParams({
        limit: String(limit),
        page: String(page),
        // Pedimos solo los campos que necesitamos para reducir el payload.
        fields: [
            "key",
            "title",
            "author_name",
            "author_key",
            "first_publish_year",
            "edition_count",
            "language",
            "cover_i",
            "subject",
            "subject_person",
            "isbn",
            "score",
        ].join(","),
    });

    if (trimmed) params.set("q", trimmed);
    if (author) params.set("author", author);
    // NO pasamos `language` al servidor de OL: los metadatos de idioma a nivel
    // de obra suelen estar incompletos y server-side filtra demasiado (clásicos
    // franceses sin "spa" aunque existan ediciones en español). Filtramos en
    // cliente con tolerancia a metadatos vacíos.

    const url = `${OPEN_LIBRARY_BASE}/search.json?${params.toString()}`;

    const data = await fetchOpenLibraryJson<OpenLibrarySearchResponse>(url);
    if (data === null) {
        // Error de red / timeout. Distinguimos del caso "OL respondió con 0 docs".
        return { works: [], ok: false };
    }
    if (!data.docs) {
        return { works: [], ok: true };
    }

    const allowedLanguages = new Set(languages);
    const passing = data.docs
        .filter((doc) => isWorkRelevant(doc, allowedLanguages, minEditionCount))
        .map(mapDoc);

    return { works: passing, ok: true };
}

function isWorkRelevant(
    doc: OpenLibrarySearchDoc,
    _allowedLanguages: Set<string>,
    minEditionCount: number,
): boolean {
    if (!doc.key || !doc.title) return false;
    if ((doc.edition_count ?? 0) < minEditionCount) return false;
    // No filtramos por idioma a nivel de obra: los metadatos de `language`
    // en OL son irregulares (obras famosas como "Cien años de soledad" a veces
    // no traen "spa" en el array a pesar de tener decenas de ediciones en
    // español). La decisión de idioma se toma a nivel de edición concreta
    // cuando el usuario añade el libro a su biblioteca.
    return true;
}

function mapDoc(doc: OpenLibrarySearchDoc): OpenLibraryWork {
    const coverId = doc.cover_i ?? null;
    return {
        workKey: doc.key,
        title: doc.title ?? "",
        authors: doc.author_name ?? [],
        authorKeys: doc.author_key ?? [],
        firstPublicationYear: doc.first_publish_year ?? null,
        editionCount: doc.edition_count ?? 0,
        languages: doc.language ?? [],
        coverId,
        coverUrl: coverId ? coverUrlFromId(coverId, "L") : null,
        subjects: doc.subject ?? [],
        subjectPeople: doc.subject_person ?? [],
        isbnExamples: doc.isbn ?? [],
        rawScore: doc.score ?? null,
    };
}

export function coverUrlFromId(coverId: number, size: "S" | "M" | "L" = "L"): string {
    return `https://covers.openlibrary.org/b/id/${coverId}-${size}.jpg`;
}

async function fetchOpenLibraryJson<T>(url: string): Promise<T | null> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
        const response = await fetch(url, {
            signal: controller.signal,
            cache: "no-store",
            headers: {
                Accept: "application/json",
                "User-Agent": USER_AGENT,
            },
        });

        if (!response.ok) {
            console.warn(`[OpenLibrary] HTTP ${response.status} for ${url}`);
            return null;
        }

        return (await response.json()) as T;
    } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
            console.warn(`[OpenLibrary] Request timed out: ${url}`);
        } else {
            console.warn("[OpenLibrary] Request failed:", error);
        }
        return null;
    } finally {
        clearTimeout(timeout);
    }
}
