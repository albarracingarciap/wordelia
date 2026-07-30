// Lectura del resumen anual compartible "Tu año en lectura". Server-only, service
// role: la página /anio/[username] es pública (sin login). Espejo de shared-challenge.
import { createAdminClient } from "@/utils/supabase/admin";
import { selectInChunks } from "@/lib/supabase-chunks";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LooseClient = { from: (table: string) => any };

const MONTHS_ES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

export interface SharedWrapped {
    year: number;
    reader: { name: string | null; username: string | null; avatarUrl: string | null };
    booksRead: number;
    pages: number;
    hours: number;
    daysRead: number;
    avgRating: number | null;
    topGenre: string | null;
    bestMonth: string | null;
}

export async function fetchSharedWrapped(username: string, year: number): Promise<SharedWrapped | null> {
    const admin = createAdminClient() as unknown as LooseClient;

    const { data: profile } = await admin
        .from("profiles")
        .select("id, full_name, username, avatar_url")
        .eq("username", username)
        .maybeSingle();
    if (!profile) return null;

    const start = `${year}-01-01`;
    const end = `${year}-12-31`;
    const startISO = `${year}-01-01T00:00:00Z`;
    const endISO = `${year}-12-31T23:59:59Z`;

    const [readRes, sessionsRes] = await Promise.all([
        admin
            .from("user_books")
            .select("book_id, rating, finish_date")
            .eq("user_id", profile.id)
            .eq("status", "READ")
            .gte("finish_date", start)
            .lte("finish_date", end),
        admin
            .from("reading_sessions")
            .select("pages_read, duration_seconds, start_time")
            .eq("user_id", profile.id)
            .gte("start_time", startISO)
            .lte("start_time", endISO),
    ]);

    const readRows = (readRes.data || []) as { book_id: string; rating: number | null; finish_date: string | null }[];
    const sessionRows = (sessionsRes.data || []) as { pages_read: number | null; duration_seconds: number | null; start_time: string }[];

    // Páginas, horas y días con lectura.
    let pages = 0;
    let seconds = 0;
    const days = new Set<string>();
    for (const s of sessionRows) {
        pages += s.pages_read || 0;
        seconds += s.duration_seconds || 0;
        days.add(s.start_time.slice(0, 10));
    }

    // Valoración media.
    const ratings = readRows.map((r) => r.rating).filter((r): r is number => typeof r === "number" && r >= 1 && r <= 5);
    const avgRating = ratings.length > 0 ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10 : null;

    // Mejor mes (más libros terminados).
    const monthCounts = new Array(12).fill(0);
    for (const r of readRows) {
        if (!r.finish_date) continue;
        const m = parseInt(r.finish_date.slice(5, 7), 10) - 1;
        if (m >= 0 && m < 12) monthCounts[m]++;
    }
    const maxMonth = Math.max(0, ...monthCounts);
    const bestMonth = maxMonth > 0 ? MONTHS_ES[monthCounts.indexOf(maxMonth)] : null;

    // Género dominante entre los libros leídos.
    let topGenre: string | null = null;
    const bookIds = Array.from(new Set(readRows.map((r) => r.book_id).filter(Boolean))) as string[];
    if (bookIds.length > 0) {
        // Troceado: bookIds = libros READ del año (inflable por import) → evita 414.
        const { data: genreRows } = await selectInChunks<{ genres: { name?: string } | { name?: string }[] | null }>(
            bookIds,
            (chunk) => admin.from("book_genres").select("book_id, genres(name)").in("book_id", chunk),
        );
        const counts: Record<string, number> = {};
        for (const row of (genreRows || []) as { genres: { name?: string } | { name?: string }[] | null }[]) {
            const g = Array.isArray(row.genres) ? row.genres[0] : row.genres;
            if (g?.name) counts[g.name] = (counts[g.name] || 0) + 1;
        }
        const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
        if (top) topGenre = top[0];
    }

    return {
        year,
        reader: {
            name: profile.full_name ?? null,
            username: profile.username ?? null,
            avatarUrl: profile.avatar_url ?? null,
        },
        booksRead: readRows.length,
        pages,
        hours: Math.round(seconds / 3600),
        daysRead: days.size,
        avgRating,
        topGenre,
        bestMonth,
    };
}
