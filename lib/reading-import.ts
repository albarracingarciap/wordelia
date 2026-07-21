// Parser (client/server-safe, sin BD) de exportaciones CSV de Goodreads y
// StoryGraph a un registro normalizado que el motor de import (F2) convierte en
// filas de user_books. Detecta el formato por sus cabeceras.

export type ImportReadingStatus = "WANT_TO_READ" | "READING" | "READ" | "DNF" | "PAUSED";
export type ImportSource = "goodreads" | "storygraph" | "unknown";

export interface ParsedBook {
    title: string;
    author: string | null;
    isbn: string | null; // ISBN-10
    isbn13: string | null;
    status: ImportReadingStatus;
    rating: number | null; // 1–5 (0 = sin valorar → null)
    review: string | null;
    dateRead: string | null; // ISO yyyy-mm-dd
    dateAdded: string | null; // ISO yyyy-mm-dd
    shelves: string[]; // estanterías/tags personalizados
}

export interface ParseResult {
    source: ImportSource;
    books: ParsedBook[];
    skipped: number; // filas sin título válido
}

/**
 * Parser CSV RFC4180-ish: soporta campos entre comillas, comillas escapadas ("")
 * con comas y saltos de línea dentro, y CRLF/LF. Ignora un BOM inicial.
 */
export function parseCsv(text: string): string[][] {
    if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);

    const rows: string[][] = [];
    let field = "";
    let row: string[] = [];
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {
        const c = text[i];
        if (inQuotes) {
            if (c === '"') {
                if (text[i + 1] === '"') {
                    field += '"';
                    i++;
                } else {
                    inQuotes = false;
                }
            } else {
                field += c;
            }
        } else if (c === '"') {
            inQuotes = true;
        } else if (c === ",") {
            row.push(field);
            field = "";
        } else if (c === "\n") {
            row.push(field);
            rows.push(row);
            row = [];
            field = "";
        } else if (c === "\r") {
            // parte de CRLF: se ignora; el \n cierra la fila.
        } else {
            field += c;
        }
    }
    if (field.length > 0 || row.length > 0) {
        row.push(field);
        rows.push(row);
    }

    // Descarta filas totalmente vacías (p. ej. salto final).
    return rows.filter((r) => r.some((f) => f.trim() !== ""));
}

export function detectSource(headers: string[]): ImportSource {
    const h = headers.map((x) => x.trim().toLowerCase());
    if (h.includes("exclusive shelf") || h.includes("bookshelves")) return "goodreads";
    if (h.includes("read status")) return "storygraph";
    return "unknown";
}

// --- Helpers de normalización ----------------------------------------------

function cleanIsbn(raw: string | undefined): { isbn: string | null; isbn13: string | null } {
    if (!raw) return { isbn: null, isbn13: null };
    // Goodreads envuelve el ISBN como ="9780..." para que Excel no lo trunque.
    const cleaned = raw.replace(/[="]/g, "").replace(/[\s-]/g, "").toUpperCase();
    if (cleaned.length === 13) return { isbn: null, isbn13: cleaned };
    if (cleaned.length === 10) return { isbn: cleaned, isbn13: null };
    return { isbn: null, isbn13: null };
}

function parseRating(raw: string | undefined): number | null {
    if (!raw) return null;
    const n = parseFloat(raw.replace(",", "."));
    if (Number.isNaN(n) || n <= 0) return null;
    return Math.min(5, n);
}

function parseDate(raw: string | undefined): string | null {
    if (!raw) return null;
    const s = raw.trim();
    if (!s) return null;
    // Acepta yyyy/mm/dd, yyyy-mm-dd (con o sin ceros).
    const m = s.match(/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})/);
    if (!m) return null;
    const [, y, mo, d] = m;
    return `${y}-${mo.padStart(2, "0")}-${d.padStart(2, "0")}`;
}

function statusFromGoodreads(shelf: string | undefined): ImportReadingStatus {
    switch ((shelf ?? "").trim().toLowerCase()) {
        case "read":
            return "READ";
        case "currently-reading":
            return "READING";
        case "to-read":
            return "WANT_TO_READ";
        default:
            return "WANT_TO_READ";
    }
}

