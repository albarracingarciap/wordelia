// Motor de búsqueda de obras (work-centric).
// Cascada de tres fases:
//   1. Caché local: `books` consultada por trigram (`title_normalized`).
//      Si devuelve >= LOCAL_RESULT_TARGET → no se llaman APIs externas.
//   2. Open Library /search.json (filtrado por lang ∈ {spa,cat}, edition_count ≥ 3).
//   3. ISBNdb como fallback final solo si OL no devuelve nada.
//
// Esta capa NO persiste resultados externos. La inserción en `editions` y la
// resolución de qué `book` corresponde es responsabilidad de
// EditionMatchingService (Fase 3), invocado al añadir una edición concreta.

import { BookSearchResult, searchISBNdbStructured } from "@/lib/isbndb";
import { OpenLibraryWork, searchOpenLibraryWorks } from "@/lib/openlibrary";
import { createClient as createServerSupabaseClient } from "@/utils/supabase/server";

type SearchBooksOptions = {
    query?: string;
    experienceLabel?: string;
    experienceTerms?: string[];
    limit?: number;
    languages?: readonly string[];
};

const LOCAL_RESULT_TARGET = 5;
const DEFAULT_LIMIT = 20;
const DEFAULT_LANGUAGES = ["spa", "cat"] as const;

// Subset de columnas que necesitamos de `books` + `authors` + edición preferida.
// `experience` y `genre` siguen viviendo en books (no se migraron).
const BOOK_SELECT_FIELDS = `
    id,
    title,
    title_normalized,
    description,
    first_publication_year,
    original_language,
    external_ids,
    experience,
    genre,
    authors:author_id ( id, name ),
    preferred_edition:editions!books_preferred_edition_fk (
        id, isbn, isbn13, cover_url, page_count, published_date,
        publication_year, language, publisher, format
    )
`;

type LocalBookRow = {
    id: string;
    title: string;
    title_normalized: string | null;
    description: string | null;
    first_publication_year: number | null;
    original_language: string | null;
    external_ids: Record<string, unknown> | null;
    experience: string | null;
    genre: string | null;
    authors: { id: string; name: string | null } | null;
    preferred_edition: {
        id: string;
        isbn: string | null;
        isbn13: string | null;
        cover_url: string | null;
        page_count: number | null;
        published_date: string | null;
        publication_year: number | null;
        language: string | null;
        publisher: string | null;
        format: string | null;
    } | null;
};

