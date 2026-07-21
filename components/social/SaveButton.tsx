"use client";

import * as React from "react";
import { Bookmark } from "lucide-react";
import { toggleSaved, isSaved as checkSaved } from "@/app/app/guardados/actions";

type ItemType = "activity" | "book" | "quote";

/**
 * Botón "Guardar" (marcador privado). Distinto del corazón (me gusta público).
 * Si no se pasa `initialSaved`, consulta su estado al montar (útil en páginas sueltas
 * como la ficha de libro o /cita/[id]). Sin sesión, redirige a login.
 */
export function SaveButton({
    itemType,
    itemId,
    initialSaved,
    variant = "icon",
    label,
}: {
    itemType: ItemType;
    itemId: string;
    initialSaved?: boolean;
    variant?: "icon" | "pill";
    label?: string;
}) {
    const [saved, setSaved] = React.useState(!!initialSaved);
    const [pending, setPending] = React.useState(false);

    React.useEffect(() => {
        if (initialSaved !== undefined) return;
        let alive = true;
        checkSaved(itemType, itemId).then((s) => { if (alive) setSaved(s); }).catch(() => {});
        return () => { alive = false; };
    }, [itemType, itemId, initialSaved]);

    const toggle = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (pending) return;
        const next = !saved;
        setSaved(next);
        setPending(true);
        const res = await toggleSaved(itemType, itemId);
        setPending(false);
        if ("error" in res) {
            setSaved(!next); // revertir
            if (res.error?.toLowerCase().includes("sesión") && typeof window !== "undefined") {
                window.location.href = `/login?next=${encodeURIComponent(window.location.pathname)}`;
            }
        } else {
            setSaved(res.saved);
        }
    };

    if (variant === "pill") {
        return (
            <button
                onClick={toggle}
                aria-pressed={saved}
                className={`inline-flex items-center justify-center gap-2 rounded-full border px-5 py-2.5 text-sm font-semibold transition-colors ${
                    saved ? "border-teal bg-teal/5 text-teal" : "border-teal/25 bg-white text-teal hover:bg-teal/5"
                }`}
            >
                <Bookmark className={`h-4 w-4 ${saved ? "fill-current" : ""}`} /> {label ?? (saved ? "Guardado" : "Guardar")}
            </button>
        );
    }

    return (
        <button
            onClick={toggle}
            title={saved ? "Guardado — quitar" : "Guardar"}
            aria-pressed={saved}
            className={`flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-medium transition-colors ${
                saved ? "bg-teal/10 text-teal" : "text-grey/40 hover:bg-teal/5 hover:text-teal"
            }`}
        >
            <Bookmark className={`h-3 w-3 ${saved ? "fill-current" : ""}`} />
        </button>
    );
}
