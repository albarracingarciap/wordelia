import { createAdminClient } from "@/utils/supabase/admin";
import { isCronAuthorized } from "@/lib/cron";
import { sendPushToUsers } from "@/lib/push-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LooseAdmin = { from: (t: string) => any };

const WINDOW_HOURS = 24; // avisar cuando el evento empieza dentro de las próximas 24h

/**
 * Recordatorio de evento de librería (cada hora). Avisa a los seguidores de la
 * librería de los eventos que empiezan dentro de WINDOW_HOURS y aún no se han
 * recordado (idempotente vía organization_events.reminder_sent_at).
 */
export async function POST(req: Request) {
    if (!isCronAuthorized(req)) return Response.json({ error: "unauthorized" }, { status: 401 });

    const admin = createAdminClient() as unknown as LooseAdmin;
    const now = new Date();
    const until = new Date(now.getTime() + WINDOW_HOURS * 3_600_000).toISOString();

    const { data: events } = await admin
        .from("organization_events")
        .select("id, organization_id, title, starts_at, created_by")
        .gte("starts_at", now.toISOString())
        .lt("starts_at", until)
        .is("reminder_sent_at", null);

    const rows = (events ?? []) as {
        id: string;
        organization_id: string;
        title: string;
        created_by: string | null;
    }[];

    let processed = 0;
    for (const ev of rows) {
        const [{ data: followers }, { data: org }] = await Promise.all([
            admin.from("user_libraries").select("user_id").eq("organization_id", ev.organization_id),
            admin.from("organizations").select("name, slug").eq("id", ev.organization_id).maybeSingle(),
        ]);

        await sendPushToUsers(
            (followers ?? []).map((f: { user_id: string }) => f.user_id),
            "libraries",
            {
                title: `📅 ${org?.name || "Tu librería"}`,
                body: `"${ev.title}" empieza pronto.`,
                url: org?.slug ? `/libreria/${org.slug}` : "/app/librerias/descubrir",
                tag: `org-event-reminder-${ev.id}`,
            },
            ev.created_by,
        );

        await admin.from("organization_events").update({ reminder_sent_at: new Date().toISOString() }).eq("id", ev.id);
        processed++;
    }

    return Response.json({ events: rows.length, processed });
}
