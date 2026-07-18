"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";

const VALID_STATUSES = ["new", "read", "replied", "archived"] as const;
type Status = (typeof VALID_STATUSES)[number];

export type UpdateStatusResult = { success: true } | { success: false; error: string };

// Solo admin: el layout deja entrar también a editor, y los mensajes de
// contacto llevan datos personales de terceros.
async function assertAdmin() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("No autenticado");

    const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

    if (profile?.role !== "admin") throw new Error("No autorizado");
}

export async function updateContactMessageStatus(id: string, status: string): Promise<UpdateStatusResult> {
    if (!(VALID_STATUSES as readonly string[]).includes(status)) {
        return { success: false, error: "Estado no válido." };
    }

    try {
        await assertAdmin();

        const admin = createAdminClient() as unknown as { from: (table: string) => any };
        const { error } = await admin
            .from("contact_messages")
            .update({ status: status as Status })
            .eq("id", id);

        if (error) {
            console.error("Error updating contact message status:", error);
            return { success: false, error: "No se ha podido actualizar el estado." };
        }

        revalidatePath("/app/admin/mensajes");
        return { success: true };
    } catch (error) {
        console.error("updateContactMessageStatus:", error);
        return { success: false, error: "No se ha podido actualizar el estado." };
    }
}
