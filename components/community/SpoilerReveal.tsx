"use client";

import * as React from "react";
import { EyeOff, Eye } from "lucide-react";

/**
 * Envuelve contenido que puede contener spoilers: lo difumina hasta que el lector
 * decide mostrarlo. Coherente con el enfoque spoiler-safe de Wordelia.
 */
export function SpoilerReveal({ children }: { children: React.ReactNode }) {
    const [revealed, setRevealed] = React.useState(false);

    if (revealed) {
        return (
            <div className="relative">
                {children}
                <button
                    onClick={() => setRevealed(false)}
                    className="mt-1 inline-flex items-center gap-1 text-[11px] font-medium text-grey/40 hover:text-teal"
                >
                    <EyeOff className="h-3 w-3" /> Ocultar spoiler
                </button>
            </div>
        );
    }

    return (
        <div className="relative overflow-hidden rounded-xl">
            <div className="pointer-events-none select-none blur-md" aria-hidden="true">{children}</div>
            <button
                onClick={() => setRevealed(true)}
                className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-teal-dark/5 text-center"
            >
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-bold text-coral shadow-sm">
                    <Eye className="h-3.5 w-3.5" /> Puede contener spoilers — mostrar
                </span>
            </button>
        </div>
    );
}