export async function searchBooks(options: SearchBooksOptions): Promise<BookSearchResult[]> {
    const { query, experienceLabel, experienceTerms, limit = DEFAULT_LIMIT, languages = DEFAULT_LANGUAGES } = options;
    const trimmedQuery = query?.trim() ?? "";

    // Atajo: búsqueda directa por ISBN.
    const normalizedIsbn = trimmedQuery ? normalizeISBN(trimmedQuery) : null;
    if (normalizedIsbn) {
        return searchByIsbn(normalizedIsbn);
    }

    if (experienceLabel) {
        return searchByExperience(experienceLabel, experienceTerms ?? [], limit);
    }

    if (!trimmedQuery || trimmedQuery.length < 2) return [];

    // 1. Caché local.
    const localResults = await searchLocalCache(trimmedQuery, Math.max(limit, LOCAL_RESULT_TARGET));
    if (localResults.length >= LOCAL_RESULT_TARGET) {
        return localResults.slice(0, limit);
    }

    // 2. Open Library. Si la query parece persona, usamos `?author=`. Si no
    //    devuelve suficientes resultados tras el filtro, la query puede ser
    //    en realidad un título corto sin preposiciones ("Cien años de soledad",
    //    "Pedro Páramo"...). Complementamos con `?q=` aplicando un filtro
    //    minimal (sin asumir que es un autor).
    const personMode = isLikelyPersonQuery(trimmedQuery);
    const olLimit = Math.max(limit, 20);
    const MIN_EXTERNAL_RESULTS = 5;

    // Umbral de ediciones: bajo (3) en ambos modos. El descarte de monografías
    // académicas y biografías se hace en los filtros (academic patterns,
    // subject_person, title-contain). Subir el umbral mató ediciones reales.
    const AUTHOR_MODE_MIN_EDITIONS = 3;
    const TITLE_MODE_MIN_EDITIONS = 3;
    const AUTHOR_CONFIRM_THRESHOLD = 2; // ≥2 hits válidos en ?author= confirma personMode

    // Paso A: si la query parece persona, probar ?author=.
    const olAuthorResponse = personMode
        ? await searchOpenLibraryWorks("", {
            languages,
            author: trimmedQuery,
            limit: olLimit,
            minEditionCount: AUTHOR_MODE_MIN_EDITIONS,
        })
        : { works: [], ok: true };
    const olAuthorFailed = !olAuthorResponse.ok;
    const olAuthorFiltered = olAuthorResponse.works
        .map(mapOpenLibraryWork)
        .filter((book) => isRelevantToQuery(book, trimmedQuery));

    // Paso B: decidir modo efectivo. Si OL falló (timeout/error), respetamos
    // la heurística inicial personMode — no asumimos que es título solo porque
    // OL no respondió. Si OL respondió y olAuthor tiene hits, confirmado.
    const confirmedPersonMode = personMode && (olAuthorFiltered.length >= AUTHOR_CONFIRM_THRESHOLD || olAuthorFailed);

    let externalFiltered: BookSearchResult[];
    if (confirmedPersonMode) {
        // PERSON CONFIRMED: usar solo author results + ISBNdb pasado por filtro
        // estricto (matchesPrimaryAuthor incluido). Esto descarta biografías,
        // libros de citas y estudios críticos sobre el autor.
        externalFiltered = olAuthorFiltered;
        if (externalFiltered.length < MIN_EXTERNAL_RESULTS) {
            const isbndbRaw = await searchISBNdbStructured(trimmedQuery, Math.max(limit, 20));
            const isbndbFiltered = isbndbRaw.filter((book) => isRelevantToQuery(book, trimmedQuery));
            externalFiltered = [...externalFiltered, ...isbndbFiltered];
        }
    } else {
        // TITLE MODE: olAuthor estaba vacío o débil. Probamos ?q= + ISBNdb
        // con filtro título-mode (que descarta about-person, biografías,
        // patrones académicos, y exige que el título contenga la query).
        const olQueryResponse = await searchOpenLibraryWorks(trimmedQuery, {
            languages,
            limit: olLimit,
            minEditionCount: TITLE_MODE_MIN_EDITIONS,
        });
        const olQueryFiltered = olQueryResponse.works
            .map(mapOpenLibraryWork)
            .filter((book) => isRelevantInTitleMode(book, trimmedQuery));

        externalFiltered = [...olAuthorFiltered, ...olQueryFiltered];
        if (externalFiltered.length < MIN_EXTERNAL_RESULTS) {
            const isbndbRaw = await searchISBNdbStructured(trimmedQuery, Math.max(limit, 20));
            const isbndbFiltered = isbndbRaw.filter((book) => isRelevantInTitleMode(book, trimmedQuery));
            externalFiltered = [...externalFiltered, ...isbndbFiltered];
        }
    }

    return collapseTranslations(dedupeByWork([...localResults, ...externalFiltered])).slice(0, limit);
}

// ─────────────────────────────────────────────────────────────────────────────
// Relevance filtering (Fase 3.6)
// ─────────────────────────────────────────────────────────────────────────────

const BIOGRAPHY_SUBJECT_MARKERS = [
    "criticism and interpretation",
    "criticism, interpretation",
    "literary criticism",
    "biography",
    "bio-bibliography",
    "history and criticism",
    "in literature",
    "monografias",
    "monografía",
    "study guides",
    "guia de lectura",
    "obras de",
];

