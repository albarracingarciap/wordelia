// Lectura pública (sin login, service role) de un reto de comunidad para su
// tarjeta compartible /reto-comunidad/[id]. Distinto del reto anual (reading_goals,
// ver lib/shared-challenge.ts): esto lee la tabla `challenges`.
import { createAdminClient } from "@/utils/supabase/admin";

type LooseClient = { from: (table: string) => any };

export interface SharedCommunityChallenge {
    id: string;
    title: string;
    description: string | null;
    goalType: string | null;
    goalTarget: number | null;
    goalGenre: string | null;
    participants: number;
    origin: "wordelia" | "community";
    authorName: string | null;
    rewardBadgeName: string | null;
}

export async function fetchSharedCommunityChallenge(id: string): Promise<SharedCommunityChallenge | null> {
    const admin = createAdminClient() as unknown as LooseClient;

    const { data: ch } = await admin
        .from("challenges")
        .select("*")
        .eq("id", id)
        .eq("is_published", true)
        .eq("moderation_status", "approved")
        .maybeSingle();
    if (!ch) return null;

    const [{ count }, badgeRes, authorRes] = await Promise.all([
        admin.from("challenge_participants").select("*", { count: "exact", head: true }).eq("challenge_id", id),
        ch.reward_badge_id
            ? admin.from("badges").select("name").eq("id", ch.reward_badge_id).maybeSingle()
            : Promise.resolve({ data: null } as any),
        ch.created_by
            ? admin.from("profiles").select("full_name, username").eq("id", ch.created_by).maybeSingle()
            : Promise.resolve({ data: null } as any),
    ]);

    return {
        id: ch.id,
        title: ch.title,
        description: ch.description ?? null,
        goalType: ch.goal_type ?? null,
        goalTarget: ch.goal_target ?? null,
        goalGenre: ch.goal_genre ?? null,
        participants: count ?? 0,
        origin: ch.created_by ? "community" : "wordelia",
        authorName: authorRes?.data ? (authorRes.data.full_name || authorRes.data.username || "Un lector") : null,
        rewardBadgeName: badgeRes?.data?.name ?? ch.reward_badge_name ?? null,
    };
}
