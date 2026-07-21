"use client";

import * as React from "react";
import { buildBuyLink } from "@/lib/buy-link";

// Libro de ejemplo para la previsualización (un clásico con ISBN real).
const SAMPLE = { isbn: "9788420471839", title: "Cien años de soledad" };

/**
 * Campo para la plantilla de enlace de compra de una librería, con ayuda inline,
 * botones para insertar los comodines {isbn}/{title} en el cursor, aviso de validez
 * y previsualización en vivo del enlace que verá un comprador. Controlado por el
 * formulario padre (value/onChange). Se usa en el panel del dueño y en el de admin.
 */
export function BuyLinkTemplateField({
    value,
    onChange,
    label = "Enlace de compra de tu tienda",
}: {
    value: string;
    onChange: (v: string) => void;
    label?: string;
}) {
    const ref = React.useRef<HTMLInputElement>(null);

    const insert = (token: string) => {
        const el = ref.current;
        if (!el) {
            onChange(value + token);
            return;
        }
        const start = el.selectionStart ?? value.length;
        const end = el.selectionEnd ?? value.length;
        onChange(value.slice(0, start) + token + value.slice(end));
        requestAnimationFrame(() => {
            el.focus();
            const pos = start + token.length;
            el.setSelectionRange(pos, pos);
        });
    };

    const trimmed = value.trim();
    const hasPlaceholder = /\{isbn\}|\{title\}/.test(value);
    const looksUrl = /^https?:\/\//i.test(trimmed);
    const preview = trimmed ? buildBuyLink({ template: value, isbn: SAMPLE.isbn, title: SAMPLE.title, fallback: false }) : null;

    const warning = trimmed && !looksUrl
        ? "El enlace debería empezar por https://"
        : trimmed && !hasPlaceholder
            ? "Sin {isbn} ni {title}, todos los libros llevarán a la misma página."
            : null;

    return (
        <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-grey/60">{label}</label>

            <input
                ref={ref}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder="https://tulibreria.com/buscar?isbn={isbn}"
                spellCheck={false}
                className="w-full rounded-lg border border-teal/15 bg-white px-3 py-2 text-sm text-teal-dark shadow-sm transition-colors focus:border-teal/40 focus:outline-none focus:ring-2 focus:ring-teal/15"
            />

            <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className="text-xs text-grey/50">Insertar:</span>
                {(["{isbn}", "{title}"] as const).map((token) => (
                    <button
                        key={token}
                        type="button"
                        onClick={() => insert(token)}
                        className="inline-flex items-center rounded-full border border-teal/20 bg-teal/5 px-2.5 py-1 font-mono text-xs font-semibold text-teal transition-colors hover:bg-teal/10"
                    >
                        {token}
                    </button>
                ))}
            </div>

            <p className="mt-2 text-xs leading-relaxed text-grey/55">
                Pega la URL de búsqueda de tu web y marca con <span className="font-mono text-teal">{"{isbn}"}</span> y/o{" "}
                <span className="font-mono text-teal">{"{title}"}</span> dónde va cada libro; Wordelia los sustituye al generar el
                botón «Comprar». Si lo dejas vacío, enlazamos a Todostuslibros (la red de librerías independientes).
            </p>

            {warning && <p className="mt-1.5 text-xs font-medium text-coral">{warning}</p>}

            {preview ? (
                <div className="mt-3 rounded-lg border border-teal/10 bg-teal/[0.03] p-3">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-grey/40">
                        Ejemplo con «{SAMPLE.title}»
                    </p>
                    <a
                        href={preview}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 block break-all text-xs font-medium text-teal hover:underline"
                    >
                        {preview}
                    </a>
                </div>
            ) : (
                !trimmed && (
                    <p className="mt-3 rounded-lg border border-dashed border-teal/15 bg-teal/[0.03] p-3 text-xs text-grey/50">
                        Vacío → los compradores irán a <span className="font-medium text-teal">Todostuslibros.com</span>, la red de
                        librerías independientes de España.
                    </p>
                )
            )}
        </div>
    );
}