function isRelevantToQuery(book: BookSearchResult, query: string): boolean {
    // Idioma no detectado: dejamos pasar (mejor falsos positivos que vacío).
    if (book.title && hasNonLatinScript(book.title) && !hasNonLatinScript(query)) {
        return false;
    }

    if (isLikelyPersonQuery(query)) {
        if (isWorkAboutPerson(book, query)) return false;
        if (!matchesPrimaryAuthor(book.authors, query)) return false;
        if (hasBiographySubject(book)) return false;
        if (titleMentionsQueryWithDifferentAuthor(book, query)) return false;
    }

    return true;
}

// Patrones de título inequívocamente académicos / críticos. Conservadores:
// excluyo "ensayo sobre" porque hay obras legítimas como Saramago.
const ACADEMIC_TITLE_PATTERNS = [
    "lectures on",
    "lecturas sobre",
    "guia del lector",
    "guia de lectura",
    "reader's guide",
    "como leer a",
    "como leer el",
    "how to read",
    "estudios sobre la obra",
    "estudio critico",
    "critical study",
    "critical companion",
    "analisis literario",
    "comentario de texto",
    "interpretacion de la obra",
    "introduccion a la obra",
    "reflexiones sobre",
    "reflections on",
    "lecturas de",
    "leer a ",
    // Sufijos temáticos típicos de estudios.
    " y nuestro tiempo",
    " y nuestro siglo",
    " en nuestro tiempo",
    " y la modernidad",
    " y la sociedad",
    " y el lector",
    " y la critica",
    " como juego",
    " como obra",
    " como fenomeno",
    " segun ",
];

function hasAcademicTitlePattern(title: string | null): boolean {
    if (!title) return false;
    const normalized = canonicalize(title);
    return ACADEMIC_TITLE_PATTERNS.some((pattern) => normalized.includes(pattern));
}

// "El Quijote de Cervantes", "Cien años de soledad de García Márquez" —
// patrón canónico de edición crítica/estudio. Detectamos: tras todos los
// tokens de la query, sigue " de " + UNA palabra sola al final (sin "la"
// / "los" / "el" en medio, que ya delatarían un sintagma locativo o
// nominal complementario, como "Don Quijote de la Mancha").
function looksLikeAuthorAttributedStudy(title: string | null, query: string): boolean {
    if (!title) return false;
    const tokens = canonicalize(query).split(/\s+/).filter((t) => t.length >= 3);
    if (tokens.length === 0) return false;
    const normalized = canonicalize(title);
    // Escapa caracteres especiales por si hay alguno.
    const escapedTokens = tokens.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
    // Regex: la query seguida de " de " + 1 palabra (>=3 letras) al final, sin
    // articulos intermedios.
    const pattern = new RegExp(`\\b${escapedTokens.join("\\s+")}\\s+de\\s+([a-z]{3,})\\s*$`);
    const match = normalized.match(pattern);
    if (!match) return false;
    // La palabra final no debe ser una preposición o sustantivo común
    // (filtro contra falsos positivos como "[obra] de cama", "[obra] de oro").
    const COMMON_NOUNS = new Set(["cama", "oro", "plata", "amor", "vida", "agua", "luz"]);
    return !COMMON_NOUNS.has(match[1]);
}

/**
 * Filtro para queries de TÍTULO (no persona). Descarta:
 *  - títulos con script no-latino cuando la query es latina.
 *  - works donde algún sujeto-persona contiene tokens de la query.
 *  - works con subjects de crítica/biografía académica.
 *  - works con patrones de título académico.
 *  - works cuyo título NO contiene NINGÚN token de la query (cubre el caso
 *    de un autor real llamado igual que el título buscado: "Pedro Páramo"
 *    como autor de guías de viaje, "El nieto de don quijote" como seudónimo).
 *
 * NO aplica matchesPrimaryAuthor ni titleMentionsQueryWithDifferentAuthor:
 * por definición, en una búsqueda de título el query aparece en el título
 * y el autor real (Cervantes, Rulfo, etc.) NO contiene el título.
 */
