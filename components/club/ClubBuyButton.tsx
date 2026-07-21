"use client";

import { ShoppingBag } from "lucide-react";
import { buildBuyLink } from "@/lib/buy-link";
import { BuyBookButton } from "@/components/book/BuyBookButton";

/**
 * Botón "Comprar" del libro de un club. Si el club es de una librería con enlace de
 * compra propio, prioriza esa tienda ("Comprar en {librería}"). Si no, delega en
 * BuyBookButton (librería principal del lector → Todostuslibros).
 */
export function ClubBuyButton({
    isbn,
    title,
    org,
}: {
    isbn?: string | null;
    title?: string | null;
    org?: { name: string; buyLinkTemplate: string | null; brandColor: string | null } | null;
}) {
    const storeUrl = org?.buyLinkTemplate
        ? buildBuyLink({ template: org.buyLinkTemplate, isbn, title, fallback: false })
        : null;

    if (storeUrl && org) {
        return (
            <a
                href={storeUrl}
                target="_blank"
                rel="noopener noreferrer sponsored"
                style={org.brandColor ? { color: org.brandColor, borderColor: org.brandColor, backgroundColor: `${org.brandColor}14` } : undefined}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-teal/25 bg-white px-5 py-2.5 text-sm font-semibold text-teal transition-colors hover:bg-teal/5"
            >
                <ShoppingBag className="h-4 w-4" aria-hidden="true" /> Comprar en {org.name}
            </a>
        );
    }

    return <BuyBookButton isbn={isbn} title={title} />;
}
