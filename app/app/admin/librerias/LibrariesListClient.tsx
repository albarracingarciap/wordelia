"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { Search, Loader2, Store, ChevronRight, BadgeCheck, Ban, Users } from "lucide-react";
import { searchLibrariesAction } from "./actions";
import type { LibraryListRow, LibraryFilter } from "./data";

const FILTERS: { id: LibraryFilter; label: string }[] = [
    { id: "all", label: "Todas" },
    { id: "pending", label: "Pendientes" },
    { id: "pro", label: "Pro" },
    { id: "suspended", label: "Suspendidas" },
];

function planPill(row: LibraryListRow) {
    if (row.tier === "pro")
        return <span className="text-[11px] font-medium py-0.5 px-1.5 rounded text-teal-dark bg-teal/15">Pro{row.subStatus && row.subStatus !== "active" ? ` · ${row.subStatus}` : ""}</span>;
    return <span className="text-[11px] text-muted-foreground bg-muted py-0.5 px-1.5 rounded">Free</span>;
}

export function LibrariesListClient({ initialLibraries }: { initialLibraries: LibraryListRow[] }) {
    const [libraries, setLibraries] = useState<LibraryListRow[]>(initialLibraries);
    const [query, setQuery] = useState("");
    const [filter, setFilter] = useState<LibraryFilter>("all");
    const [isLoading, setIsLoading] = useState(false);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const load = (q: string, f: LibraryFilter) => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(async () => {
            setIsLoading(true);
            try {
                const { libraries: res, error } = await searchLibrariesAction(q, f);
                if (!error && res) setLibraries(res);
            } finally {
                setIsLoading(false);
            }
        }, 350);
    };

    return (
        <div className="bg-card rounded-xl border border-teal/10 shadow-sm flex flex-col">
            <div className="p-4 md:p-6 border-b border-teal/10 space-y-3">
                <div className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Buscar por nombre, ciudad o slug..."
                        className="w-full pl-9 pr-9 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-teal/30"
                        value={query}
                        onChange={(e) => {
                            setQuery(e.target.value);
                            load(e.target.value, filter);
                        }}
                    />
                    {isLoading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-teal" />}
                </div>
                <div className="flex flex-wrap gap-2">
                    {FILTERS.map((f) => (
                        <button
                            key={f.id}
                            onClick={() => {
                                setFilter(f.id);
                                load(query, f.id);
                            }}
                            className={`text-xs font-medium py-1.5 px-3 rounded-md transition-colors ${
                                filter === f.id ? "bg-teal text-white" : "bg-muted text-muted-foreground hover:bg-muted/70"
                            }`}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="overflow-x-auto min-h-[300px]">
                {libraries.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                        <Store className="w-8 h-8 mx-auto mb-2 opacity-40" />
                        <p>No hay librerías.</p>
                    </div>
                ) : (
                    <table className="w-full text-sm text-left whitespace-nowrap">
                        <thead className="bg-muted/50 text-muted-foreground">
                            <tr>
                                <th className="px-6 py-3 font-medium">Librería</th>
                                <th className="px-6 py-3 font-medium">Propietario</th>
                                <th className="px-6 py-3 font-medium">Plan</th>
                                <th className="px-6 py-3 font-medium"><Users className="inline w-3.5 h-3.5 mr-1" />Clubs</th>
                                <th className="px-6 py-3 font-medium">Estado</th>
                                <th className="px-4 py-3" />
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-teal/5">
                            {libraries.map((l) => (
                                <tr key={l.id} className="hover:bg-muted/30 transition-colors group">
                                    <td className="px-6 py-3">
                                        <Link href={`/app/admin/librerias/${l.id}`} className="flex flex-col">
                                            <span className="font-medium text-foreground group-hover:text-teal-dark transition-colors flex items-center gap-1.5">
                                                {l.name}
                                                {l.verified && <BadgeCheck className="w-3.5 h-3.5 text-teal" />}
                                            </span>
                                            <span className="text-xs text-muted-foreground">{l.city || "—"}</span>
                                        </Link>
                                    </td>
                                    <td className="px-6 py-3 text-muted-foreground">
                                        {l.ownerName || l.ownerEmail || "—"}
                                    </td>
                                    <td className="px-6 py-3">{planPill(l)}</td>
                                    <td className="px-6 py-3 text-muted-foreground">{l.clubsCount}</td>
                                    <td className="px-6 py-3">
                                        {!l.isActive ? (
                                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-coral bg-coral/10 py-0.5 px-1.5 rounded">
                                                <Ban className="w-3 h-3" /> Suspendida
                                            </span>
                                        ) : l.verified ? (
                                            <span className="text-[11px] font-medium text-teal-dark bg-teal/15 py-0.5 px-1.5 rounded">Verificada</span>
                                        ) : (
                                            <span className="text-[11px] font-medium text-amber-700 bg-amber-100 py-0.5 px-1.5 rounded">Pendiente</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <Link
                                            href={`/app/admin/librerias/${l.id}`}
                                            className="inline-flex text-muted-foreground group-hover:text-teal transition-colors"
                                            aria-label="Abrir ficha"
                                        >
                                            <ChevronRight className="w-4 h-4" />
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
