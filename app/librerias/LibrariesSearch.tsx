"use client";

import * as React from "react";
import { Search, Loader2, Store } from "lucide-react";
import Link from "next/link";
import { LibreriaCard } from "@/components/librerias/LibreriaCard";
import { getOrganizations } from "@/app/app/librerias/actions";
import type { Organization } from "@/types/organizations";

export function LibrariesSearch({ initialOrganizations }: { initialOrganizations: Organization[] }) {
    const [orgs, setOrgs] = React.useState<Organization[]>(initialOrganizations);
    const [query, setQuery] = React.useState("");
    const [loading, setLoading] = React.useState(false);
    const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

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

            {orgs.length > 0 ? (
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {orgs.map((org) => (
                        <LibreriaCard key={org.id} organization={org} />
                    ))}
                </div>
            ) : (
                <div className="rounded-2xl border border-dashed border-teal/15 bg-white/50 py-16 text-center">
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-teal/5 text-teal/40">
                        <Store className="h-6 w-6" aria-hidden="true" />
                    </div>
                    <p className="text-grey/70">
                        {query ? "No encontramos librerías con esa búsqueda." : "Aún no hay librerías publicadas."}
                    </p>
                    {!query && (
                        <Link href="/app/librerias" className="mt-4 inline-flex text-sm font-semibold text-teal hover:text-coral">
                            ¿Tienes una librería? Regístrala aquí
                        </Link>
                    )}
                </div>
            )}
        </div>
    );
}
