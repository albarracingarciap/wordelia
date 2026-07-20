"use client";

import * as React from "react";
import { X, Info, AlertTriangle } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { isAnnouncementLive, type AnnouncementLike } from "@/lib/announcement";

// Guarda el último mensaje descartado: si el admin cambia el texto, vuelve a salir.
const DISMISS_KEY = "wordelia_announcement_dismissed";

/**
 * Aviso global configurable desde /app/admin/ajustes?tab=general (tabla
 * app_settings, clave `announcement`). La RLS deja leer públicamente solo esa fila.
 * Se oculta si está deshabilitado, sin texto, caducado o descartado por el usuario.
 */
export function GlobalAnnouncementBanner() {
    const [announcement, setAnnouncement] = React.useState<AnnouncementLike | null>(null);

    React.useEffect(() => {
        let active = true;
        const supabase = createClient();

        (async () => {
            const { data } = await supabase
                .from("app_settings")
                .select("value")
                .eq("key", "announcement")
                .maybeSingle();

            const a = (data?.value ?? null) as AnnouncementLike | null;
            if (!active || !isAnnouncementLive(a)) return;

            if (typeof window !== "undefined") {
                const dismissed = window.localStorage.getItem(DISMISS_KEY);
                if (dismissed && dismissed === a?.message) return;
            }
            setAnnouncement(a);
        })();

        return () => {
            active = false;
        };
    }, []);

    if (!announcement) return null;

    const isWarning = announcement.variant === "warning";

    const dismiss = () => {
        if (typeof window !== "undefined" && announcement.message) {
            window.localStorage.setItem(DISMISS_KEY, announcement.message);
        }
        setAnnouncement(null);
    };

    return (
        <div
            className={`mb-4 flex items-center gap-3 rounded-2xl border px-4 py-3 ${
                isWarning ? "border-coral/25 bg-coral/5" : "border-teal/25 bg-teal/5"
            }`}
        >
            {isWarning ? (
                <AlertTriangle className="h-4 w-4 shrink-0 text-coral" aria-hidden="true" />
            ) : (
                <Info className="h-4 w-4 shrink-0 text-teal" aria-hidden="true" />
            )}
            <p className={`min-w-0 flex-1 text-sm ${isWarning ? "text-coral" : "text-teal-dark"}`}>
                {announcement.message}
            </p>
            <button
                type="button"
                onClick={dismiss}
                aria-label="Descartar aviso"
                className="shrink-0 rounded-full p-1 text-grey/50 transition-colors hover:bg-grey/10 hover:text-grey"
            >
                <X className="h-4 w-4" aria-hidden="true" />
            </button>
        </div>
    );
}
