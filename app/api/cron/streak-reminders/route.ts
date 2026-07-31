import { createAdminClient } from "@/utils/supabase/admin";
import { selectInChunks } from "@/lib/supabase-chunks";
import { isCronAuthorized, zonedDayStartUTC, MADRID } from "@/lib/cron";
import { sendPushIfEnabled } from "@/lib/push-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LooseAdmin = { from: (t: string) => any };

/** user_ids (de entre `userIds`) con al menos una sesión de lectura en [from, to). */
async function readersAmong(
    admin: LooseAdmin,
    userIds: string[],
    fromISO: string,
    toISO: string | null,
): Promise<Set<string>> {
    const { data } = await selectInChunks<{ user_id: string }>(userIds, (chunk) => {
        let q = admin.from("reading_sessions").select("user_id").gte("start_time", fromISO).in("user_id", chunk);
        if (toISO) q = q.lt("start_time", toISO);
        return q;
    });
    return new Set((data ?? []).map((r) => r.user_id));
}

/**
 * Recordatorio de racha (diario). Avisa a quien leyó AYER pero no HOY (en horario
 * de Madrid) — su racha está en riesgo. Solo a usuarios con dispositivo suscrito.
 */
export async function POST(req: Request) {
    if (!isCronAuthorized(req)) return Response.json({ error: "unauthorized" }, { status: 401 });

    const admin = createAdminClient() as unknown as LooseAdmin;
    const todayStart = zonedDayStartUTC(MADRID, 0).toISOString();
    const yesterdayStart = zonedDayStartUTC(MADRID, 1).toISOString();

    const { data: subs } = await admin.from("push_subscriptions").select("user_id");
    const subscribed = Array.from(new Set((subs ?? []).map((s: { user_id: string }) => s.user_id))) as string[];
    if (subscribed.length === 0) return Response.json({ eligible: 0, sent: 0 });

    const [readYesterday, readToday] = await Promise.all([
        readersAmong(admin, subscribed, yesterdayStart, todayStart),
        readersAmong(admin, subscribed, todayStart, null),
    ]);

    const eligible = subscribed.filter((id) => readYesterday.has(id) && !readToday.has(id));

    let sent = 0;
    for (const userId of eligible) {
        const r = await sendPushIfEnabled(userId, "reading_reminders", {
            title: "No pierdas tu racha 🔥",
            body: "Aún estás a tiempo de leer un poco hoy.",
            url: "/app/mi-lectura",
            tag: "streak-reminder",
        }).catch(() => ({ sent: 0 }));
        sent += r.sent;
    }

    return Response.json({ eligible: eligible.length, sent });
}
