"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";

export interface CommunityPrompt {
    id: string;
    question: string;
    isActive: boolean;
    createdAt: string;
}

async function assertAdmin() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("No autenticado");
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    if (profile?.role !== "admin") throw new Error("No autorizado");
}

function admin() {
    return createAdminClient() as unknown as { from: (t: string) => any };
}

/** El prompt activo de la comunidad (o null). */
export async function getActivePrompt(): Promise<CommunityPrompt | null> {
    const supabase = await createClient();
    const { data } = await supabase
        .from("community_prompts")
        .select("id, question, is_active, created_at")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
    if (!data) return null;
    return { id: data.id, question: data.question, isActive: data.is_active, createdAt: data.created_at };
}

// --- Gestión (admin) --------------------------------------------------------

export async function adminListPrompts(): Promise<CommunityPrompt[]> {
    try { await assertAdmin(); } catch { return []; }
    const { data } = await admin().from("community_prompts").select("id, question, is_active, created_at").order("created_at", { ascending: false });
    return ((data ?? []) as any[]).map((r) => ({ id: r.id, question: r.question, isActive: r.is_active, createdAt: r.created_at }));
}

export async function adminCreatePrompt(question: string) {
    try { await assertAdmin(); } catch { return { error: "No autorizado" }; }
    const q = (question || "").trim();
    if (!q) return { error: "Escribe la pregunta." };
    const { error } = await admin().from("community_prompts").insert({ question: q, is_active: false });
    if (error) return { error: error.message };
    revalidatePath("/app/admin/prompts");
    return { success: true };
}

/** Activa un prompt (y desactiva el resto: solo uno activo). */
export async function adminSetPromptActive(id: string, active: boolean) {
    try { await assertAdmin(); } catch { return { error: "No autorizado" }; }
    const a = admin();
    if (active) await a.from("community_prompts").update({ is_active: false }).eq("is_active", true);
    const { error } = await a.from("community_prompts").update({ is_active: active }).eq("id", id);
    if (error) return { error: error.message };
    revalidatePath("/app/admin/prompts");
    revalidatePath("/app/comunidad");
    return { success: true };
}

export async function adminDeletePrompt(id: string) {
    try { await assertAdmin(); } catch { return { error: "No autorizado" }; }
    const { error } = await admin().from("community_prompts").delete().eq("id", id);
    if (error) return { error: error.message };
    revalidatePath("/app/admin/prompts");
    return { success: true };
}