function statusFromStoryGraph(status: string | undefined): ImportReadingStatus {
    switch ((status ?? "").trim().toLowerCase()) {
        case "read":
            return "READ";
        case "currently-reading":
            return "READING";
        case "to-read":
            return "WANT_TO_READ";
        case "did-not-finish":
        case "dnf":
            return "DNF";
        default:
            return "WANT_TO_READ";
    }
}

function splitShelves(raw: string | undefined): string[] {
    if (!raw) return [];
    return raw
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
}

/** Parsea un CSV de Goodreads o StoryGraph a registros normalizados. */
export function parseReadingCsv(text: string): ParseResult {
    const rows = parseCsv(text);
    if (rows.length < 2) return { source: "unknown", books: [], skipped: 0 };

    const headers = rows[0].map((h) => h.trim());
    const source = detectSource(headers);
    const lower = headers.map((h) => h.toLowerCase());
    const idx = (name: string) => lower.indexOf(name.toLowerCase());
    const at = (r: string[], name: string) => {
        const i = idx(name);
        return i >= 0 ? r[i] : undefined;
    };

    const books: ParsedBook[] = [];
    let skipped = 0;

    for (let i = 1; i < rows.length; i++) {
        const r = rows[i];
        const title = (at(r, "title") ?? "").trim();
        if (!title) {
            skipped++;
            continue;
        }

        if (source === "storygraph") {
            const { isbn, isbn13 } = cleanIsbn(at(r, "isbn/uid") ?? at(r, "isbn"));
            books.push({
                title,
                author: (at(r, "authors") ?? at(r, "author") ?? "").trim() || null,
                isbn,
                isbn13,
                status: statusFromStoryGraph(at(r, "read status")),
                rating: parseRating(at(r, "star rating")),
                review: (at(r, "review") ?? "").trim() || null,
                dateRead: parseDate(at(r, "last date read") ?? at(r, "dates read")),
                dateAdded: parseDate(at(r, "date added")),
                shelves: splitShelves(at(r, "tags")),
            });
        } else {
            // Goodreads (y fallback por defecto).
            const { isbn, isbn13 } = cleanIsbn(at(r, "isbn13") || at(r, "isbn"));
            books.push({
                title,
                author: (at(r, "author") ?? "").trim() || null,
                isbn,
                isbn13,
                status: statusFromGoodreads(at(r, "exclusive shelf")),
                rating: parseRating(at(r, "my rating")),
                review: (at(r, "my review") ?? "").trim() || null,
                dateRead: parseDate(at(r, "date read")),
                dateAdded: parseDate(at(r, "date added")),
                shelves: splitShelves(at(r, "bookshelves")),
            });
        }
    }

    return { source, books, skipped };
}

// Tamaño de lote del import por llamada (el cliente trocea; el servidor recorta a
// este máximo). Vive aquí (no en la action "use server", que solo exporta funciones).
export const IMPORT_BATCH_SIZE = 60;

export interface ImportBatchResult {
    imported: number; // nuevos añadidos a la estantería
    updated: number; // ya estaban y se actualizaron (modo merge=update)
    skippedExisting: number; // ya estaban y se dejaron intactos (modo skip)
    failed: number;
    failures: { title: string; reason: string }[]; // capado
}

export interface ImportOptions {
    /** Qué hacer con libros ya en la biblioteca: dejarlos (skip) o actualizarlos. */
    mode: "skip" | "update";
    /** Recrear las estanterías/etiquetas del CSV como colecciones de Wordelia. */
    withShelves: boolean;
}

// Nombres de estantería que en realidad son estado de lectura, no colecciones.
export const RESERVED_SHELF_NAMES = new Set([
    "read",
    "to-read",
    "currently-reading",
    "reading",
    "did-not-finish",
    "dnf",
    "abandoned",
]);

/** Recuento por estado, para el preview de la UI. */
export function summarizeByStatus(books: ParsedBook[]): Record<ImportReadingStatus, number> {
    const out: Record<ImportReadingStatus, number> = {
        WANT_TO_READ: 0,
        READING: 0,
        READ: 0,
        DNF: 0,
        PAUSED: 0,
    };
    for (const b of books) out[b.status]++;
    return out;
}
