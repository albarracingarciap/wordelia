import { createClient } from "@/utils/supabase/server";
import { hasSupabaseAdminConfig } from "@/utils/supabase/admin";
import { UsersRound } from "lucide-react";
import { fetchUsersEnriched } from "./data";
import { UsersListClient } from "./UsersListClient";

export const revalidate = 0;

export default async function AdminUsuariosPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // El layout ya exige admin|editor; aquí restringimos a admin (datos
    // personales, pagos y acciones sensibles sobre terceros).
    if (!user) return null;

    const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

    if (profile?.role !== "admin") {
        return (
            <div className="bg-coral/10 text-coral p-6 rounded-xl border border-coral/20">
                <h3 className="font-semibold text-lg">Acceso Restringido</h3>
                <p className="mt-2 text-sm">
                    Solo los Administradores principales pueden gestionar usuarios.
                    Tu rol actual es <b>{profile?.role ?? "sin rol"}</b>.
                </p>
            </div>
        );
    }

    if (!hasSupabaseAdminConfig()) {
        return (
            <div className="bg-coral/10 text-coral p-6 rounded-xl border border-coral/20">
                <h3 className="font-semibold text-lg">Configuración incompleta</h3>
                <p className="mt-2 text-sm">
                    Falta la clave de servicio de Supabase, necesaria para gestionar usuarios.
                </p>
            </div>
        );
    }

    const users = await fetchUsersEnriched();

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center pb-4 border-b border-teal/10">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Usuarios</h1>
                    <p className="text-muted-foreground mt-1">
                        Busca cualquier usuario y gestiona su rol, plan y cuenta.
                    </p>
                </div>
                <div className="bg-teal/10 p-3 rounded-xl hidden md:block">
                    <UsersRound className="w-6 h-6 text-teal" />
                </div>
            </div>

            <UsersListClient initialUsers={users} />
        </div>
    );
}
