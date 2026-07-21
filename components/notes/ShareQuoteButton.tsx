"use client";

import * as React from "react";
import { Share2, Link2, Download, Send, Globe, Check, Loader2, X, Instagram } from "lucide-react";
import { setNoteVisibilityAction } from "@/app/app/mi-lectura/actions";

/**
 * Botón "Compartir" para una cita. Copiar enlace /cita/[id], descargar imagen y
 * Web Share nativo. Si la cita es privada, ofrece hacerla pública primero.
 */
export function ShareQuoteButton({ noteId, isPrivate }: { noteId: string; isPrivate?: boolean }) {
    const [open, setOpen] = React.useState(false);
    const [priv, setPriv] = React.useState(Boolean(isPrivate));
    const [busy, setBusy] = React.useState(false);
    const [copied, setCopied] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);

    const url = typeof window !== "undefined" ? `${window.location.origin}/cita/${noteId}` : `/cita/${noteId}`;
    const imageUrl = `/cita/${noteId}/image`;
    const canWebShare = typeof navigator !== "undefined" && typeof navigator.share === "function";

    const makePublic = async () => {
        setBusy(true);
        setError(null);
        const res = await setNoteVisibilityAction(noteId, true);
        setBusy(false);
        if (res.error) setError(res.error);
        else setPriv(false);
    };

    const copy = async () => {
        try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        } catch {
            setError("No se pudo copiar.");
        }
    };

    const webShare = async () => {
        try {
            await navigator.share({ title: "Una cita en Wordelia", url });
        } catch {
            /* cancelado por el usuario */
        }
    };

    return (
        <div className="relative">
            <button
                type="button"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-teal/10 bg-white text-grey/50 transition-colors hover:text-teal"
                title="Compartir cita"
                aria-label="Compartir cita"
                onClick={(e) => {
                    e.stopPropagation();
                    setOpen((v) => !v);
                }}
            >
                <Share2 className="h-4 w-4" />
            </button>

            {open && (
                <>
                    {/* Cierre al clicar fuera */}
                    <div className="fixed inset-0 z-40" onClick={(e) => { e.stopPropagation(); setOpen(false); }} />

                    <div
                        onClick={(e) => e.stopPropagation()}
                        className="absolute right-0 z-50 mt-2 w-64 rounded-2xl border border-teal/10 bg-white p-3 shadow-xl"
                    >
                        <div className="mb-2 flex items-center justify-between">
                            <span className="text-xs font-bold uppercase tracking-wider text-grey/50">Compartir cita</span>
                            <button type="button" onClick={() => setOpen(false)} className="text-grey/40 hover:text-grey">
                                <X className="h-3.5 w-3.5" />
                            </button>
                        </div>

                        {priv ? (
                            <div className="space-y-2">
                                <p className="text-xs text-grey/70">Esta cita es privada. Para compartirla, hazla pública.</p>
                                <button
                                    type="button"
                                    onClick={makePublic}
                                    disabled={busy}
                                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-teal px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-teal-dark disabled:opacity-50"
                                >
                                    {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Globe className="h-4 w-4" />}
                                    Hacer pública y compartir
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-1">
                                <button
                                    type="button"
                                    onClick={copy}
                                    className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-teal-dark transition-colors hover:bg-teal/5"
                                >
                                    {copied ? <Check className="h-4 w-4 text-teal" /> : <Link2 className="h-4 w-4 text-teal" />}
                                    {copied ? "¡Enlace copiado!" : "Copiar enlace"}
                                </button>
                                <a
                                    href={imageUrl}
                                    download="cita-wordelia.png"
                                    className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-teal-dark transition-colors hover:bg-teal/5"
                                >
                                    <Download className="h-4 w-4 text-teal" /> Descargar imagen
                                </a>
                                <a
                                    href={`${imageUrl}?format=square`}
                                    download="cita-wordelia-instagram.png"
                                    className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-teal-dark transition-colors hover:bg-teal/5"
                                >
                                    <Instagram className="h-4 w-4 text-teal" /> Descargar para Instagram
                                </a>
                                {canWebShare && (
                                    <button
                                        type="button"
                                        onClick={webShare}
                                        className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-teal-dark transition-colors hover:bg-teal/5"
                                    >
                                        <Send className="h-4 w-4 text-teal" /> Compartir…
                                    </button>
                                )}
                            </div>
                        )}

                        {error && <p className="mt-2 text-xs text-coral">{error}</p>}
                    </div>
                </>
            )}
        </div>
    );
}
