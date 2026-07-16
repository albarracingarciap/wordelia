"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, X } from "lucide-react";

type ResourceStickyCtaProps = {
    source: string;
    message: string;
};

export function ResourceStickyCta({ source, message }: ResourceStickyCtaProps) {
    const [dismissed, setDismissed] = useState(false);

    if (dismissed) return null;

    return (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-teal/10 bg-white/95 px-4 py-3 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] backdrop-blur">
            <div className="mx-auto flex max-w-7xl items-center gap-4">
                <p className="hidden min-w-0 flex-1 text-sm text-grey sm:block">{message}</p>
                <Link
                    href={`/register?source=${source}`}
                    className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl bg-coral px-5 text-sm font-semibold text-white transition-colors hover:bg-[#C25852] sm:ml-auto"
                >
                    Crear cuenta gratis
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
                <button
                    type="button"
                    onClick={() => setDismissed(true)}
                    aria-label="Cerrar"
                    className="shrink-0 rounded-lg p-1.5 text-grey/60 transition-colors hover:bg-cream hover:text-teal"
                >
                    <X className="h-4 w-4" aria-hidden="true" />
                </button>
            </div>
        </div>
    );
}
