import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Store, BadgeCheck, Ban } from "lucide-react";
import { createClient } from "@/utils/supabase/server";
import { hasSupabaseAdminConfig } from "@/utils/supabase/admin";
import { fetchLibraryWorkspace, fetchOrgPayments, fetchOrgTeam, fetchOrgClubs } from "../data";
import { LibraryStatusBar } from "./LibraryStatusBar";
import { DatosTab } from "./DatosTab";
import { PlanTab } from "./PlanTab";
import { EquipoTab } from "./EquipoTab";
import { ClubsTab } from "./ClubsTab";

export const revalidate = 0;

const TABS = [
    { id: "datos", label: "Datos" },
    { id: "plan", label: "Plan y facturación" },
    { id: "equipo", label: "Propietario y equipo" },
    { id: "clubs", label: "Clubs alojados" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default async function LibraryWorkspacePage({
    params,
    searchParams,
}: {
    params: Promise<{ id: string }>;
    searchParams: Promise<{ tab?: string }>;
}) {
    const { id } = await params;
    const { tab } = await searchParams;
    const active: TabId = TABS.some((t) => t.id === tab) ? (tab as TabId) : "datos";

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    if (profile?.role !== "admin") {
        return <div className="bg-coral/10 text-coral p-6 rounded-xl border border-coral/20"><h3 className="font-semibold text-lg">Acceso Restringido</h3></div>;
    }
    if (!hasSupabaseAdminConfig()) {
        return <div className="bg-coral/10 text-coral p-6 rounded-xl border border-coral/20"><h3 className="font-semibold text-lg">Configuración incompleta</h3></div>;
    }

    const ws = await fetchLibraryWorkspace(id);
    if (!ws) {
        return (
            <div className="space-y-6">
                <Link href="/app/admin/librerias" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-teal-dark">
                    <ArrowLeft className="w-4 h-4" /> Volver a Librerías
                </Link>
                <div className="bg-muted/40 p-6 rounded-xl border border-teal/10"><h3 className="font-semibold text-lg">Librería no encontrada</h3></div>
            </div>
        );
    }

    const { org, owner, subscription } = ws;
    const payments = active === "plan" ? await fetchOrgPayments(id) : [];
    const team = active === "equipo" ? await fetchOrgTeam(id) : [];
    const clubs = active === "clubs" ? await fetchOrgClubs(id) : [];

    return (
        <div className="space-y-6">
            <Link href="/app/admin/librerias" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-teal-dark transition-colors">
                <ArrowLeft className="w-4 h-4" /> Volver a Librerías
            </Link>

            {/* Cabecera */}
            <div className="flex items-start gap-4 pb-4 border-b border-teal/10">
                {org.logo_url ? (
                    <div className="relative w-16 h-16 shrink-0 rounded-lg overflow-hidden shadow-sm">
                        <Image src={org.logo_url} alt={org.name} fill className="object-cover" sizes="64px" />
                    </div>
                ) : (
                    <div className="w-16 h-16 shrink-0 rounded-lg bg-teal/10 flex items-center justify-center">
                        <Store className="w-7 h-7 text-teal" />
                    </div>
                )}
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                        <h1 className="text-2xl font-bold tracking-tight truncate">{org.name}</h1>
                        {org.verified && <BadgeCheck className="w-5 h-5 text-teal" />}
                        {!org.is_active && (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-coral bg-coral/10 py-0.5 px-2 rounded"><Ban className="w-3 h-3" /> Suspendida</span>
                        )}
                    </div>
                    <p className="text-muted-foreground text-sm mt-0.5">
                        {[org.city, subscription?.tier === "pro" ? "Pro" : "Free"].filter(Boolean).join(" · ")}
                        {" · "}
                        {ws.clubsCount} {ws.clubsCount === 1 ? "club" : "clubs"}
                        {owner && (
                            <>
                                {" · "}
                                <Link href={`/app/admin/usuarios/${owner.id}`} className="text-teal-dark hover:underline">
                                    {owner.name || owner.email || "Propietario"}
                                </Link>
                            </>
                        )}
                    </p>
                    <div className="mt-3">
                        <LibraryStatusBar orgId={org.id} verified={org.verified} isActive={org.is_active} tier={subscription?.tier ?? "free"} />
                    </div>
                </div>
            </div>

            {/* Pestañas */}
            <div className="border-b border-teal/10">
                <nav className="flex gap-1 overflow-x-auto">
                    {TABS.map((t) => (
                        <Link
                            key={t.id}
                            href={`/app/admin/librerias/${id}?tab=${t.id}`}
                            scroll={false}
                            className={`px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition-colors ${
                                active === t.id ? "border-teal text-teal-dark" : "border-transparent text-muted-foreground hover:text-foreground"
                            }`}
                        >
                            {t.label}
                        </Link>
                    ))}
                </nav>
            </div>

            <div className="animate-fade-in">
                {active === "datos" && <DatosTab org={org} />}
                {active === "plan" && <PlanTab orgId={org.id} subscription={subscription} payments={payments} />}
                {active === "equipo" && <EquipoTab orgId={org.id} team={team} />}
                {active === "clubs" && <ClubsTab orgId={org.id} clubs={clubs} />}
            </div>
        </div>
    );
}
