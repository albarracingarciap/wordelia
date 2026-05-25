// Filtros y scoring de calidad para ediciones (Fase 3).
// Funciones puras: ninguna toca la BD ni APIs externas.

export interface EditionQualityInput {
    title: string | null;
    coverUrl: string | null;
    language: string | null;
    publisher: string | null;
    publishedDate: string | null;   // ISO o yyyy-mm-dd
    pageCount: number | null;
    isAbridged: boolean;
    description: string | null;
    isbn: string | null;
    isbn13: string | null;
}

export interface QualityContext {
    /** Año de primera publicación de la obra. Si la edición está cerca, mejor score. */
    firstPublicationYear?: number | null;
    /** Códigos de idioma permitidos. Default ['spa', 'cat', 'es', 'ca']. */
    allowedLanguages?: readonly string[];
    /** El usuario aceptó ediciones abreviadas explícitamente. */
    allowAbridged?: boolean;
}

export interface QualityResult {
    accepted: boolean;
    reasons: string[];      // motivos de rechazo (vacío si accepted)
    score: number;          // 0..100
    breakdown: Record<string, number>;
}

const DEFAULT_LANGUAGES = ["spa", "cat", "es", "ca"] as const;

const ISBNDB_COVER_PLACEHOLDERS = [
    "bookcover-not-available",
    "no_cover",
    "nocover",
    "placeholder",
    "nophoto",
    "image-not-available",
];

const PRESTIGIOUS_PUBLISHERS = [
    "alianza", "alba", "anagrama", "acantilado", "austral", "akal", "blackie books",
    "catedra", "cátedra", "debolsillo", "edhasa", "errata naturae", "galaxia gutenberg",
    "impedimenta", "lumen", "libros del asteroide", "minotauro", "nórdica", "nordica",
    "navona", "penguin", "planeta", "punto de lectura", "salamandra", "seix barral",
    "siruela", "tusquets", "valdemar",
];

export function evaluateEditionQuality(
    input: EditionQualityInput,
    ctx: QualityContext = {},
): QualityResult {
    const allowed = (ctx.allowedLanguages ?? DEFAULT_LANGUAGES).map((l) => l.toLowerCase());
    const reasons: string[] = [];
    const breakdown: Record<string, number> = {};

    // ── Filtros duros (descartan la edición) ────────────────────────────────
    if (!input.coverUrl || isPlaceholderCover(input.coverUrl)) {
        reasons.push("missing_or_placeholder_cover");
    }

    if (!input.language || !allowed.includes(input.language.toLowerCase())) {
        reasons.push("language_not_allowed");
    }

    if (input.isAbridged && !ctx.allowAbridged) {
        reasons.push("abridged_edition");
    }

    if (!input.title || input.title.trim().length === 0) {
        reasons.push("missing_title");
    }

    // ── Score (0..100) ──────────────────────────────────────────────────────
    let score = 0;

    // Portada: 25 puntos máximo. Premiamos URL no-placeholder.
    if (input.coverUrl && !isPlaceholderCover(input.coverUrl)) {
        const coverPoints = guessCoverQualityPoints(input.coverUrl);
        breakdown.cover = coverPoints;
        score += coverPoints;
    }

    // Completitud de metadatos: 25 puntos.
    const metadataPoints = scoreMetadataCompleteness(input);
    breakdown.metadata = metadataPoints;
    score += metadataPoints;

    // Prestigio del publisher: 20 puntos.
    const publisherPoints = scorePublisherPrestige(input.publisher);
    breakdown.publisher = publisherPoints;
    score += publisherPoints;

    // Año cercano a first_publication_year: hasta 15 puntos.
    const recencyPoints = scoreYearProximity(input.publishedDate, ctx.firstPublicationYear);
    breakdown.year_proximity = recencyPoints;
    score += recencyPoints;

    // Bonus por idioma whitelistado (15 puntos).
    if (input.language && allowed.includes(input.language.toLowerCase())) {
        breakdown.language_bonus = 15;
        score += 15;
    }

    return {
        accepted: reasons.length === 0,
        reasons,
        score: Math.max(0, Math.min(100, Math.round(score))),
        breakdown,
    };
}

export function isPlaceholderCover(url: string): boolean {
    const normalized = url.toLowerCase();
    return ISBNDB_COVER_PLACEHOLDERS.some((token) => normalized.includes(token));
}

function guessCoverQualityPoints(url: string): number {
    // Sin acceso a la imagen no podemos medir la resolución real.
    // Heurística: dominios de cover conocidos y ausencia de markers de baja-res.
    const lower = url.toLowerCase();

    // Open Library covers ofrecen L/M/S — preferimos L.
    if (lower.includes("covers.openlibrary.org") && lower.endsWith("-l.jpg")) return 25;
    if (lower.includes("covers.openlibrary.org")) return 18;

    // ISBNdb suele devolver imágenes razonables.
    if (lower.includes("isbndb.com") || lower.includes("images.isbndb")) return 22;

    // Sin pistas, asumimos calidad media-alta si la URL existe y no es placeholder.
    return 18;
}

function scoreMetadataCompleteness(input: EditionQualityInput): number {
    let points = 0;
    if (input.description && input.description.trim().length >= 80) points += 8;
    else if (input.description) points += 3;
    if (input.pageCount && input.pageCount > 0) points += 5;
    if (input.publishedDate) points += 5;
    if (input.publisher) points += 4;
    if (input.isbn13) points += 3;
    return Math.min(points, 25);
}

function scorePublisherPrestige(publisher: string | null): number {
    if (!publisher) return 0;
    const lower = publisher.toLowerCase();
    return PRESTIGIOUS_PUBLISHERS.some((name) => lower.includes(name)) ? 20 : 4;
}

function scoreYearProximity(
    publishedDate: string | null,
    firstPublicationYear: number | null | undefined,
): number {
    if (!publishedDate) return 0;
    const editionYear = extractYear(publishedDate);
    if (editionYear === null) return 0;

    // Sin año de referencia, premiamos ediciones modernas pero no recientísimas.
    if (!firstPublicationYear) {
        if (editionYear >= 2000) return 8;
        return 3;
    }

    const distance = Math.abs(editionYear - firstPublicationYear);
    if (distance <= 5) return 15;
    if (distance <= 20) return 10;
    if (distance <= 50) return 6;
    return 2;
}

function extractYear(value: string): number | null {
    const match = value.match(/\b(1[5-9]\d{2}|20\d{2})\b/);
    return match ? Number(match[1]) : null;
}
