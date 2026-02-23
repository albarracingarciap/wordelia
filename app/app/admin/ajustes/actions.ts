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

export async function getUsersAction(query: string = "") {
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

    // Admins need to see everyone, we use admin client if RLS blocks regular select
    // but typically "profiles are viewable by everyone" might exist. Let's use it directly to be safe.
    const adminSupabase = getAdminClient();

    let dbQuery = adminSupabase
        .from("profiles")
        .select("id, email, full_name, username, avatar_url, role")
        .order("created_at", { ascending: false });

    if (query) {
        dbQuery = dbQuery.or(`email.ilike.%${query}%,full_name.ilike.%${query}%,username.ilike.%${query}%`);
    }

    const { data, error } = await dbQuery.limit(50);

    if (error) {
        console.error("Error fetching users:", error);
        return { error: "Error al obtener usuarios." };
    }

    return { users: data };
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
