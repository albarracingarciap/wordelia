// Cliente ISBNdb — wrapper puro de la API.
// Se usa como fallback de discovery cuando Open Library no devuelve resultados,
// y como fuente de detalle cuando el usuario añade una edición por ISBN concreto.
// La persistencia en `books` / `editions` la decide EditionMatchingService (Fase 3).

export interface BookSearchResult {
    id: string;
    title: string;
    authors: string[];
    cover_url: string | null;
    description: string | null;
    isbn: string | null;
    isbn13: string | null;
    page_count: number | null;
    published_date: string | null;
    publisher: string | null;
    categories: string[];
    genre?: string | null;
    experience?: string | null;
    average_rating: number | null;
    ratings_count: number | null;
    language: string | null;
    price: number | null;
    /**
     * Origen del resultado. "db" = caché local, "openlibrary" = OL,
     * "isbndb" = fallback API, "google" se mantiene en la unión por
     * compatibilidad con código legado pero ya no se emite.
     */
    source: "isbndb" | "openlibrary" | "db" | "google";
}

const ISBNDB_API_URL = "https://api2.isbndb.com";
const EXTERNAL_API_TIMEOUT_MS = 3000;

interface ISBNdbBook {
    title: string;
    authors?: string[];
    image?: string;
    isbn13?: string;
    isbn10?: string;
    publisher?: string;
    date_published?: string;
    pages?: number;
    synopsis?: string;
    subjects?: string[];
    language?: string;
    msrp?: number | string;
}

interface ISBNdbSearchResponse {
    total: number;
    books?: ISBNdbBook[];
    data?: ISBNdbBook[];
}

interface ISBNdbBookResponse {
    book: ISBNdbBook;
}

export async function searchISBNdb(
    query: string,
    page: number = 1,
    pageSize: number = 20,
): Promise<BookSearchResult[]> {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) return [];

    const normalizedIsbn = normalizeISBN(trimmedQuery);
    if (normalizedIsbn) {
        const book = await getBookByISBN(normalizedIsbn);
        return book ? [book] : [];
    }

    const apiKey = process.env.ISBNDB_API_KEY;
    if (!apiKey) {
        console.error("ISBNDB_API_KEY is missing");
        return [];
    }

    try {
        const url = `${ISBNDB_API_URL}/books/${encodeURIComponent(trimmedQuery)}?page=${page}&pageSize=${pageSize}`;
        const data = await fetchISBNdbJson<ISBNdbSearchResponse>(url, apiKey);
        if (!data.books) return [];
        return data.books.map(mapISBNdbBook);
    } catch (error) {
        console.error("Error fetching from ISBNdb:", error);
        return [];
    }
}

/**
 * Búsqueda estructurada: prioriza español; cae a búsqueda sin filtros si no hay
 * suficientes resultados. Usado solo como fallback de discovery (OL vacío) o
 * cuando el usuario lo invoca explícitamente.
 */
export async function searchISBNdbStructured(
    query: string,
    pageSize: number = 20,
): Promise<BookSearchResult[]> {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) return [];

    const normalizedIsbn = normalizeISBN(trimmedQuery);
    if (normalizedIsbn) {
        const book = await getBookByISBN(normalizedIsbn);
        return book ? [book] : [];
    }

    const spanishResults = await searchISBNdbByColumns(trimmedQuery, pageSize, {
        language: "spa",
        shouldMatchAll: true,
    });

    if (spanishResults.length >= 5) {
        return spanishResults;
    }

    const broaderResults = await searchISBNdbByColumns(trimmedQuery, pageSize, {
        shouldMatchAll: true,
    });

    return mergeBooks(spanishResults, broaderResults);
}

async function searchISBNdbByColumns(
    query: string,
    pageSize: number,
    options: { language?: string; publishedFrom?: string; shouldMatchAll?: boolean },
) {
    const [titleResults, authorResults] = await Promise.all([
        searchISBNdbBooksEndpoint(query, "title", pageSize, options),
        searchISBNdbBooksEndpoint(query, "author", pageSize, options),
    ]);

    return mergeBooks(titleResults, authorResults);
}

