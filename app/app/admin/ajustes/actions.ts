"use server";

import { createClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

// Helper to get admin client with service role key
function getAdminClient() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
}

// Roster del equipo: solo el staff (admin + editor). Dar acceso a alguien nuevo
// se hace desde su ficha en /app/admin/usuarios; aquí solo se ve y gestiona a
// quien ya tiene acceso elevado. Admins primero, luego editores.
export async function getStaffAction() {
    const supabase = await createServerClient();

    // Check permission first
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "No autorizado" };

    const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

    if (profile?.role !== "admin" && profile?.role !== "editor") {
        return { error: "Permisos insuficientes" };
    }

    // profiles no concede SELECT global por RLS: se lee con service role.
    const adminSupabase = getAdminClient();

    const { data, error } = await adminSupabase
        .from("profiles")
        .select("id, email, full_name, username, avatar_url, role")
        .in("role", ["admin", "editor"])
        .order("created_at", { ascending: true });

    if (error) {
        console.error("Error fetching staff:", error);
        return { error: "Error al obtener el equipo." };
    }

    // Admins primero, luego editores; dentro de cada grupo, por orden de alta.
    const staff = (data ?? []).sort((a, b) => {
        if (a.role === b.role) return 0;
        return a.role === "admin" ? -1 : 1;
    });

    return { staff };
}

export async function updateUserRoleAction(userId: string, newRole: string) {
    const supabase = await createServerClient();

    // Check permission - MUST BE ADMIN
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "No autorizado" };

    const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

    if (profile?.role !== "admin") {
        return { error: "Solo un administrador puede cambiar roles." };
    }

    // Target role validation
    if (!["user", "editor", "admin"].includes(newRole)) {
        return { error: "Rol no válido." };
    }

    const adminSupabase = getAdminClient();

    const { error } = await adminSupabase
        .from("profiles")
        .update({ role: newRole })
        .eq("id", userId);

    if (error) {
        console.error("Error updating user role:", error);
        return { error: "Error al actualizar el rol." };
    }

    revalidatePath("/app/admin/ajustes");
    return { success: true };
}

// ---------------------------------------------------------------------------
// Moderación global de reportes de clubs (solo admin)
// ---------------------------------------------------------------------------

// Devuelve el id del admin autenticado, o lanza si no lo es. Los reportes
// contienen datos de terceros y afectan a clubs ajenos: solo admin.
async function requireAdminId(): Promise<string> {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("No autenticado");

    const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

    if (profile?.role !== "admin") throw new Error("No autorizado");
    return user.id;
}

const REPORT_STATUSES = ["open", "reviewing", "resolved", "dismissed"] as const;

export async function updateReportStatusAction(
    reportId: string,
    clubId: string,
    status: string,
    note?: string,
): Promise<{ success: true } | { error: string }> {
    if (!(REPORT_STATUSES as readonly string[]).includes(status)) {
        return { error: "Estado no válido." };
    }
    try {
        const adminId = await requireAdminId();

        const cleanNote = note?.trim() || null;
        if ((status === "resolved" || status === "dismissed") && !cleanNote) {
            return { error: "Añade un motivo para cerrar el reporte." };
        }

        const admin = getAdminClient();
        const isClosed = status === "resolved" || status === "dismissed";

        const { error } = await admin
            .from("club_reports")
            .update({
                status,
                resolved_at: isClosed ? new Date().toISOString() : null,
                resolved_by: isClosed ? adminId : null,
            })
            .eq("id", reportId);

        if (error) {
            console.error("updateReportStatusAction:", error);
            return { error: "No se pudo actualizar el reporte." };
        }

        // Histórico: quién (admin) y qué hizo. actor_id/club_id son obligatorios.
        const { error: eventError } = await admin.from("club_report_events").insert({
            report_id: reportId,
            club_id: clubId,
            actor_id: adminId,
            status,
            note: cleanNote,
        });
        if (eventError) {
            console.error("updateReportStatusAction event:", eventError);
            return { error: "El estado cambió, pero no se pudo guardar el seguimiento." };
        }

        revalidatePath("/app/admin/ajustes");
        // También en el club: su panel de reportes debe reflejarlo.
        revalidatePath(`/app/clubs/${clubId}`);
        return { success: true };
    } catch (e) {
        console.error("updateReportStatusAction:", e);
        return { error: "No autorizado." };
    }
}

// ---------------------------------------------------------------------------
// Ajustes generales (app_settings) — solo admin
// ---------------------------------------------------------------------------

export async function updateAppSettingsAction(
    settings: unknown,
): Promise<{ success: true } | { error: string }> {
    try {
        const adminId = await requireAdminId();

        // Validación defensiva mínima: forma esperada.
        const s = settings as {
            announcement?: unknown;
            founder_window?: unknown;
            flags?: unknown;
        };
        if (!s || typeof s !== "object" || !s.announcement || !s.founder_window || !s.flags) {
            return { error: "Configuración incompleta." };
        }

        const admin = getAdminClient();
        const now = new Date().toISOString();
        const rows = [
            { key: "announcement", value: s.announcement, updated_at: now, updated_by: adminId },
            { key: "founder_window", value: s.founder_window, updated_at: now, updated_by: adminId },
            { key: "flags", value: s.flags, updated_at: now, updated_by: adminId },
        ];

        const { error } = await admin.from("app_settings").upsert(rows, { onConflict: "key" });
        if (error) {
            console.error("updateAppSettingsAction:", error);
            return { error: "No se pudo guardar la configuración." };
        }

        revalidatePath("/app/admin/ajustes");
        return { success: true };
    } catch (e) {
        console.error("updateAppSettingsAction:", e);
        return { error: "No autorizado." };
    }
}