function isRelevantInTitleMode(book: BookSearchResult, query: string): boolean {
    if (book.title && hasNonLatinScript(book.title) && !hasNonLatinScript(query)) {
        return false;
    }
    if (isWorkAboutPerson(book, query)) return false;
    if (hasBiographySubject(book)) return false;
    if (hasAcademicTitlePattern(book.title)) return false;
    if (looksLikeAuthorAttributedStudy(book.title, query)) return false;
    if (!titleContainsAnyQueryToken(book.title, query)) return false;
    return true;
}

function titleContainsAnyQueryToken(title: string | null, query: string): boolean {
    if (!title) return false;
    const tokens = canonicalize(query).split(/\s+/).filter((t) => t.length >= 3);
    if (tokens.length === 0) return true;
    const normalizedTitle = canonicalize(title);
    return tokens.some((token) => normalizedTitle.includes(token));
}

function isWorkAboutPerson(book: BookSearchResult, query: string): boolean {
    // Si la persona buscada es el autor principal, NO consideramos la obra
    // "sobre" esa persona. OL tagea las novelas propias de un autor con su
    // nombre en `subject_person` (mecanismo de indexación), lo que confundía
    // este filtro y eliminaba todas las novelas reales del autor.
    if (matchesPrimaryAuthor(book.authors, query)) return false;

    const anno = book as BookSearchResult & { __subjectPeople?: string[] };
    const subjectPeople = anno.__subjectPeople ?? [];
    if (subjectPeople.length === 0) return false;
    const tokens = canonicalize(query).split(/\s+/).filter((t) => t.length >= 3);
    if (tokens.length === 0) return false;
    return subjectPeople.some((person) => {
        const normalized = canonicalize(person);
        return tokens.every((token) => normalized.includes(token));
    });
}

function titleMentionsQueryWithDifferentAuthor(book: BookSearchResult, query: string): boolean {
    // Si el título contiene el nombre buscado y CUALQUIER autor de la lista no
    // lo contiene, es probable biografía/estudio sobre la persona. OL reordena
    // author_name cuando usas ?author=, así que mirar solo authors[0] no basta:
    // necesitamos exigir que TODOS los autores contengan la query.
    //
    // Esto descarta libros co-autorizados con ilustradores/traductores cuando el
    // título incluye el nombre del autor — falso negativo asumible a cambio de
    // limpiar las biografías académicas que dominan resultados de figuras como
    // Murakami o García Márquez.
    const tokens = canonicalize(query).split(/\s+/).filter((t) => t.length >= 3);
    if (tokens.length === 0) return false;
    const title = canonicalize(book.title);
    if (!tokens.every((token) => title.includes(token))) return false;

    if (book.authors.length === 0) return true;
    return book.authors.some((author) => {
        const normalized = canonicalize(author);
        return !tokens.every((token) => normalized.includes(token));
    });
}

function matchesPrimaryAuthor(authors: string[], query: string): boolean {
    if (authors.length === 0) return false;
    const tokens = canonicalize(query).split(/\s+/).filter((t) => t.length >= 3);
    if (tokens.length === 0) return true;
    // Solo el primer autor: evita falsos positivos donde el nombre buscado
    // aparece como traductor o co-crédito (p. ej. Murakami traduciendo a Salinger).
    const primary = canonicalize(authors[0]);
    return tokens.every((token) => primary.includes(token));
}

function hasBiographySubject(book: BookSearchResult): boolean {
    if (book.categories.length === 0) return false;
    const subjects = book.categories.map((c) => c.toLowerCase());
    return subjects.some((subject) =>
        BIOGRAPHY_SUBJECT_MARKERS.some((marker) => subject.includes(marker)),
    );
}

function hasNonLatinScript(text: string): boolean {
    // CJK, Hiragana, Katakana, Hangul, Hebrew, Arabic, Cyrillic.
    return /[぀-ヿ㐀-䶿一-鿿가-힯֐-׿؀-ۿЀ-ӿ]/.test(text);
}