async function searchISBNdbBooksEndpoint(
    query: string,
    column: "title" | "author",
    pageSize: number,
    options: { language?: string; publishedFrom?: string; shouldMatchAll?: boolean },
): Promise<BookSearchResult[]> {
    const apiKey = process.env.ISBNDB_API_KEY;
    if (!apiKey) {
        console.error("ISBNDB_API_KEY is missing");
        return [];
    }

    try {
        const params = new URLSearchParams({
            page: "1",
            pageSize: String(pageSize),
            column,
        });

        if (options.language) params.set("language", options.language);
        if (options.publishedFrom) params.set("publishedFrom", options.publishedFrom);
        if (options.shouldMatchAll) params.set("shouldMatchAll", "true");

        const url = `${ISBNDB_API_URL}/books/${encodeURIComponent(query)}?${params.toString()}`;
        const data = await fetchISBNdbJson<ISBNdbSearchResponse>(url, apiKey);
        const books = data.books || data.data || [];
        return books.map(mapISBNdbBook);
    } catch (error) {
        console.warn(`[ISBNdb] Structured ${column} search failed:`, error);
        return [];
    }
}

/**
 * Detalle de un ISBN concreto. Wrapper puro: no toca la BD.
 * EditionMatchingService (Fase 3) es quien decide si insertar la edición
 * en `editions` y a qué `book` (obra) asignarla.
 */
export async function getBookByISBN(isbn: string): Promise<BookSearchResult | null> {
    const normalizedIsbn = normalizeISBN(isbn);
    if (!normalizedIsbn) return null;

    const apiKey = process.env.ISBNDB_API_KEY;
    if (!apiKey) return null;

    try {
        const url = `${ISBNDB_API_URL}/book/${normalizedIsbn}`;
        const data = await fetchISBNdbJson<ISBNdbBookResponse>(url, apiKey);
        return mapISBNdbBook(data.book);
    } catch (error) {
        if (error instanceof Error && (error.message.includes("400") || error.message.includes("404"))) {
            return null;
        }
        console.error(`Error fetching ISBN ${normalizedIsbn} from ISBNdb:`, error);
        return null;
    }
}

async function fetchISBNdbJson<T>(url: string, apiKey: string): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), EXTERNAL_API_TIMEOUT_MS);

    try {
        const response = await fetch(url, {
            signal: controller.signal,
            cache: "no-store",
            headers: { Authorization: apiKey },
        });

        if (!response.ok) {
            throw new Error(`ISBNdb API error: ${response.status} ${response.statusText}`);
        }

        return (await response.json()) as T;
    } finally {
        clearTimeout(timeoutId);
    }
}

function mapISBNdbBook(item: ISBNdbBook): BookSearchResult {
    let rawSynopsis = item.synopsis;
    if (rawSynopsis) {
        if (rawSynopsis.toLowerCase().trim() === "nan") {
            rawSynopsis = undefined;
        } else {
            rawSynopsis = rawSynopsis.replace(/<[^>]*>?/gm, " ").replace(/\s+/g, " ").trim();
        }
    }

    return {
        id: item.isbn13 || item.isbn10 || "",
        title: item.title,
        authors: item.authors || [],
        cover_url: item.image || null,
        description: rawSynopsis || null,
        isbn: item.isbn13 || item.isbn10 || null,
        isbn13: item.isbn13 || null,
        page_count: item.pages || null,
        published_date: parseExternalDate(item.date_published),
        publisher: item.publisher || null,
        categories: item.subjects ?? [],
        genre: null,
        experience: null,
        average_rating: null,
        ratings_count: null,
        language: item.language || null,
        price: item.msrp ? (typeof item.msrp === "string" ? parseFloat(item.msrp) : item.msrp) : null,
        source: "isbndb",
    };
}

function mergeBooks(primary: BookSearchResult[], secondary: BookSearchResult[]) {
    const merged = new Map<string, BookSearchResult>();
    for (const book of [...primary, ...secondary]) {
        const key = book.isbn13 || book.isbn || `${book.title}-${book.authors[0] || ""}`;
        if (!merged.has(key)) merged.set(key, book);
    }
    return Array.from(merged.values());
}

function parseExternalDate(value?: string) {
    if (!value) return null;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        const yearMatch = value.match(/\b(1[5-9]\d{2}|20\d{2})\b/);
        return yearMatch ? `${yearMatch[1]}-01-01T00:00:00.000Z` : null;
    }
    return date.toISOString();
}

function normalizeISBN(value: string) {
    const normalized = value.replace(/[^0-9Xx]/g, "").toUpperCase();
    return normalized.length === 10 || normalized.length === 13 ? normalized : null;
}
