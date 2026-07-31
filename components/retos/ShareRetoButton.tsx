"use client";

import * as React from "react";
import { Share2, Link2, Download, Instagram, Send, Check, X } from "lucide-react";

/** Compartir un reto de comunidad: enlace público /reto-comunidad/[id], imagen, Web Share. */
export function ShareRetoButton({ challengeId, label = "Compartir", className = "" }: { challengeId: string; label?: string; className?: string }) {
    const [open, setOpen] = React.useState(false);
    const [copied, setCopied] = React.useState(false);

    const url = typeof window !== "undefined" ? `${window.location.origin}/reto-comunidad/${challengeId}` : `/reto-comunidad/${challengeId}`;
    const imageUrl = `/reto-comunidad/${challengeId}/image`;
    const canWebShare = typeof navigator !== "undefined" && typeof navigator.share === "function";

    const copy = async () => {
        try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        } catch { /* noop */ }
    };

    const webShare = async () => {
        try {
            await navigator.share({ title: "Reto de lectura en Wordelia", url });
        } catch { /* cancelado */ }
    };

    return (
        <div className="relative">
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                className={`inline-flex items-center gap-1.5 rounded-full border border-teal/20 bg-white px-3 py-1.5 text-sm font-semibold text-teal transition-colors hover:bg-teal/5 ${className}`}
                title="Compartir reto"
                aria-label="Compartir reto"
            >
                <Share2 className="h-4 w-4" /> {label}
            </button>

            {open && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
                    <div className="absolute right-0 z-50 mt-2 w-60 rounded-2xl border border-teal/10 bg-white p-3 shadow-xl">
                        <div className="mb-2 flex items-center justify-between">
                            <span className="text-xs font-bold uppercase tracking-wider text-grey/50">Compartir reto</span>
                            <button type="button" onClick={() => setOpen(false)} className="text-grey/40 hover:text-grey">
                                <X className="h-3.5 w-3.5" />
                            </button>
                        </div>
                        <div className="space-y-1">
                            <button type="button" onClick={copy} className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-teal-dark transition-colors hover:bg-teal/5">
                                {copied ? <Check className="h-4 w-4 text-teal" /> : <Link2 className="h-4 w-4 text-teal" />}
                                {copied ? "¡Enlace copiado!" : "Copiar enlace"}
                            </button>
                            <a href={imageUrl} download="reto-wordelia.png" className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-teal-dark transition-colors hover:bg-teal/5">
                                <Download className="h-4 w-4 text-teal" /> Descargar imagen
                            </a>
                            <a href={`${imageUrl}?format=square`} download="reto-wordelia-instagram.png" className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-teal-dark transition-colors hover:bg-teal/5">
                                <Instagram className="h-4 w-4 text-teal" /> Para Instagram
                            </a>
                            {canWebShare && (
                                <button type="button" onClick={webShare} className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-teal-dark transition-colors hover:bg-teal/5">
                                    <Send className="h-4 w-4 text-teal" /> Compartir…
                                </button>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