// ─────────────────────────────────────────────────────────────────────────────
// Búsqueda local (caché)
// ─────────────────────────────────────────────────────────────────────────────

async function searchLocalCache(query: string, limit: number): Promise<BookSearchResult[]> {
    try {
        const supabase = await createServerSupabaseClient();
        const normalizedQuery = normalizeForTrgm(query);

        // El índice GIN sobre `title_normalized` con gin_trgm_ops responde
        // eficientemente a ILIKE '%...%'.
        const titlePromise = supabase
            .from("books")
            .select(BOOK_SELECT_FIELDS)
            .ilike("title_normalized", `%${normalizedQuery}%`)
            .limit(limit);

        // Si la query parece un nombre, buscamos también por autor.
        const authorIdsPromise = isLikelyPersonQuery(query)
            ? supabase
                  .from("authors")
                  .select("id")
                  .ilike("name", `%${query}%`)
                  .limit(10)
                  .then(({ data }) => (data ?? []).map((a) => a.id))
            : Promise.resolve<string[]>([]);

        const [{ data: titleMatches, error: titleError }, authorIds] = await Promise.all([
            titlePromise,
            authorIdsPromise,
        ]);

        if (titleError) {
            console.warn("[Search] Local title search failed:", titleError);
        }

        const authorMatches = authorIds.length
            ? (
                  await supabase
                      .from("books")
                      .select(BOOK_SELECT_FIELDS)
                      .in("author_id", authorIds)
                      .limit(limit)
              ).data ?? []
            : [];

        const combined = [...(titleMatches ?? []), ...authorMatches] as unknown as LocalBookRow[];
        return dedupeByWork(combined.map(mapLocalBook));
    } catch (error) {
        console.warn("[Search] Local cache unavailable:", error);
        return [];
    }
}

async function searchByIsbn(isbn: string): Promise<BookSearchResult[]> {
    try {
        const supabase = await createServerSupabaseClient();

        // Resuelve la edición y, por FK, la obra.
        const { data: edition } = await supabase
            .from("editions")
            .select(`
                id, isbn, isbn13, cover_url, page_count, published_date,
                publication_year, language, publisher, format,
                book:book_id ( ${BOOK_SELECT_FIELDS} )
            `)
            .or(`isbn13.eq.${isbn},isbn.eq.${isbn}`)
            .maybeSingle();

        if (edition?.book) {
            const row = edition.book as unknown as LocalBookRow;
            // Sustituimos la preferred_edition por la edición concreta consultada.
            const overridden: LocalBookRow = {
                ...row,
                preferred_edition: {
                    id: (edition as { id: string }).id,
                    isbn: (edition as { isbn: string | null }).isbn,
                    isbn13: (edition as { isbn13: string | null }).isbn13,
                    cover_url: (edition as { cover_url: string | null }).cover_url,
                    page_count: (edition as { page_count: number | null }).page_count,
                    published_date: (edition as { published_date: string | null }).published_date,
                    publication_year: (edition as { publication_year: number | null }).publication_year,
                    language: (edition as { language: string | null }).language,
                    publisher: (edition as { publisher: string | null }).publisher,
                    format: (edition as { format: string | null }).format,
                },
            };
            return [mapLocalBook(overridden)];
        }
    } catch (error) {
        console.warn("[Search] Local ISBN lookup failed:", error);
    }

    // No está en caché: dejamos que el detalle por ISBN lo resuelva ISBNdb.
    // La promoción a `editions`/`books` corresponde a EditionMatchingService (Fase 3).
    const { getBookByISBN } = await import("@/lib/isbndb");
    const isbndbBook = await getBookByISBN(isbn);
    return isbndbBook ? [isbndbBook] : [];
}

