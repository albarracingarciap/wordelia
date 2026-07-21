"use client";

import * as React from "react";
import { Store, Check, Star, Loader2 } from "lucide-react";
import { toggleMyLibrary } from "@/app/librerias/my-library-actions";

/**
 * Toggle compacto de "mi librería" para las tarjetas del directorio. Se superpone
 * en la esquina de la portada (hermano del <Link> de la tarjeta, no anidado).
 */
export function MyLibraryCardToggle({
    orgId,
    initialIsMine,
    initialIsPrimary,
}: {
    orgId: string;
    initialIsMine: boolean;
    initialIsPrimary: boolean;
}) {
    const [isMine, setIsMine] = React.useState(initialIsMine);
    const [isPrimary, setIsPrimary] = React.useState(initialIsPrimary);
    const [pending, startTransition] = React.useTransition();

    const onClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        startTransition(async () => {
            const res = await toggleMyLibrary(orgId);
            if (!("error" in res)) {
                setIsMine(res.isMine);
                setIsPrimary(res.isPrimary);
            }
        });
    };

    const label = isMine ? (isPrimary ? "Tu librería principal — quitar" : "Es tu librería — quitar") : "Hacer mi librería";
    const Icon = pending ? Loader2 : isMine ? (isPrimary ? Star : Check) : Store;

    return (
        <button
            type="button"
            onClick={onClick}
            disabled={pending}
            title={label}
            aria-label={label}
            aria-pressed={isMine}
            className={`absolute right-2 top-2 z-10 inline-flex h-9 w-9 items-center justify-center rounded-full border shadow-sm backdrop-blur transition-colors disabled:opacity-60 ${
                isMine
                    ? "border-teal/30 bg-teal text-white hover:bg-teal-dark"
                    : "border-teal/15 bg-white/85 text-teal hover:bg-white"
            }`}
        >
            <Icon className={`h-4 w-4 ${pending ? "animate-spin" : isPrimary ? "fill-current" : ""}`} aria-hidden="true" />
        </button>
    );
}
