"use server";

import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { revalidatePath } from "next/cache";

export interface ChallengeInput {
    title: string;
    description: string;
    start_date: string;
    end_date: string;
    rules: string;
    is_published: boolean;
    goal_type: string;        // 'books' | 'genre' | 'pages'
    goal_target: number | null;
    goal_genre: string;
    reward_badge_id: string;  // '' = ninguna
}

export interface AdminChallenge {
    id: string;
    title: string;
    description: string | null;
    startDate: string | null;
    endDate: string | null;
    isPublished: boolean;
    goalType: string | null;
    goalTarget: number | null;
    goalGenre: string | null;
    rewardBadgeId: string | null;
    rules: string | null;
    participants: number;
    createdAt: string;
}

async function assertAdmin() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("No autenticado");
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    if (profile?.role !== "admin" && profile?.role !== "editor") throw new Error("No autorizado");
}

function admin() {
    return createAdminClient() as unknown as { from: (t: string) => any };
}

function toRow(input: ChallengeInput) {
    const target = input.goal_target != null && Number.isFinite(input.goal_target) ? Math.max(1, Math.round(input.goal_target)) : null;
    return {
        title: input.title.trim(),
        description: input.description?.trim() || null,
        start_date: input.start_date || null,
        end_date: input.end_date || null,
        rules: input.rules?.trim() || null,
        is_published: !!input.is_published,
        goal_type: ["books", "genre", "pages"].includes(input.goal_type) ? input.goal_type : "books",
        goal_target: target,
        goal_genre: input.goal_type === "genre" ? (input.goal_genre?.trim() || null) : null,
        reward_badge_id: input.reward_badge_id || null,
        updated_at: new Date().toISOString(),
    };
}

export async function getBadgesForSelect(): Promise<{ id: string; name: string }[]> {
    try { await assertAdmin(); } catch { return []; }
    const { data } = await admin().from("badges").select("id, name").order("name");
    return (data ?? []) as { id: string; name: string }[];
}

export async function adminListChallenges(): Promise<AdminChallenge[]> {
    try { await assertAdmin(); } catch { return []; }
    const a = admin();
    const { data } = await a.from("challenges").select("*").order("created_at", { ascending: false });
    const rows = (data ?? []) as any[];
    const { data: parts } = await a.from("challenge_participants").select("challenge_id").in("challenge_id", rows.map((r) => r.id).length ? rows.map((r) => r.id) : ["00000000-0000-0000-0000-000000000000"]);
    const counts: Record<string, number> = {};
    for (const p of (parts ?? []) as any[]) counts[p.challenge_id] = (counts[p.challenge_id] ?? 0) + 1;
    return rows.map((r) => ({
        id: r.id, title: r.title, description: r.description, startDate: r.start_date, endDate: r.end_date,
        isPublished: !!r.is_published, goalType: r.goal_type, goalTarget: r.goal_target, goalGenre: r.goal_genre,
        rewardBadgeId: r.reward_badge_id, rules: r.rules, participants: counts[r.id] ?? 0, createdAt: r.created_at,
    }));
}

export async function adminGetChallenge(id: string): Promise<AdminChallenge | null> {
    try { await assertAdmin(); } catch { return null; }
    const { data: r } = await admin().from("challenges").select("*").eq("id", id).maybeSingle();
    if (!r) return null;
    return {
        id: r.id, title: r.title, description: r.description, startDate: r.start_date, endDate: r.end_date,
        isPublished: !!r.is_published, goalType: r.goal_type, goalTarget: r.goal_target, goalGenre: r.goal_genre,
        rewardBadgeId: r.reward_badge_id, rules: r.rules, participants: 0, createdAt: r.created_at,
    };
}

export async function createChallenge(input: ChallengeInput) {
    try { await assertAdmin(); } catch { return { error: "No autorizado" }; }
    if (!input.title?.trim()) return { error: "El título es obligatorio." };
    const { error } = await admin().from("challenges").insert(toRow(input));
    if (error) { console.error("createChallenge:", error); return { error: error.message }; }
    revalidatePath("/app/admin/retos");
    revalidatePath("/app/retos");
    return { success: true };
}

export async function updateChallenge(id: string, input: ChallengeInput) {
    try { await assertAdmin(); } catch { return { error: "No autorizado" }; }
    if (!input.title?.trim()) return { error: "El título es obligatorio." };
    const { error } = await admin().from("challenges").update(toRow(input)).eq("id", id);
    if (error) { console.error("updateChallenge:", error); return { error: error.message }; }
    revalidatePath("/app/admin/retos");
    revalidatePath("/app/retos");
    return { success: true };
}

export async function deleteChallenge(id: string) {
    try { await assertAdmin(); } catch { return { error: "No autorizado" }; }
    const { error } = await admin().from("challenges").delete().eq("id", id);
    if (error) { console.error("deleteChallenge:", error); return { error: error.message }; }
    revalidatePath("/app/admin/retos");
    revalidatePath("/app/retos");
    return { success: true };
}
