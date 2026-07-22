"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";

export interface RetoItem {
    id: string;
    title: string;
    description: string | null;
    startDate: string | null;
    endDate: string | null;
    rules: string | null;
    goalType: string | null;
    goalTarget: number | null;
    goalGenre: string | null;
    rewardBadgeName: string | null;
    joined: boolean;
    progress: number;
    completed: boolean;
    active: boolean;
    participants: number;
}

// Progreso del usuario para un reto, contado en vivo dentro de su ventana.
async function computeProgress(supabase: any, userId: string, ch: any): Promise<number> {
    const start = ch.start_date || "1900-01-01";
    const end = ch.end_date || "2999-12-31";

    if (ch.goal_type === "pages") {
        const { data } = await supabase
            .from("reading_sessions")
            .select("pages_read")
            .eq("user_id", userId)
            .gte("created_at", start)
            .lte("created_at", `${end}T23:59:59`);
        return (data ?? []).reduce((a: number, s: any) => a + (s.pages_read || 0), 0);
    }

    if (ch.goal_type === "genre") {
        const { data } = await supabase
            .from("user_books")
            .select("book:books(genre)")
            .eq("user_id", userId)
            .eq("status", "READ")
            .gte("finish_date", start)
            .lte("finish_date", end);
        const target = (ch.goal_genre || "").trim().toLowerCase();
        let c = 0;
        for (const r of (data ?? []) as any[]) {
            const b = Array.isArray(r.book) ? r.book[0] : r.book;
            if (b?.genre && String(b.genre).trim().toLowerCase() === target) c++;
        }
        return c;
    }

    // 'books' (por defecto)
    const { count } = await supabase
        .from("user_books")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("status", "READ")
        .gte("finish_date", start)
        .lte("finish_date", end);
    return count ?? 0;
}

// Marca la participación como completada (idempotente) y concede la insignia.
async function completeParticipation(userId: string, ch: any): Promise<void> {
    const admin = createAdminClient() as unknown as { from: (t: string) => any };
    const { data: claimed } = await admin
        .from("challenge_participants")
        .update({ completed_at: new Date().toISOString() })
        .eq("challenge_id", ch.id)
        .eq("user_id", userId)
        .is("completed_at", null)
        .select("id");
    if (!claimed || claimed.length === 0) return; // ya estaba completado
    if (ch.reward_badge_id) {
        await admin
            .from("user_badges")
            .upsert({ user_id: userId, badge_id: ch.reward_badge_id }, { onConflict: "user_id,badge_id", ignoreDuplicates: true });
    }
}

/** Retos publicados con mi participación/progreso. Completa+premia en vivo. */
export async function getRetosView(): Promise<RetoItem[]> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const today = new Date().toISOString().slice(0, 10);

    const { data: challenges } = await (supabase.from("challenges") as any)
        .select("*")
        .eq("is_published", true)
        .order("end_date", { ascending: true });
    const rows = (challenges ?? []) as any[];
    if (rows.length === 0) return [];

    const { data: parts } = await (supabase.from("challenge_participants") as any)
        .select("challenge_id, completed_at")
        .eq("user_id", user.id);
    const partMap = new Map<string, any>((parts ?? []).map((p: any) => [p.challenge_id, p]));

    // Nombres de insignia de recompensa + recuento de participantes (service role).
    const admin = createAdminClient() as unknown as { from: (t: string) => any };
    const badgeIds = rows.map((r) => r.reward_badge_id).filter(Boolean);
    let badgeNames: Record<string, string> = {};
    if (badgeIds.length) {
        const { data: bs } = await admin.from("badges").select("id, name").in("id", badgeIds);
        badgeNames = Object.fromEntries((bs ?? []).map((b: any) => [b.id, b.name]));
    }
    const { data: allParts } = await admin
        .from("challenge_participants")
        .select("challenge_id")
        .in("challenge_id", rows.map((r) => r.id));
    const counts: Record<string, number> = {};
    for (const p of (allParts ?? []) as any[]) counts[p.challenge_id] = (counts[p.challenge_id] ?? 0) + 1;

    const result: RetoItem[] = [];
    for (const ch of rows) {
        const part = partMap.get(ch.id);
        const joined = !!part;
        let completed = !!part?.completed_at;
        let progress = 0;
        if (joined) {
            progress = await computeProgress(supabase, user.id, ch);
            const target = ch.goal_target ?? 0;
            if (!completed && target > 0 && progress >= target) {
                await completeParticipation(user.id, ch);
                completed = true;
            }
        }
        result.push({
            id: ch.id,
            title: ch.title,
            description: ch.description ?? null,
            startDate: ch.start_date ?? null,
            endDate: ch.end_date ?? null,
            rules: ch.rules ?? null,
            goalType: ch.goal_type ?? null,
            goalTarget: ch.goal_target ?? null,
            goalGenre: ch.goal_genre ?? null,
            rewardBadgeName: ch.reward_badge_id ? (badgeNames[ch.reward_badge_id] ?? null) : (ch.reward_badge_name ?? null),
            joined,
            progress,
            completed,
            active: !ch.end_date || ch.end_date >= today,
            participants: counts[ch.id] ?? 0,
        });
    }
    return result;
}

/** Unirse a un reto. */
export async function joinChallenge(challengeId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Debes iniciar sesión" };

    const { error } = await (supabase.from("challenge_participants") as any)
        .insert({ challenge_id: challengeId, user_id: user.id });
    if (error && !`${error.message}`.toLowerCase().includes("duplicate")) {
        console.error("[joinChallenge]", error);
        return { error: "No se pudo unir al reto" };
    }
    revalidatePath("/app/retos");
    return { success: true };
}
