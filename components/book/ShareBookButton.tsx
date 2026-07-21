"use client";

import * as React from "react";
import { Share2, Link2, Check } from "lucide-react";

/** Compartir la ficha pública del libro: copiar enlace o Web Share nativo. */
export function ShareBookButton({ title }: { title: string }) {
    const [copied, setCopied] = React.useState(false);
    const canWebShare = typeof navigator !== "undefined" && typeof navigator.share === "function";

    const share = async () => {
        const url = window.location.href;
        if (canWebShare) {
            try {
                await navigator.share({ title, url });
                return;
            } catch {
                /* cancelado */
            }
        }
        try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        } catch {
            /* noop */
        }
    };

    return (
        <button
            type="button"
            onClick={share}
            className="inline-flex items-center gap-2 rounded-full border border-teal/30 bg-white px-4 py-2.5 text-sm font-semibold text-teal transition-colors hover:bg-teal/5"
        >
            {copied ? <Check className="h-4 w-4" /> : canWebShare ? <Share2 className="h-4 w-4" /> : <Link2 className="h-4 w-4" />}
            {copied ? "¡Copiado!" : "Compartir"}
        </button>
    );
}
