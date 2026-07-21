"use client";

import * as React from "react";
import { Search, Loader2, Store, MapPin } from "lucide-react";
import Link from "next/link";
import { LibreriaCard } from "@/components/librerias/LibreriaCard";
import { MyLibraryCardToggle } from "@/components/librerias/MyLibraryCardToggle";
import { getOrganizations } from "@/app/app/librerias/actions";
import type { MyLibrary } from "@/app/librerias/my-library-actions";
import type { Organization } from "@/types/organizations";

export function LibrariesSearch({
    initialOrganizations,
    adopted = [],
    showAdopt = false,
    hrefBase = "/librerias",
}: {
    initialOrganizations: Organization[];
    adopted?: MyLibrary[];
    showAdopt?: boolean;
    hrefBase?: string;
}) {
    const primaryByOrg = React.useMemo(() => {
        const m = new Map<string, boolean>();
        for (const a of adopted) m.set(a.organizationId, a.isPrimary);
        return m;
    }, [adopted]);
    const [orgs, setOrgs] = React.useState<Organization[]>(initialOrganizations);
    const [query, setQuery] = React.useState("");
    const [loading, setLoading] = React.useState(false);
    const [region, setRegion] = React.useState<string | null>(null);
    const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

    // Provincias disponibles (a partir del universo completo de librerías) para el
    // filtro local. Descubrimiento local sin geolocalización: "compra en tu zona".
    const regions = React.useMemo(
        () => [...new Set(initialOrganizations.map((o) => o.region).filter(Boolean) as string[])].sort((a, b) => a.localeCompare(b)),
        [initialOrganizations],
    );

    const displayed = region ? orgs.filter((o) => o.region === region) : orgs;

    const onQuery = (val: string) => {
        setQuery(val);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(async () => {
            setLoading(true);
            try {
                setOrgs(await getOrganizations(val));
            } finally {
                setLoading(false);
            }
        }, 350);
    };

    return (
        <div>
            <div className="relative mx-auto mb-8 max-w-md">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-grey/40" />
                <input
                    value={query}
                    onChange={(e) => onQuery(e.target.value)}
                    placeholder="Buscar por nombre o ciudad…"
                    className="w-full rounded-full border border-teal/15 bg-white py-2.5 pl-10 pr-10 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-teal/25"
                />
                {loading && <Loader2 className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-teal" />}
            </div>

            {regions.length > 1 && (
                <div className="mb-6 flex flex-wrap items-center justify-center gap-2">
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-grey/40">
                        <MapPin className="h-3.5 w-3.5" aria-hidden="true" /> Provincia:
                    </span>
                    <button
                        onClick={() => setRegion(null)}
                        className={`rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${region === null ? "border-teal bg-teal text-white" : "border-teal/15 bg-white text-teal hover:bg-teal/5"}`}
                    >
                        Todas
                    </button>
                    {regions.map((r) => (
                        <button
                            key={r}
                            onClick={() => setRegion(r)}
                            className={`rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${region === r ? "border-teal bg-teal text-white" : "border-teal/15 bg-white text-teal hover:bg-teal/5"}`}
                        >
                            {r}
                        </button>
                    ))}
                </div>
            )}

            {displayed.length > 0 ? (
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {displayed.map((org) => (
                        <div key={org.id} className="relative">
                            {showAdopt && (
                                <MyLibraryCardToggle
                                    orgId={org.id}
                                    initialIsMine={primaryByOrg.has(org.id)}
                                    initialIsPrimary={primaryByOrg.get(org.id) ?? false}
                                />
                            )}
                            <LibreriaCard organization={org} hrefBase={hrefBase} />
                        </div>
                    ))}
                </div>
            ) : (
                <div className="rounded-2xl border border-dashed border-teal/15 bg-white/50 py-16 text-center">
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-teal/5 text-teal/40">
                        <Store className="h-6 w-6" aria-hidden="true" />
                    </div>
                    <p className="text-grey/70">
                        {region ? `Aún no hay librerías en ${region}.` : query ? "No encontramos librerías con esa búsqueda." : "Aún no hay librerías publicadas."}
                    </p>
                    {region && (
                        <button onClick={() => setRegion(null)} className="mt-3 inline-flex text-sm font-semibold text-teal hover:text-coral">
                            Ver todas las provincias
                        </button>
                    )}
                    {!query && !region && (
                        <Link href="/app/librerias" className="mt-4 inline-flex text-sm font-semibold text-teal hover:text-coral">
                            ¿Tienes una librería? Regístrala aquí
                        </Link>
                    )}
                </div>
            )}
        </div>
    );
}
