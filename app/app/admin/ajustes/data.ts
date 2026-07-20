// Capa de datos de moderación del admin. Server-only: lee con service role
// (createAdminClient) porque un admin de plataforma necesita ver los reportes de
// TODOS los clubs, no solo los suyos. La RLS de club_reports solo deja ver los
// del propio club/mod, de ahí el service role.
import { createAdminClient } from "@/utils/supabase/admin";

export type ReportStatus = "open" | "reviewing" | "resolved" | "dismissed";

export interface ReportPerson {
    full_name: string | null;
    username: string | null;
    avatar_url: string | null;
}

export interface ReportEvent {
    id: string;
    status: string;
    note: string | null;
    created_at: string;
    actor: ReportPerson | null;
}

export interface GlobalReport {
    id: string;
    club_id: string;
    club_name: string;
    reason: string;
    details: string;
    status: string;
    created_at: string;
    resolved_at: string | null;
    reporter: ReportPerson | null;
    events: ReportEvent[];
}

/** Todos los reportes de clubs (máx. 200), con nombre de club, autor e histórico. */
export async function fetchAllReports(status?: ReportStatus): Promise<GlobalReport[]> {
    const admin = createAdminClient() as unknown as { from: (table: string) => any };

    let query = admin
        .from("club_reports")
        .select(
            `
            id,
            club_id,
            reporter_id,
            reason,
            details,
            status,
            created_at,
            resolved_at,
            reporter:profiles!reporter_id(full_name, username, avatar_url),
            events:club_report_events(
                id,
                status,
                note,
                created_at,
                actor:profiles!actor_id(full_name, username, avatar_url)
            )
        `,
        )
        .order("created_at", { ascending: false })
        .order("created_at", { referencedTable: "club_report_events", ascending: true })
        .limit(200);

    if (status) query = query.eq("status", status);

    const { data: reports, error } = await query;
    if (error || !reports) {
        console.error("fetchAllReports: error", error);
        return [];
    }

    // Nombres de club en una segunda consulta (evita adivinar el nombre de la FK).
    const clubIds = [...new Set(reports.map((r: any) => r.club_id))];
    const { data: clubs } = clubIds.length
        ? await admin.from("clubs").select("id, name").in("id", clubIds)
        : { data: [] as { id: string; name: string }[] };
    const clubName = new Map((clubs ?? []).map((c: any) => [c.id, c.name]));

    return reports.map((r: any) => ({
        ...r,
        club_name: clubName.get(r.club_id) ?? "Club",
    })) as GlobalReport[];
}

/** Recuento por estado, para las pestañas de la cola. */
export async function fetchReportCounts(): Promise<Record<string, number>> {
    const admin = createAdminClient() as unknown as { from: (table: string) => any };
    const { data } = await admin.from("club_reports").select("status");
    const counts: Record<string, number> = { open: 0, reviewing: 0, resolved: 0, dismissed: 0 };
    for (const r of (data ?? []) as { status: string }[]) {
        counts[r.status] = (counts[r.status] ?? 0) + 1;
    }
    return counts;
}
