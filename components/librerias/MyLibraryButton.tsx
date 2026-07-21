"use client";

import * as React from "react";
import Link from "next/link";
import { Store, Check, Star, Loader2 } from "lucide-react";
import { toggleMyLibrary, setPrimaryLibrary, type MyLibraryState } from "@/app/librerias/my-library-actions";

export function MyLibraryButton({
    orgId,
    initial,
    returnTo,
    brandColor,
}: {
    orgId: string;
    initial: MyLibraryState;
    returnTo: string;
    brandColor?: string | null;
}) {
    const [state, setState] = React.useState<MyLibraryState>(initial);
    const [pending, startTransition] = React.useTransition();
    const [error, setError] = React.useState<string | null>(null);

    const run = (fn: () => Promise<MyLibraryState | { error: string }>) => {
        setError(null);
        startTransition(async () => {
            const res = await fn();
            if ("error" in res) setError(res.error);
            else setState(res);
        });
    };

    // Sin sesión: llevar a login y volver aquí.
    if (!state.isAuthed) {
        return (
            <Link
                href={`/login?next=${encodeURIComponent(returnTo)}`}
                className="inline-flex items-center gap-2 rounded-full border border-teal/25 bg-white px-4 py-2 text-sm font-semibold text-teal transition-colors hover:bg-teal/5"
            >
                <Store className="h-4 w-4" aria-hidden="true" /> Hacer mi librería
            </Link>
        );
    }

    const accent = brandColor || undefined;

    // No adoptada aún.
    if (!state.isMine) {
        return (
            <div className="flex flex-col gap-1.5">
                <button
                    type="button"
                    disabled={pending}
                    onClick={() => run(() => toggleMyLibrary(orgId))}
                    style={accent ? { backgroundColor: accent } : undefined}
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-teal px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-teal-dark disabled:opacity-60"
                >
                    {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Store className="h-4 w-4" aria-hidden="true" />}
                    Hacer mi librería
                </button>
                {error && <p className="text-xs font-medium text-coral">{error}</p>}
            </div>
        );
    }

    // Adoptada: estado + acciones.
    return (
        <div className="flex flex-col gap-1.5">
            <div className="flex flex-wrap items-center gap-2">
                <span
                    style={accent ? { color: accent, borderColor: accent, backgroundColor: `${accent}14` } : undefined}
                    className="inline-flex items-center gap-1.5 rounded-full border border-teal/25 bg-teal/5 px-4 py-2 text-sm font-semibold text-teal"
                >
                    {state.isPrimary ? <Star className="h-4 w-4 fill-current" aria-hidden="true" /> : <Check className="h-4 w-4" aria-hidden="true" />}
                    {state.isPrimary ? "Tu librería principal" : "Es tu librería"}
                </span>

                {!state.isPrimary && (
                    <button
                        type="button"
                        disabled={pending}
                        onClick={() => run(() => setPrimaryLibrary(orgId))}
                        className="inline-flex items-center gap-1.5 rounded-full border border-teal/20 bg-white px-3 py-2 text-xs font-semibold text-teal transition-colors hover:bg-teal/5 disabled:opacity-60"
                    >
                        {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Star className="h-3.5 w-3.5" aria-hidden="true" />}
                        Hacer principal
                    </button>
                )}

                <button
                    type="button"
                    disabled={pending}
                    onClick={() => run(() => toggleMyLibrary(orgId))}
                    className="text-xs font-medium text-grey/50 underline underline-offset-2 transition-colors hover:text-coral disabled:opacity-60"
                >
                    Quitar
                </button>
            </div>
            {error && <p className="text-xs font-medium text-coral">{error}</p>}
        </div>
    );
}
