// Lectura de un reto de lectura compartible. Server-only, service role: la página
// /reto/[id] es pública (sin login). El progreso se cuenta en vivo.
import { createAdminClient } from "@/utils/supabase/admin";

type LooseClient = { from: (table: string) => any };

export interface SharedChallenge {
    id: string;
    year: number;
    target: number;
    booksRead: number;
    reader: { name: string | null; username: string | null; avatarUrl: string | null };
}

export async function fetchSharedChallenge(id: string): Promise<SharedChallenge | null> {
    const admin = createAdminClient() as unknown as LooseClient;

    const { data: goal } = await admin
        .from("reading_goals")
        .select("id, user_id, year, target")
        .eq("id", id)
        .maybeSingle();
    if (!goal) return null;

    const start = `${goal.year}-01-01`;
    const end = `${goal.year}-12-31`;

    const [countRes, readerRes] = await Promise.all([
        admin
            .from("user_books")
            .select("*", { count: "exact", head: true })
            .eq("user_id", goal.user_id)
            .eq("status", "READ")
            .gte("finish_date", start)
            .lte("finish_date", end),
        admin.from("profiles").select("full_name, username, avatar_url").eq("id", goal.user_id).maybeSingle(),
    ]);

    return {
        id: goal.id,
        year: goal.year,
        target: goal.target,
        booksRead: countRes.count ?? 0,
        reader: {
            name: readerRes.data?.full_name ?? null,
            username: readerRes.data?.username ?? null,
            avatarUrl: readerRes.data?.avatar_url ?? null,
        },
    };
}
