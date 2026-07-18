// Formateadores compartidos por las vistas públicas de clubs.
// Antes vivían duplicados en cada componente, cada uno con su propio
// fallback de 9,90 € que se pintaba aunque la BD dijera otra cosa.

/** "15 de agosto de 2026". Devuelve null si no hay fecha: el llamante decide qué mostrar. */
export function formatStartDate(value?: string | null, opts?: { short?: boolean }): string | null {
    if (!value) return null;

    const [datePart] = value.split("T");
    const [year, month, day] = datePart.split("-").map(Number);
    if (!year || !month || !day) return null;

    return new Intl.DateTimeFormat("es-ES", opts?.short
        ? { day: "numeric", month: "short" }
        : { day: "numeric", month: "long", year: "numeric" },
    ).format(new Date(year, month - 1, day));
}

/**
 * Precio en euros tal y como lo guarda clubs.price.
 * Sin precio devuelve null (no se inventa importe) y 0 se muestra como "Gratis".
 */
export function formatClubPrice(price?: number | null, currency = "EUR"): string | null {
    if (price == null || Number.isNaN(price)) return null;
    if (price === 0) return "Gratis";

    return new Intl.NumberFormat("es-ES", {
        style: "currency",
        currency: currency || "EUR",
    }).format(price);
}

/** Ruta pública del club. Cae al id cuando el club no tiene slug. */
export function clubHref(club: { slug?: string | null; id: string }): string {
    return `/clubes/${club.slug || club.id}`;
}
