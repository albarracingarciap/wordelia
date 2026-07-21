"use client";

import * as React from "react";
import { ShoppingBag, Loader2 } from "lucide-react";
import { buildBuyLink } from "@/lib/buy-link";
import { getMyPrimaryLibrary, type PrimaryLibrary } from "@/app/librerias/my-library-actions";

/**
 * Botón "Comprar" que prioriza la librería principal del lector: si tiene una con
 * enlace propio, compra ahí; si no, cae a Todostuslibros. Se auto-resuelve al montar.
 * Reutilizable en cualquier superficie cliente (ficha in-app, modal de club…).
 */
export function BuyBookButton({
    isbn,
    title,
    className = "",
    fullWidth = false,
}: {
    isbn?: string | null;
    title?: string | null;
    className?: string;
    fullWidth?: boolean;
}) {
    const [primary, setPrimary] = React.useState<PrimaryLibrary | null>(null);
    const [loaded, setLoaded] = React.useState(false);

    React.useEffect(() => {
        let alive = true;
        getMyPrimaryLibrary()
            .then((p) => { if (alive) setPrimary(p); })
            .finally(() => { if (alive) setLoaded(true); });
        return () => { alive = false; };
    }, []);

    // Con librería propia (plantilla utilizable) → su tienda; si no, Todostuslibros.
    const storeUrl = primary?.buyLinkTemplate
        ? buildBuyLink({ template: primary.buyLinkTemplate, isbn, title, fallback: false })
        : null;
    const href = storeUrl ?? buildBuyLink({ template: null, isbn, title });
    const label = storeUrl ? `Comprar en ${primary!.name}` : "Buscar en librerías independientes";
    const accent = storeUrl ? primary?.brandColor || undefined : undefined;

    const base = `inline-flex items-center justify-center gap-2 rounded-full border px-5 py-2.5 text-sm font-semibold transition-colors ${fullWidth ? "w-full" : ""}`;

    if (!loaded) {
        return (
            <span className={`${base} border-teal/15 bg-teal/5 text-teal/50 ${className}`}>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Comprar
            </span>
        );
    }
    if (!href) return null;

    return (
        <a
            href={href}
            target="_blank"
            rel={storeUrl ? "noopener noreferrer sponsored" : "noopener noreferrer"}
            style={accent ? { color: accent, borderColor: accent, backgroundColor: `${accent}14` } : undefined}
            className={`${base} border-teal/25 bg-white text-teal hover:bg-teal/5 ${className}`}
        >
            <ShoppingBag className="h-4 w-4" aria-hidden="true" /> {label}
        </a>
    );
}
