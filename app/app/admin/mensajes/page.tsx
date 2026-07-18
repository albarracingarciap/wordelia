import { createClient } from "@/utils/supabase/server";
import { createAdminClient, hasSupabaseAdminConfig } from "@/utils/supabase/admin";
import { Mail } from "lucide-react";
import { ContactMessagesClient, type ContactMessage } from "@/components/admin/mensajes/ContactMessagesClient";

export const revalidate = 0;

export default async function AdminMensajesPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // El layout ya exige admin|editor; aquí restringimos a admin.
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
                    Solo los Administradores principales pueden leer los mensajes de contacto.
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
                    Falta la clave de servicio de Supabase, necesaria para leer los mensajes.
                </p>
            </div>
        );
    }

    // contact_messages no concede SELECT por RLS: se lee con service role.
    // El cliente admin está tipado con Database y esta tabla aún no figura
    // en types/supabase.ts, de ahí el cast.
    const admin = createAdminClient() as unknown as {
        from: (table: string) => any;
    };

    const { data, error } = await admin
        .from("contact_messages")
        .select("id, name, email, subject, message, source, status, created_at")
        .order("created_at", { ascending: false })
        .limit(200);

    if (error) {
        console.error("Error loading contact messages:", error);
    }

    const messages: ContactMessage[] = data ?? [];
    const unread = messages.filter((m) => m.status === "new").length;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center pb-4 border-b border-teal/10">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Mensajes</h1>
                    <p className="text-muted-foreground mt-1">
                        Mensajes recibidos desde el formulario de contacto.
                        {unread > 0 && <> Tienes <b>{unread}</b> sin leer.</>}
                    </p>
                </div>
                <div className="bg-teal/10 p-3 rounded-xl hidden md:block">
                    <Mail className="w-6 h-6 text-teal" />
                </div>
            </div>

            <ContactMessagesClient messages={messages} />
        </div>
    );
}
