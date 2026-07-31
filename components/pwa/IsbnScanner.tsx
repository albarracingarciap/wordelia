"use client";

import * as React from "react";
import { Loader2, X } from "lucide-react";
import { useBarcodeScanner } from "./useBarcodeScanner";

// ISBN = EAN-13 (978/979). Aceptamos 13 dígitos; también ISBN-10 por si acaso.
function normalizeIsbn(raw: string): string | null {
    const digits = raw.replace(/[^0-9Xx]/g, "");
    if (/^\d{13}$/.test(digits)) return digits;
    if (/^\d{9}[0-9Xx]$/.test(digits)) return digits.toUpperCase();
    return null;
}

interface IsbnScannerProps {
    onDetected: (isbn: string) => void;
    onClose: () => void;
}

export function IsbnScanner({ onDetected, onClose }: IsbnScannerProps) {
    const videoRef = React.useRef<HTMLVideoElement | null>(null);
    const doneRef = React.useRef(false);

    const { error, loading } = useBarcodeScanner(videoRef, (raw) => {
        if (doneRef.current) return;
        const isbn = normalizeIsbn(raw);
        if (!isbn) return;
        doneRef.current = true;
        try {
            navigator.vibrate?.(60);
        } catch {
            /* sin vibración: da igual */
        }
        onDetected(isbn);
    });

    return (
        <div className="fixed inset-0 z-[60] flex flex-col bg-black">
            {/* Barra superior */}
            <div className="flex items-center justify-between px-4 pt-[calc(env(safe-area-inset-top)+0.75rem)] pb-3 text-white">
                <span className="text-sm font-semibold">Escanear ISBN</span>
                <button
                    onClick={onClose}
                    className="rounded-full bg-white/15 p-2 text-white transition-colors hover:bg-white/25"
                    aria-label="Cerrar"
                >
                    <X className="h-5 w-5" />
                </button>
            </div>

            {/* Cámara */}
            <div className="relative flex-1 overflow-hidden">
                <video ref={videoRef} className="h-full w-full object-cover" muted playsInline />

                {loading && !error && (
                    <div className="absolute inset-0 flex items-center justify-center text-white/80">
                        <Loader2 className="h-8 w-8 animate-spin" />
                    </div>
                )}

                {/* Marco guía */}
                {!error && (
                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                        <div className="h-32 w-4/5 max-w-sm rounded-2xl border-2 border-white/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]" />
                    </div>
                )}

                {error && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-8 text-center">
                        <p className="text-sm text-white/90">{error}</p>
                        <button
                            onClick={onClose}
                            className="rounded-full bg-white px-5 py-2 text-sm font-bold text-teal-dark"
                        >
                            Cerrar
                        </button>
                    </div>
                )}
            </div>

            {!error && (
                <p className="px-6 pb-[calc(env(safe-area-inset-bottom)+1.25rem)] pt-4 text-center text-xs text-white/70">
                    Apunta al código de barras del libro. Se detectará solo.
                </p>
            )}
        </div>
    );
}
