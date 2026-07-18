/**
 * Nombre del autor de un libro, sea cual sea la forma en que venga.
 *
 * Contexto: `books` arrastra dos campos por una decisión de diseño antigua —
 * `author` (texto, poblado en las 123 filas) y `author_id` -> `authors`
 * (poblado solo en 13). La fuente de verdad es `author`; el join queda
 * deprecado y se irá con la tabla `authors`.
 *
 * Acepta: string plano, objeto {name}, array [{name}] y las claves `author`
 * o `authors`, para que un select a medio migrar nunca devuelva undefined
 * en silencio.
 */
export function bookAuthorName(book: any): string | null {
    if (!book) return null;

    const raw = book.author ?? book.authors;
    if (!raw) return null;

    if (typeof raw === "string") return raw.trim() || null;
    if (Array.isArray(raw)) {
        const first = raw[0];
        if (!first) return null;
        return typeof first === "string" ? first : (first?.name ?? null);
    }

    return raw?.name ?? null;
}

/** Igual que bookAuthorName pero con texto de reserva para la interfaz. */
export function bookAuthorLabel(book: any, fallback = "Autor desconocido"): string {
    return bookAuthorName(book) ?? fallback;
}
