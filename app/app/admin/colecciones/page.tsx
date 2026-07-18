import { Layers } from "lucide-react";
import { createClient } from "@/utils/supabase/server";
import { getCurationQueue } from "./actions";
import { CurationClient } from "@/components/admin/colecciones/CurationClient";

export const revalidate = 0;

export default async function AdminColeccionesPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: profile } = await supabase
        .from("profiles").select("role").eq("id", user.id).single();

    if (profile?.role !== "admin") {
        return (
            <div className="rounded-xl border border-coral/20 bg-coral/10 p-6 text-coral">
                <h3 className="text-lg font-semibold">Acceso Restringido</h3>
                <p className="mt-2 text-sm">
                    Solo los Administradores principales pueden curar las colecciones.
                    Tu rol actual es <b>{profile?.role ?? "sin rol"}</b>.
                </p>
            </div>
        );
    }

    const { books, collections } = await getCurationQueue();

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-teal/10 pb-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Colecciones</h1>
                    <p className="mt-1 text-muted-foreground">
                        Libros con guía y genoma. Asígnales portada y colección, y publícalos
                        para que aparezcan en Explorar.
                    </p>
                </div>
                <div className="hidden rounded-xl bg-teal/10 p-3 md:block">
                    <Layers className="h-6 w-6 text-teal" />
                </div>
            </div>

            <CurationClient initialBooks={books} collections={collections} />
        </div>
    );
}
