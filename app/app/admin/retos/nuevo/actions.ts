"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function createChallenge(data: {
    title: string;
    description: string;
    start_date: string;
    end_date: string;
    rules: string;
    reward_badge_name: string;
}) {
    const supabase = await createClient();
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

    const { error } = await supabase
        .from("challenges")
        .insert({
            title: data.title,
            description: data.description || null,
            start_date: data.start_date || null,
            end_date: data.end_date || null,
            rules: data.rules || null,
            reward_badge_name: data.reward_badge_name || null,
        });

    if (error) {
        console.error("Error creating challenge:", error);
        return { error: "Error al guardar el reto en la base de datos." };
    }

    revalidatePath("/app/admin/retos");
    return { success: true };
}

export async function deleteChallenge(id: string) {
    const supabase = await createClient();
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

    const { error } = await supabase
        .from("challenges")
        .delete()
        .eq("id", id);

    if (error) {
        console.error("Error deleting challenge:", error);
        return { error: "Error al eliminar el reto." };
    }

    revalidatePath("/app/admin/retos");
    return { success: true };
}

export async function updateChallenge(id: string, data: {
    title: string;
    description: string;
    start_date: string;
    end_date: string;
    rules: string;
    reward_badge_name: string;
}) {
    const supabase = await createClient();
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

    const { error } = await supabase
        .from("challenges")
        .update({
            title: data.title,
            description: data.description || null,
            start_date: data.start_date || null,
            end_date: data.end_date || null,
            rules: data.rules || null,
            reward_badge_name: data.reward_badge_name || null,
        })
        .eq("id", id);

    if (error) {
        console.error("Error updating challenge:", error);
        return { error: "Error al actualizar el reto en la base de datos." };
    }

    revalidatePath("/app/admin/retos");
    revalidatePath(`/app/admin/retos/[id]/editar`); // Need generic path if possible or just rely on layout
    return { success: true };
}
