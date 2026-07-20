import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { hasSupabaseAdminConfig } from "@/utils/supabase/admin";
import { Settings } from "lucide-react";
import { TeamRoster } from "@/components/admin/ajustes/TeamRoster";
import { ModerationQueue } from "@/components/admin/ajustes/ModerationQueue";
import { GeneralSettings } from "@/components/admin/ajustes/GeneralSettings";
import { fetchAllReports, fetchReportCounts } from "./data";
import { getAppSettings } from "@/lib/app-settings";

export const revalidate = 0;

const TABS = [
    { id: "equipo", label: "Equipo y Roles" },
    { id: "general", label: "General" },
    { id: "moderacion", label: "Moderación" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default async function AdminSettingsPage({
    searchParams,
}: {
    searchParams: Promise<{ tab?: string }>;
}) {
    const { tab } = await searchParams;
    const active: TabId = TABS.some((t) => t.id === tab) ? (tab as TabId) : "equipo";

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

    const isSuperAdmin = profile?.role === "admin";

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center pb-4 border-b border-teal/10">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Ajustes</h1>
                    <p className="text-muted-foreground mt-1">
                        Configuración global de Wordelia, equipo y moderación.
                    </p>
                </div>
                <div className="bg-teal/10 p-3 rounded-xl hidden md:block">
                    <Settings className="w-6 h-6 text-teal" />
                </div>
            </div>

            <div className="flex flex-col md:flex-row gap-6">
                {/* Navegación lateral de pestañas */}
                <div className="w-full md:w-48 xl:w-56 shrink-0">
                    <nav className="flex flex-row md:flex-col space-x-2 md:space-x-0 md:space-y-1 overflow-x-auto pb-2 md:pb-0">
                        {TABS.map((t) => (
                            <Link
                                key={t.id}
                                href={`/app/admin/ajustes?tab=${t.id}`}
                                scroll={false}
                                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${
                                    active === t.id
                                        ? "bg-accent text-accent-foreground"
                                        : "text-muted-foreground hover:bg-accent/50"
                                }`}
                            >
                                {t.label}
                            </Link>
                        ))}
                    </nav>
                </div>

                {/* Contenido */}
                <div className="flex-1 min-w-0">
                    {!isSuperAdmin ? (
                        <div className="bg-coral/10 text-coral p-6 rounded-xl border border-coral/20">
                            <h3 className="font-semibold text-lg">Acceso Restringido</h3>
                            <p className="mt-2 text-sm">
                                Solo los Administradores principales pueden acceder a los Ajustes.
                                Tu rol actual es <b>{profile?.role ?? "sin rol"}</b>.
                            </p>
                        </div>
                    ) : !hasSupabaseAdminConfig() ? (
                        <div className="bg-coral/10 text-coral p-6 rounded-xl border border-coral/20">
                            <h3 className="font-semibold text-lg">Configuración incompleta</h3>
                            <p className="mt-2 text-sm">
                                Falta la clave de servicio de Supabase, necesaria para esta sección.
                            </p>
                        </div>
                    ) : (
                        <div className="animate-fade-in">
                            {active === "equipo" && <TeamRoster currentUserId={user.id} />}
                            {active === "general" && <GeneralSettingsTab />}
                            {active === "moderacion" && <ModerationTab />}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

async function GeneralSettingsTab() {
    const settings = await getAppSettings();
    return <GeneralSettings initialSettings={settings} />;
}

async function ModerationTab() {
    const [reports, counts] = await Promise.all([fetchAllReports(), fetchReportCounts()]);
    return <ModerationQueue initialReports={reports} counts={counts} />;
}
