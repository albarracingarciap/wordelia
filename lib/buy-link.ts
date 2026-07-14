/**
 * Build a "buy this book" link for a bookstore.
 *
 * Primary: the bookstore's own URL template, with {isbn} / {title} placeholders
 * (e.g. `https://milibreria.com/buscar?isbn={isbn}`). The bookstore keeps the sale.
 *
 * Fallback: a global Bookshop.org affiliate link by ISBN (Wordelia's commission),
 * used only when the store has no usable template and an affiliate id is configured.
 *
 * Returns null when no usable link can be built (e.g. template needs an ISBN we
 * don't have and no fallback applies).
 */
export function buildBuyLink(opts: {
    template?: string | null;
    isbn?: string | null;
    title?: string | null;
    bookshopAffiliateId?: string | null;
}): string | null {
    const { template, isbn, title, bookshopAffiliateId } = opts;

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

    if (bookshopAffiliateId && isbn) {
        return `https://bookshop.org/a/${bookshopAffiliateId}/${encodeURIComponent(isbn)}`;
    }

    return null;
}
