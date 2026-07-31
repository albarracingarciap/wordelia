import { createAdminClient } from "@/utils/supabase/admin";
import { isCronAuthorized } from "@/lib/cron";
import { sendPushIfEnabled } from "@/lib/push-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LooseAdmin = { from: (t: string) => any };

/**
 * Digest semanal (categoría recommendations, desactivada por defecto → solo a
 * quien opte). Para cada usuario suscrito, elige un libro al azar de su lista
 * "quiero leer" y le sugiere empezarlo esta semana.
 */
export async function POST(req: Request) {
    if (!isCronAuthorized(req)) return Response.json({ error: "unauthorized" }, { status: 401 });

    const admin = createAdminClient() as unknown as LooseAdmin;

    const { data: subs } = await admin.from("push_subscriptions").select("user_id");
    const userIds = Array.from(new Set((subs ?? []).map((s: { user_id: string }) => s.user_id))) as string[];
    if (userIds.length === 0) return Response.json({ candidates: 0, sent: 0 });

    let sent = 0;
    for (const userId of userIds) {
        const { data: books } = await admin
            .from("user_books")
            .select("book_id, books(title)")
            .eq("user_id", userId)
            .eq("status", "WANT_TO_READ")
            .limit(20);

        const list = (books ?? []) as { books: { title?: string } | { title?: string }[] | null }[];
        if (list.length === 0) continue;

        const pick = list[Math.floor(Math.random() * list.length)];
        const book = Array.isArray(pick.books) ? pick.books[0] : pick.books;
        if (!book?.title) continue;

        const r = await sendPushIfEnabled(userId, "recommendations", {
            title: "Tu lectura de la semana 📖",
            body: `¿Y si empiezas "${book.title}"? Te espera en tu lista.`,
            url: "/app/mi-lectura",
            tag: "weekly-rec",
        }).catch(() => ({ sent: 0 }));
        if (r.sent > 0) sent++;
    }

    return Response.json({ candidates: userIds.length, sent });
}
