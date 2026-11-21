"use server";

import { createClient } from "@/utils/supabase/server";
import { getUserClubs } from "@/app/app/clubs/actions";

// Datos de la pestaña Clubs del shell móvil /m.

export interface MobileClubSummary {
    id: string;
    name: string;
    coverUrl: string | null;
    memberCount: number;
    isPending: boolean;
    isManager: boolean;
    isLibraryClub: boolean;
    currentBook: { title: string; coverUrl: string | null; status: string | null } | null;
    /** Sesión en vivo ahora mismo. */
    live: { id: string; title: string } | null;
    /** Próxima sesión programada (la más cercana). */
    next: { id: string; title: string; scheduledAt: string } | null;
}

type UserClub = Awaited<ReturnType<typeof getUserClubs>>["active"][number];
type SessionRow = { id: string; club_id: string; title: string; status: string; scheduled_at: string };

export async function getMyClubsForMobile(): Promise<MobileClubSummary[]> {
    const { active } = await getUserClubs();
    if (active.length === 0) return [];

    // Sesiones en vivo / programadas de todos mis clubs en una sola consulta.
    // (La lista de ids son solo los clubs del usuario: corta, sin riesgo de 414.)
    const supabase = await createClient();
    const ids = active.map((c: UserClub) => c.id as string);
    const { data: sessions, error } = await supabase
        .from("club_live_sessions")
        .select("id, club_id, title, status, scheduled_at")
        .in("club_id", ids)
        .in("status", ["scheduled", "live"])
        .order("scheduled_at", { ascending: true });
    if (error) console.error("getMyClubsForMobile sessions:", error);

    const nowMs = Date.now();
    const liveByClub = new Map<string, { id: string; title: string }>();
    const nextByClub = new Map<string, { id: string; title: string; scheduledAt: string }>();
    for (const s of (sessions ?? []) as SessionRow[]) {
        if (s.status === "live") {
            if (!liveByClub.has(s.club_id)) liveByClub.set(s.club_id, { id: s.id, title: s.title });
        } else if (!nextByClub.has(s.club_id) && new Date(s.scheduled_at).getTime() >= nowMs - 60 * 60 * 1000) {
            // Programadas desde hace 1h (por si el anfitrión aún no la ha iniciado).
            nextByClub.set(s.club_id, { id: s.id, title: s.title, scheduledAt: s.scheduled_at });
        }
    }

    const summaries: MobileClubSummary[] = active.map((c: UserClub) => ({
        id: c.id,
        name: c.name,
        coverUrl: c.cover_url ?? null,
        memberCount: c.memberCount ?? 0,
        isPending: c.membershipRole === "pending",
        isManager: !!c.isAdmin,
        isLibraryClub: !!c.organization_id,
        currentBook: c.currentBook?.title
            ? { title: c.currentBook.title, coverUrl: c.currentBook.coverUrl ?? null, status: c.currentBook.status ?? null }
            : null,
        live: liveByClub.get(c.id) ?? null,
        next: nextByClub.get(c.id) ?? null,
    }));

    // Orden: en vivo primero, luego por próxima sesión, luego alfabético; pendientes al final.
    return summaries.sort((a, b) => {
        if (a.isPending !== b.isPending) return a.isPending ? 1 : -1;
        if (!!a.live !== !!b.live) return a.live ? -1 : 1;
        if (a.next && b.next) return new Date(a.next.scheduledAt).getTime() - new Date(b.next.scheduledAt).getTime();
        if (!!a.next !== !!b.next) return a.next ? -1 : 1;
        return a.name.localeCompare(b.name, "es");
    });
}
