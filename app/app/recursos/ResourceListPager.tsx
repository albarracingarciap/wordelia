"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, ShieldCheck, Search } from "lucide-react";
import type { ResourceAccessState, ResourceBook, ResourceKind } from "./actions";

export type ResourceListPagerItem = {
    book: ResourceBook;
    access: ResourceAccessState;
    href: string;
};

const pageSize = 10;

function accessLabel(access: ResourceAccessState) {
    if (access === "admin") return "Admin";
    if (access === "granted") return "Acceso activo";
    if (access === "requires_plan") return "Plan o compra";
    return "Bloqueado";
}

/** Normaliza para buscar sin distinguir mayúsculas ni acentos. */
function normalize(value: string) {
    return value.toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "");
}

export function ResourceListPager({ items }: { kind: ResourceKind; items: ResourceListPagerItem[] }) {
    const [page, setPage] = React.useState(1);
    const [query, setQuery] = React.useState("");

    const needle = normalize(query.trim());
    const filtered = React.useMemo(() => {
        if (!needle) return items;
        return items.filter(
            (item) => normalize(item.book.title).includes(needle) || normalize(item.book.author || "").includes(needle)
        );
    }, [items, needle]);

    // Al cambiar la búsqueda, vuelve a la primera página.
    React.useEffect(() => { setPage(1); }, [needle]);

    const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
    const currentPage = Math.min(page, pageCount);
    const start = (currentPage - 1) * pageSize;
    const visibleItems = filtered.slice(start, start + pageSize);

    return (
        <div className="space-y-4">
            <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-grey/40" aria-hidden="true" />
                <input
                    type="search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Buscar por título o autor…"
                    className="w-full rounded-xl border border-teal/15 bg-white py-2.5 pl-9 pr-3 text-sm outline-none transition-colors focus:border-teal/40"
                />
            </div>

            {filtered.length === 0 ? (
                <div className="rounded-xl border border-teal/10 bg-white p-6 text-center text-sm text-grey/60 shadow-sm">
                    No hay resultados para “{query}”.
                </div>
            ) : (
            <>
            <div className="grid gap-3">
                {visibleItems.map((item) => (
                    <Link key={item.href} href={item.href} className="rounded-xl border border-teal/10 bg-white p-4 shadow-sm transition-colors hover:border-teal/25 hover:bg-teal/5">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="min-w-0">
                                <p className="truncate text-lg font-semibold text-teal-dark">{item.book.title}</p>
                                <p className="truncate text-sm text-coral">{item.book.author || "Autor desconocido"}</p>
                            </div>
                            <span className="inline-flex w-fit items-center gap-2 rounded-lg bg-teal/5 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-teal">
                                {item.access === "admin" ? <ShieldCheck className="h-3.5 w-3.5" /> : null}
                                {accessLabel(item.access)}
                            </span>
                        </div>
                    </Link>
                ))}
            </div>

            {filtered.length > pageSize && (
                <div className="flex flex-col gap-3 rounded-xl border border-teal/10 bg-white px-4 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-grey">
                        Mostrando <span className="font-semibold text-teal">{start + 1}</span>-
                        <span className="font-semibold text-teal">{Math.min(start + pageSize, filtered.length)}</span> de{" "}
                        <span className="font-semibold text-teal">{filtered.length}</span>
                    </p>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setPage((value) => Math.max(1, value - 1))}
                            disabled={currentPage === 1}
                            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-teal/20 px-4 text-sm font-semibold text-teal transition-colors hover:bg-teal hover:text-white disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-teal"
                        >
                            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                            Anterior
                        </button>
                        <span className="px-2 text-sm font-semibold text-grey">
                            {currentPage}/{pageCount}
                        </span>
                        <button
                            type="button"
                            onClick={() => setPage((value) => Math.min(pageCount, value + 1))}
                            disabled={currentPage === pageCount}
                            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-teal px-4 text-sm font-semibold text-white transition-colors hover:bg-teal-dark disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            Siguiente
                            <ChevronRight className="h-4 w-4" aria-hidden="true" />
                        </button>
                    </div>
                </div>
            )}
            </>
            )}
        </div>
    );
}