async function searchByExperience(
    experienceLabel: string,
    experienceTerms: string[],
    limit: number,
): Promise<BookSearchResult[]> {
    try {
        const supabase = await createServerSupabaseClient();
        const { data } = await supabase
            .from("books")
            .select(BOOK_SELECT_FIELDS)
            .eq("experience", experienceLabel)
            .limit(limit);

        const localResults = ((data ?? []) as unknown as LocalBookRow[]).map(mapLocalBook);

        // Solo si la caché local no llena el cupo y hay términos de respaldo,
        // intentamos OL con la lista de términos.
        if (localResults.length >= LOCAL_RESULT_TARGET || experienceTerms.length === 0) {
            return localResults.slice(0, limit);
        }

        const olBatches = await Promise.all(
            experienceTerms.slice(0, 4).map((term) =>
                searchOpenLibraryWorks(term, { limit: 8 }),
            ),
        );
        const olResults = olBatches.flatMap((batch) => batch.works).map(mapOpenLibraryWork);

        return dedupeByWork([...localResults, ...olResults]).slice(0, limit);
    } catch (error) {
        console.warn("[Search] Experience search failed:", error);
        return [];
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Mapeos
// ─────────────────────────────────────────────────────────────────────────────

function mapLocalBook(row: LocalBookRow): BookSearchResult {
    const edition = row.preferred_edition;
    const coverFromExternal = pickCoverFromExternalIds(row.external_ids);

    return {
        id: row.id,
        title: row.title,
        authors: row.authors?.name ? [row.authors.name] : [],
        cover_url: edition?.cover_url ?? coverFromExternal,
        description: row.description,
        isbn: edition?.isbn13 ?? edition?.isbn ?? null,
        isbn13: edition?.isbn13 ?? null,
        page_count: edition?.page_count ?? null,
        published_date: edition?.published_date ?? null,
        publisher: edition?.publisher ?? null,
        categories: [],
        genre: row.genre,
        experience: row.experience,
        average_rating: null,
        ratings_count: null,
        language: edition?.language ?? row.original_language ?? null,
        price: null,
        source: "db",
    };
}

function mapOpenLibraryWork(work: OpenLibraryWork): BookSearchResult & { __subjectPeople?: string[] } {
    const primaryIsbn = work.isbnExamples[0] ?? null;
    return {
        id: `ol:${work.workKey}`,
        title: work.title,
        authors: work.authors,
        cover_url: work.coverUrl,
        description: null,
        isbn: primaryIsbn,
        isbn13: primaryIsbn && primaryIsbn.length === 13 ? primaryIsbn : null,
        page_count: null,
        published_date: work.firstPublicationYear ? `${work.firstPublicationYear}-01-01` : null,
        publisher: null,
        categories: work.subjects.slice(0, 6),
        genre: null,
        experience: null,
        average_rating: null,
        ratings_count: null,
        language: work.languages[0] ?? null,
        price: null,
        source: "openlibrary",
        // Anotamos subject_people para que el filtro de relevancia los use.
        // No es parte de BookSearchResult público; los consumidores lo ignoran.
        __subjectPeople: work.subjectPeople,
    };
}

function pickCoverFromExternalIds(externalIds: Record<string, unknown> | null): string | null {
    if (!externalIds) return null;
    const olCoverId = externalIds["openlibrary_cover_id"];
    if (typeof olCoverId === "number") {
        return `https://covers.openlibrary.org/b/id/${olCoverId}-L.jpg`;
    }
    return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Utilidades
// ─────────────────────────────────────────────────────────────────────────────

function dedupeByWork(books: BookSearchResult[]): BookSearchResult[] {
    const seen = new Map<string, BookSearchResult>();
    for (const book of books) {
        const key = workKey(book);
        const existing = seen.get(key);
        // Prioriza resultados locales (source=db) sobre externos.
        if (!existing || (book.source === "db" && existing.source !== "db")) {
            seen.set(key, book);
        }
    }
    return Array.from(seen.values());
}

// ─────────────────────────────────────────────────────────────────────────────
// Cross-language collapse (Fase 3.5)
//
// Two OL works may represent the same canonical work in different languages
// (e.g. "Plaza del diamante" vs "La plaça del diamant"). They don't share the
// normalized title and OL does not link them, so we collapse pairs that:
//   · belong to the same primary author (canonicalized name),
//   · do not share any language, AND
//   · whose titles have a trigram Jaccard >= TRANSLATION_SIM_THRESHOLD.
// ─────────────────────────────────────────────────────────────────────────────

const TRANSLATION_SIM_THRESHOLD = 0.4;

function collapseTranslations(books: BookSearchResult[]): BookSearchResult[] {
    if (books.length < 2) return books;

    const collapsed: BookSearchResult[] = [];
    const consumed = new Set<number>();
    const trigramCache = books.map((b) => titleTrigrams(b.title));

    for (let i = 0; i < books.length; i++) {
        if (consumed.has(i)) continue;
        let chosen = books[i];
        consumed.add(i);

        for (let j = i + 1; j < books.length; j++) {
            if (consumed.has(j)) continue;
            const other = books[j];

            if (!shareSameAuthor(chosen, other)) continue;
            if (shareAnyLanguage(chosen, other)) continue;

            const similarity = jaccard(trigramCache[i], trigramCache[j]);
            if (similarity < TRANSLATION_SIM_THRESHOLD) continue;

            chosen = pickCanonical(chosen, other);
            consumed.add(j);
        }

        collapsed.push(chosen);
    }

    return collapsed;
}

function shareSameAuthor(a: BookSearchResult, b: BookSearchResult): boolean {
    const an = canonicalize(a.authors[0] ?? "");
    const bn = canonicalize(b.authors[0] ?? "");
    return an.length > 0 && an === bn;
}

function shareAnyLanguage(a: BookSearchResult, b: BookSearchResult): boolean {
    if (!a.language || !b.language) return false;
    return a.language.toLowerCase() === b.language.toLowerCase();
}

function pickCanonical(a: BookSearchResult, b: BookSearchResult): BookSearchResult {
    // Locales primero.
    if (a.source === "db" && b.source !== "db") return a;
    if (b.source === "db" && a.source !== "db") return b;

    // Prefiere el que tenga portada.
    if (a.cover_url && !b.cover_url) return a;
    if (b.cover_url && !a.cover_url) return b;

    // Año de publicación más antiguo (proxy de "obra original").
    const ay = yearFromIso(a.published_date);
    const by = yearFromIso(b.published_date);
    if (ay !== null && by !== null && ay !== by) return ay < by ? a : b;

    // Como último criterio, el que tenga descripción.
    if (a.description && !b.description) return a;
    if (b.description && !a.description) return b;

    return a;
}

function titleTrigrams(title: string): Set<string> {
    const normalized = canonicalize(title);
    if (normalized.length < 3) return new Set();
    const padded = `  ${normalized}  `;
    const set = new Set<string>();
    for (let i = 0; i <= padded.length - 3; i++) {
        const tg = padded.slice(i, i + 3);
        if (tg.trim().length > 0) set.add(tg);
    }
    return set;
}

function jaccard(a: Set<string>, b: Set<string>): number {
    if (a.size === 0 || b.size === 0) return 0;
    let intersect = 0;
    for (const item of a) if (b.has(item)) intersect++;
    const union = a.size + b.size - intersect;
    return union === 0 ? 0 : intersect / union;
}

function yearFromIso(value: string | null): number | null {
    if (!value) return null;
    const match = value.match(/\b(1[5-9]\d{2}|20\d{2})\b/);
    return match ? Number(match[1]) : null;
}

function workKey(book: BookSearchResult): string {
    const author = canonicalize(book.authors[0] ?? "");
    const title = normalizeForTrgm(book.title);
    return `${title}::${author}`;
}

function canonicalize(value: string): string {
    return value
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}

function normalizeForTrgm(value: string): string {
    // Espejo aproximado de la función SQL public.normalize_title.
    return canonicalize(value)
        .replace(/\s*[:\-–—].*$/, "")
        .trim();
}

const TITLE_LEAD_ARTICLES = new Set([
    "el", "la", "lo", "los", "las",
    "un", "una", "unos", "unas",
    "the", "a", "an",
    "le", "les",
    "il",
    "els", "uns", "unes",
    "don", "doña", "dona",
]);

// Preposiciones que aparecen en títulos pero NO en nombres de personas.
// "de" y "del" se EXCLUYEN aposta porque sí aparecen en nombres
// (Miguel de Cervantes, García de la Concha, etc.).
const TITLE_INTERNAL_PREPOSITIONS = new Set([
    "a", "al",
    "para", "con", "sin", "por",
    "sobre", "bajo", "tras", "ante",
    "hacia", "desde", "hasta", "entre",
    "como",
    // Castellano "que" / "y" están entre verbos y oraciones; las dejamos fuera.
]);

// Numerales y cuantificadores en español: en una query indican casi seguro
// un título ("Cien años...", "Mil novecientos...", "Dos amigos").
const SPANISH_NUMERALS = new Set([
    "cien", "mil", "ciento", "doscientos", "trescientos",
    "uno", "dos", "tres", "cuatro", "cinco", "seis", "siete", "ocho", "nueve", "diez",
    "once", "doce", "trece", "catorce", "quince", "veinte", "treinta", "cuarenta",
    "cincuenta", "sesenta", "setenta", "ochenta", "noventa",
    "primer", "primera", "segundo", "segunda", "tercer", "tercera",
]);

// Sustantivos típicos de títulos (no de nombres propios). Si aparecen en
// la query, es casi seguro un título: "X años", "X de amor", "guerra y X".
const TITLE_NOUNS = new Set([
    "años", "anos", "dias", "noches", "horas", "semanas", "siglo", "siglos",
    "amor", "vida", "muerte", "guerra", "paz", "tiempo", "tiempos",
    "historia", "historias", "cronica", "cronicas",
    "viaje", "viajes", "camino", "caminos",
    "cuento", "cuentos", "novela", "novelas", "ensayo", "ensayos",
    "mundo", "mundos", "ciudad", "ciudades", "casa", "casas",
    "noche", "manana", "tarde", "verano", "invierno",
    "soledad", "felicidad", "tristeza", "alegria",
    "padre", "madre", "hermano", "hermana", "hijo", "hija",
]);

function isLikelyPersonQuery(query: string): boolean {
    const tokens = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
    if (tokens.length === 0 || tokens.length > 4) return false;
    if (tokens.some((t) => /\d/.test(t))) return false;
    // Si empieza por artículo / determinante, casi seguro es un título.
    if (TITLE_LEAD_ARTICLES.has(tokens[0])) return false;
    // Si tiene en medio una preposición de "título", es un título:
    // "matar a un ruiseñor", "ensayo sobre la ceguera", "el amor en los tiempos del cólera".
    if (tokens.some((t) => TITLE_INTERNAL_PREPOSITIONS.has(t))) return false;
    // Si tiene un artículo en posición intermedia ("matar a UN ruiseñor",
    // "vida y destino DE LA familia"), también es título.
    if (tokens.slice(1).some((t) => TITLE_LEAD_ARTICLES.has(t))) return false;
    // Numerales españoles o sustantivos típicos de título ("cien años...",
    // "vida y...", "guerra y paz") delatan título, no persona.
    const tokensCanonical = tokens.map((t) => canonicalize(t));
    if (tokensCanonical.some((t) => SPANISH_NUMERALS.has(t) || TITLE_NOUNS.has(t))) {
        return false;
    }
    if (tokens.length >= 2) return true;
    // Una sola palabra: la tratamos como apellido si tiene ≥4 letras
    // y solo contiene caracteres latinos. Cubre "murakami", "rodoreda".
    const [solo] = tokens;
    return solo.length >= 4 && /^[a-záéíóúñüç]+$/i.test(solo);
}

function normalizeISBN(value: string): string | null {
    const normalized = value.replace(/[^0-9Xx]/g, "").toUpperCase();
    return normalized.length === 10 || normalized.length === 13 ? normalized : null;
}
