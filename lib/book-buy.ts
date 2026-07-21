// Opciones de compra "en indie" para la ficha pública de un libro (/libro/[id]).
// El wedge anti-Amazon: llevar al lector a una librería de barrio. Server-only,
// service role (lectura pública que cruza clubs/organizaciones).
import { createAdminClient } from "@/utils/supabase/admin";
import { buildBuyLink, todosTusLibrosUrl } from "@/lib/buy-link";

type LooseClient = { from: (table: string) => any };

export interface StoreBuyOption {
    id: string;
    name: string;
    slug: string | null;
    logoUrl: string | null;
    brandColor: string | null;
    url: string; // enlace propio de la librería (plantilla), nunca el fallback global
}

export interface BookBuyOptions {
    /** Librerías de Wordelia con club público leyendo este libro y enlace de compra propio. */
    stores: StoreBuyOption[];
    /** Búsqueda en Todostuslibros.com (red de librerías independientes de CEGAL) por ISBN o título. null si no hay ninguno. */
    indieSearchUrl: string | null;
}

/** Un ISBN utilizable para el libro (edición preferida primero, si no cualquiera). */
async function resolveIsbn(admin: LooseClient, bookId: string, preferredEditionId: string | null): Promise<string | null> {
    const { data: editions } = await admin
        .from("editions")
        .select("id, isbn13, isbn")
        .eq("book_id", bookId);
    const rows = (editions ?? []) as any[];
    if (rows.length === 0) return null;
    const preferred = preferredEditionId ? rows.find((e) => e.id === preferredEditionId) : null;
    const ordered = preferred ? [preferred, ...rows.filter((e) => e !== preferred)] : rows;
    for (const e of ordered) {
        const isbn = e.isbn13 || e.isbn;
        if (isbn) return String(isbn);
    }
    return null;
}

export async function getBookBuyOptions(
    bookId: string,
    opts: { title: string; preferredEditionId?: string | null },
): Promise<BookBuyOptions> {
    const admin = createAdminClient() as unknown as LooseClient;

    const isbn = await resolveIsbn(admin, bookId, opts.preferredEditionId ?? null);

    // Librerías con un club PÚBLICO que tiene este libro (actual o pasado). No se
    // expone el club en sí, solo la librería (que ya es pública).
    let stores: StoreBuyOption[] = [];
    try {
        const { data: cbRows } = await admin.from("club_books").select("club_id").eq("book_id", bookId);
        const clubIds = [...new Set(((cbRows ?? []) as any[]).map((r) => r.club_id).filter(Boolean))];

        if (clubIds.length) {
            const { data: clubRows } = await admin
                .from("clubs")
                .select("organization_id")
                .in("id", clubIds)
                .eq("is_archived", false)
                .eq("visibility", "public")
                .not("organization_id", "is", null);
            const orgIds = [...new Set(((clubRows ?? []) as any[]).map((c) => c.organization_id).filter(Boolean))];

            if (orgIds.length) {
                const { data: orgRows } = await admin
                    .from("organizations")
                    .select("id, name, slug, logo_url, brand_color, buy_link_template")
                    .in("id", orgIds)
                    .eq("is_active", true);

                stores = ((orgRows ?? []) as any[])
                    .map((o) => {
                        // Solo enlace propio de la tienda (fallback: false, para no
                        // repetir el mismo enlace de Todostuslibros N veces; el global se
                        // renderiza una sola vez abajo).
                        const url = buildBuyLink({ template: o.buy_link_template, isbn, title: opts.title, fallback: false });
                        return url ? { id: o.id, name: o.name, slug: o.slug ?? null, logoUrl: o.logo_url ?? null, brandColor: o.brand_color ?? null, url } : null;
                    })
                    .filter(Boolean) as StoreBuyOption[];
            }
        }
    } catch (e) {
        console.error("getBookBuyOptions:stores", e);
    }

    // Fallback global: Todostuslibros (CEGAL). Con ISBN cae directo en la ficha;
    // si no, búsqueda por título. Sin afiliación/comisión: es descubrimiento indie.
    const keyword = isbn || opts.title;
    const indieSearchUrl = keyword ? todosTusLibrosUrl(keyword) : null;

    return { stores, indieSearchUrl };
}
