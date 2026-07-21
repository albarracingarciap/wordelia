"use client";

import * as React from "react";
import { Search, Loader2, Users, ChevronLeft, ChevronRight } from "lucide-react";
import { listReadersAction, type Person } from "@/app/app/perfil/follow-actions";
import { PersonRow } from "./PersonRow";

export function PeopleDiscover() {
    const [q, setQ] = React.useState("");
    const [debouncedQ, setDebouncedQ] = React.useState("");
    const [page, setPage] = React.useState(0);
    const [people, setPeople] = React.useState<Person[]>([]);
    const [hasMore, setHasMore] = React.useState(false);
    const [loading, setLoading] = React.useState(true);

    // Debounce del texto de búsqueda.
    React.useEffect(() => {
        const t = setTimeout(() => setDebouncedQ(q.trim()), 350);
        return () => clearTimeout(t);
    }, [q]);

    // Al cambiar la búsqueda, volvemos a la primera página.
    React.useEffect(() => {
        setPage(0);
    }, [debouncedQ]);

    // Carga la página actual.
    React.useEffect(() => {
        let active = true;
        setLoading(true);
        listReadersAction(debouncedQ, page)
            .then((res) => {
                if (!active) return;
                setPeople(res.people);
                setHasMore(res.hasMore);
            })
            .finally(() => {
                if (active) setLoading(false);
            });
        return () => {
            active = false;
        };
    }, [debouncedQ, page]);

    const isSearch = debouncedQ.length >= 2;

    return (
        <div className="rounded-2xl border border-teal/10 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
                <Users className="h-4 w-4 text-teal" />
                <h2 className="font-serif text-lg text-teal-dark">Descubre lectores</h2>
            </div>

            <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-grey/40" />
                <input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Buscar por nombre o @usuario…"
                    className="w-full rounded-lg border border-input bg-background py-2 pl-9 pr-9 text-sm focus:outline-none focus:ring-2 focus:ring-teal/30"
                />
                {loading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-teal" />}
            </div>

            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-grey/40">{isSearch ? "Resultados" : "Lectores"}</p>

            {people.length === 0 ? (
                <p className="py-6 text-center text-sm text-grey/50">
                    {loading ? "Cargando…" : isSearch ? "Sin resultados." : "No hay lectores todavía."}
                </p>
            ) : (
                <div className="space-y-3">
                    {people.map((p) => (
                        <PersonRow key={p.id} person={p} />
                    ))}
                </div>
            )}

            {/* Paginador */}
            {(page > 0 || hasMore) && (
                <div className="mt-4 flex items-center justify-between border-t border-teal/5 pt-3">
                    <button
                        type="button"
                        onClick={() => setPage((p) => Math.max(0, p - 1))}
                        disabled={page === 0 || loading}
                        className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium text-teal transition-colors hover:bg-teal/5 disabled:opacity-40"
                    >
                        <ChevronLeft className="h-4 w-4" /> Anterior
                    </button>
                    <span className="text-xs font-semibold text-grey/50">Página {page + 1}</span>
                    <button
                        type="button"
                        onClick={() => setPage((p) => p + 1)}
                        disabled={!hasMore || loading}
                        className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium text-teal transition-colors hover:bg-teal/5 disabled:opacity-40"
                    >
                        Siguiente <ChevronRight className="h-4 w-4" />
                    </button>
                </div>
            )}
        </div>
    );
}
