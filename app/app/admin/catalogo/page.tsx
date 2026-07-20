import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { hasSupabaseAdminConfig } from "@/utils/supabase/admin";
import { Plus } from "lucide-react";
import { fetchBooksList } from "./data";
import { BooksListClient } from "./BooksListClient";

export const revalidate = 0;

export default async function CatalogAdminPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

    if (profile?.role !== "admin" && profile?.role !== "editor") {
        return (
            <div className="bg-coral/10 text-coral p-6 rounded-xl border border-coral/20">
                <h3 className="font-semibold text-lg">Acceso Restringido</h3>
                <p className="mt-2 text-sm">No tienes permisos para gestionar el catálogo.</p>
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

    const books = await fetchBooksList();

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center gap-4 pb-4 border-b border-teal/10">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Catálogo</h1>
                    <p className="text-muted-foreground mt-1">
                        Gestiona libros, ediciones, guías y genomas.
                    </p>
                </div>
                <Link
                    href="/app/admin/catalogo/buscar"
                    className="inline-flex items-center gap-2 text-sm font-medium bg-teal text-white py-2 px-4 rounded-md hover:bg-teal-dark transition-colors shrink-0"
                >
                    <Plus className="w-4 h-4" /> Importar libro
                </Link>
            </div>

            <BooksListClient initialBooks={books} />
        </div>
    );
}
