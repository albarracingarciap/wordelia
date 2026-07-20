import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/utils/supabase/server";
import { hasSupabaseAdminConfig } from "@/utils/supabase/admin";
import { fetchUserDetail } from "../data";
import { UserDetailClient } from "./UserDetailClient";

export const revalidate = 0;

export default async function AdminUsuarioDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
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
                </p>
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

    const detail = await fetchUserDetail(id);

    if (!detail) {
        return (
            <div className="space-y-6">
                <Link
                    href="/app/admin/usuarios"
                    className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-teal-dark transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" /> Volver a Usuarios
                </Link>
                <div className="bg-muted/40 p-6 rounded-xl border border-teal/10">
                    <h3 className="font-semibold text-lg">Usuario no encontrado</h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                        No existe ningún usuario con ese identificador.
                    </p>
                </div>
            </div>
        );
    }

    return <UserDetailClient detail={detail} currentAdminId={user.id} />;
}
