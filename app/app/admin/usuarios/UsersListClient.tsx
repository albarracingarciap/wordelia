"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import { Search, Loader2, ShieldAlert, Shield, User, ChevronRight } from "lucide-react";
import { searchUsersAction } from "./actions";
import type { AdminUserRow } from "./data";
import { isSubscriptionActive } from "@/lib/subscription-access";
import {
    planLabel,
    subscriptionStatusLabel,
    subscriptionStatusClasses,
} from "@/lib/subscription-display";

function roleBadge(role: string | null) {
    if (role === "admin")
        return (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-coral bg-coral/10 py-1 px-2 rounded-md">
                <ShieldAlert className="w-3 h-3" /> Admin
            </span>
        );
    if (role === "editor")
        return (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-teal-dark bg-teal/20 py-1 px-2 rounded-md">
                <Shield className="w-3 h-3" /> Editor
            </span>
        );
    return (
        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground py-1 px-2 rounded-md">
            <User className="w-3 h-3" /> Usuario
        </span>
    );
}

function planPill(sub: AdminUserRow["subscription"]) {
    if (!sub) {
        return <span className="text-xs text-muted-foreground bg-muted py-1 px-2 rounded-md">Gratis</span>;
    }
    const active = isSubscriptionActive(sub.status, sub.current_period_end);
    return (
        <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground">{planLabel(sub.plan)}</span>
            <span
                className={`text-[11px] font-medium py-0.5 px-1.5 rounded ${subscriptionStatusClasses(sub.status)} ${
                    active ? "" : "opacity-80"
                }`}
            >
                {subscriptionStatusLabel(sub.status)}
            </span>
        </div>
    );
}

function formatDate(iso: string | null) {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" });
}

export function UsersListClient({ initialUsers }: { initialUsers: AdminUserRow[] }) {
    const [users, setUsers] = useState<AdminUserRow[]>(initialUsers);
    const [query, setQuery] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const runSearch = (val: string) => {
        setQuery(val);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(async () => {
            setIsLoading(true);
            try {
                const { users: result, error } = await searchUsersAction(val);
                if (!error && result) setUsers(result);
            } catch (e) {
                console.error("Error buscando usuarios", e);
            } finally {
                setIsLoading(false);
            }
        }, 400);
    };

    return (
        <div className="bg-card rounded-xl border border-teal/10 shadow-sm flex flex-col">
            <div className="p-4 md:p-6 border-b border-teal/10">
                <div className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Buscar por email, usuario o nombre..."
                        className="w-full pl-9 pr-9 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 transition-shadow"
                        value={query}
                        onChange={(e) => runSearch(e.target.value)}
                    />
                    {isLoading && (
                        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-teal" />
                    )}
                </div>
            </div>

            <div className="overflow-x-auto min-h-[300px]">
                {users.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                        <p>No se encontraron usuarios.</p>
                    </div>
                ) : (
                    <table className="w-full text-sm text-left whitespace-nowrap">
                        <thead className="bg-muted/50 text-muted-foreground">
                            <tr>
                                <th className="px-6 py-3 font-medium">Usuario</th>
                                <th className="px-6 py-3 font-medium">Email</th>
                                <th className="px-6 py-3 font-medium">Plan</th>
                                <th className="px-6 py-3 font-medium">Alta</th>
                                <th className="px-6 py-3 font-medium">Rol</th>
                                <th className="px-4 py-3" />
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-teal/5">
                            {users.map((u) => (
                                <tr key={u.id} className="hover:bg-muted/30 transition-colors group">
                                    <td className="px-6 py-3.5">
                                        <Link href={`/app/admin/usuarios/${u.id}`} className="flex items-center gap-3">
                                            <Avatar
                                                src={u.avatar_url ?? undefined}
                                                fallback={
                                                    u.username
                                                        ? u.username.substring(0, 2).toUpperCase()
                                                        : "US"
                                                }
                                                size="sm"
                                                className="bg-teal/10 text-teal-dark border-teal/20"
                                            />
                                            <div className="flex flex-col">
                                                <span className="font-medium text-foreground group-hover:text-teal-dark transition-colors">
                                                    {u.full_name || "Sin nombre"}
                                                </span>
                                                {u.username && (
                                                    <span className="text-xs text-muted-foreground">@{u.username}</span>
                                                )}
                                            </div>
                                        </Link>
                                    </td>
                                    <td className="px-6 py-3.5 text-muted-foreground">{u.email || "—"}</td>
                                    <td className="px-6 py-3.5">{planPill(u.subscription)}</td>
                                    <td className="px-6 py-3.5 text-muted-foreground">{formatDate(u.created_at)}</td>
                                    <td className="px-6 py-3.5">{roleBadge(u.role)}</td>
                                    <td className="px-4 py-3.5 text-right">
                                        <Link
                                            href={`/app/admin/usuarios/${u.id}`}
                                            className="inline-flex text-muted-foreground group-hover:text-teal transition-colors"
                                            aria-label="Ver ficha"
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

            {users.length >= 50 && (
                <div className="p-4 border-t border-teal/10 text-center text-xs text-muted-foreground">
                    Se muestran los primeros 50 resultados. Usa la búsqueda para encontrar a alguien específico.
                </div>
            )}
        </div>
    );
}
