"use server";

import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";

// Permite a un admin/editor de plataforma GESTIONAR un club oficial de Wordelia
// aunque no lo haya creado: le asegura una membresía de admin en ese club
// (idempotente) para que el dashboard de gestión funcione con normalidad.
export async function enterOfficialClubManagement(clubId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "No autenticado" };

    const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();
    if (profile?.role !== "admin" && profile?.role !== "editor") {
        return { error: "No autorizado" };
    }

    const admin = createAdminClient() as unknown as { from: (t: string) => any };

    const { data: club } = await admin
        .from("clubs")
        .select("id, is_official")
        .eq("id", clubId)
        .maybeSingle();
    if (!club || !club.is_official) return { error: "Club oficial no encontrado" };

    const { data: existing } = await admin
        .from("club_members")
        .select("id, role")
        .eq("club_id", clubId)
        .eq("user_id", user.id)
        .maybeSingle();

    if (!existing) {
        const { error } = await admin
            .from("club_members")
            .insert({ club_id: clubId, user_id: user.id, role: "admin", join_source: "staff" });
        if (error) return { error: error.message };
    } else if (existing.role !== "admin") {
        const { error } = await admin
            .from("club_members")
            .update({ role: "admin" })
            .eq("id", existing.id);
        if (error) return { error: error.message };
    }

    return { success: true };
}
