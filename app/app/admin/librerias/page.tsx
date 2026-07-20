import { createClient } from "@/utils/supabase/server";
import { hasSupabaseAdminConfig } from "@/utils/supabase/admin";
import { Store } from "lucide-react";
import { fetchLibrariesList } from "./data";
import { LibrariesListClient } from "./LibrariesListClient";

export const revalidate = 0;

export default async function AdminLibreriasPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    if (profile?.role !== "admin") {
        return (
            <div className="bg-coral/10 text-coral p-6 rounded-xl border border-coral/20">
                <h3 className="font-semibold text-lg">Acceso Restringido</h3>
                <p className="mt-2 text-sm">Solo los administradores pueden gestionar librerías.</p>
            </div>
        );
    }

    if (!hasSupabaseAdminConfig()) {
        return (
            <div className="bg-coral/10 text-coral p-6 rounded-xl border border-coral/20">
                <h3 className="font-semibold text-lg">Configuración incompleta</h3>
                <p className="mt-2 text-sm">Falta la clave de servicio de Supabase.</p>
            </div>
        );
    }

    const libraries = await fetchLibrariesList();

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center pb-4 border-b border-teal/10">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Librerías</h1>
                    <p className="text-muted-foreground mt-1">Gestiona las librerías anfitrionas: plan, verificación y estado.</p>
                </div>
                <div className="bg-teal/10 p-3 rounded-xl hidden md:block">
                    <Store className="w-6 h-6 text-teal" />
                </div>
            </div>

            <LibrariesListClient initialLibraries={libraries} />
        </div>
    );
}
