import { createClient } from "@/utils/supabase/server";
import { UserRoleManager } from "@/components/admin/ajustes/UserRoleManager";
import { Settings } from "lucide-react";

export const revalidate = 0;

export default async function AdminSettingsPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Redundant check just to be safe, layout already does this
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
                        Configuración global de Wordelia y permisos de equipo.
                    </p>
                </div>
                <div className="bg-teal/10 p-3 rounded-xl hidden md:block">
                    <Settings className="w-6 h-6 text-teal" />
                </div>
            </div>

            <div className="flex flex-col md:flex-row gap-6">

                {/* Lateral Tab Navigation */}
                <div className="w-full md:w-48 xl:w-56 shrink-0">
                    <nav className="flex flex-row md:flex-col space-x-2 md:space-x-0 md:space-y-1 overflow-x-auto pb-2 md:pb-0">
                        <button className="flex items-center gap-2 px-3 py-2 bg-accent text-accent-foreground rounded-md text-sm font-medium whitespace-nowrap">
                            Equipo y Roles
                        </button>
                        <button disabled className="flex items-center gap-2 px-3 py-2 text-muted-foreground hover:bg-accent/50 rounded-md text-sm font-medium whitespace-nowrap opacity-50 cursor-not-allowed" title="Próximamente">
                            General
                        </button>
                        <button disabled className="flex items-center gap-2 px-3 py-2 text-muted-foreground hover:bg-accent/50 rounded-md text-sm font-medium whitespace-nowrap opacity-50 cursor-not-allowed" title="Próximamente">
                            Moderación
                        </button>
                    </nav>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 min-w-0">
                    {/* Only full admins should be able to manage other roles in the UI ideally, 
                        though Server Actions already protect this. We will show a warning if an Editor accesses it. */}
                    {!isSuperAdmin ? (
                        <div className="bg-coral/10 text-coral p-6 rounded-xl border border-coral/20">
                            <h3 className="font-semibold text-lg flex items-center gap-2">
                                Acceso Restringido
                            </h3>
                            <p className="mt-2 text-sm">
                                Solo los Administradores principales pueden gestionar los roles del equipo. Tu rol actual es <b>{profile?.role}</b>.
                            </p>
                        </div>
                    ) : (
                        <div className="animate-fade-in">
                            <UserRoleManager />
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}
