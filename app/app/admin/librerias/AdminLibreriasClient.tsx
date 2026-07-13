"use client";

import * as React from "react";
import Link from "next/link";
import { setOrganizationTier } from "./actions";
import type { Organization, OrganizationTier } from "@/types/organizations";

export function AdminLibreriasClient({ organizations }: { organizations: Organization[] }) {
    const [pending, setPending] = React.useState<string | null>(null);
    const [error, setError] = React.useState("");

    const handleSetTier = async (orgId: string, tier: OrganizationTier) => {
        setError("");
        setPending(orgId);
        try {
            const result = await setOrganizationTier(orgId, tier);
            if (result?.error) setError(result.error);
        } finally {
            setPending(null);
        }
    };

    if (organizations.length === 0) {
        return <p className="text-sm text-grey/60">No hay librerías registradas todavía.</p>;
    }

    return (
        <div className="space-y-3">
            {error && <p className="rounded-lg bg-coral/10 px-4 py-2 text-sm text-coral">{error}</p>}
            {organizations.map((org) => {
                const tier = org.subscription?.tier ?? "free";
                const isBusy = pending === org.id;
                return (
                    <div key={org.id} className="flex items-center justify-between gap-4 rounded-xl border border-teal/10 bg-white p-4 shadow-sm">
                        <div className="min-w-0">
                            <Link href={`/librerias/${org.slug}`} className="font-semibold text-teal hover:underline">{org.name}</Link>
                            <p className="truncate text-xs text-grey/60">{[org.city, org.region].filter(Boolean).join(", ") || "—"}</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className={`rounded-full px-3 py-1 text-xs font-bold ${tier === "pro" ? "bg-teal text-white" : "bg-grey/10 text-grey"}`}>
                                {tier === "pro" ? "Pro" : "Gratis"}
                            </span>
                            {tier === "pro" ? (
                                <button
                                    onClick={() => handleSetTier(org.id, "free")}
                                    disabled={isBusy}
                                    className="rounded-lg border border-grey/20 px-3 py-1.5 text-xs font-semibold text-grey hover:bg-grey/5 disabled:opacity-50"
                                >
                                    {isBusy ? "…" : "Pasar a Gratis"}
                                </button>
                            ) : (
                                <button
                                    onClick={() => handleSetTier(org.id, "pro")}
                                    disabled={isBusy}
                                    className="rounded-lg bg-teal px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-dark disabled:opacity-50"
                                >
                                    {isBusy ? "…" : "Activar Pro"}
                                </button>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
