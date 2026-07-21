/**
 * Búsqueda en Todostuslibros.com (la red de librerías independientes de España,
 * CEGAL). Con un ISBN exacto la web aterriza directa en la ficha del libro con las
 * librerías que lo tienen; con un título hace búsqueda. Es el fallback "indie" de
 * Wordelia: descubrimiento, no afiliación (no hay comisión para terceros).
 */
export function todosTusLibrosUrl(keyword: string): string {
    return `https://www.todostuslibros.com/busquedas?keyword=${encodeURIComponent(keyword)}`;
}

/**
 * Build a "buy this book" link for a bookstore.
 *
 * Primary: the bookstore's own URL template, with {isbn} / {title} placeholders
 * (e.g. `https://milibreria.com/buscar?isbn={isbn}`). The bookstore keeps the sale.
 *
 * Fallback (only when `fallback` is true, the default): a Todostuslibros.com search
 * by ISBN (or title), so the reader still lands on independent bookstores instead
 * of a giant retailer. Pass `fallback: false` when the caller already renders a
 * single global fallback and doesn't want it repeated per store.
 *
 * Returns null when no usable link can be built.
 */
export function buildBuyLink(opts: {
    template?: string | null;
    isbn?: string | null;
    title?: string | null;
    fallback?: boolean;
}): string | null {
    const { template, isbn, title, fallback = true } = opts;

    if (template && template.trim()) {
        const needsIsbn = template.includes("{isbn}");
        const needsTitle = template.includes("{title}");
        const canFill = (!needsIsbn || !!isbn) && (!needsTitle || !!title);
        if (canFill) {
            return template
                .replaceAll("{isbn}", encodeURIComponent(isbn ?? ""))
                .replaceAll("{title}", encodeURIComponent(title ?? ""));
        }
        // Template can't be filled → fall through to the fallback.
    }

    if (fallback) {
        const keyword = isbn || title;
        if (keyword) return todosTusLibrosUrl(keyword);
    }

    return null;
}
