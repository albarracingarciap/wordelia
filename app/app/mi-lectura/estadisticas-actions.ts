"use server";

import { createClient } from "@/utils/supabase/server";

// --- TYPES ---

export type StatsRange = "7d" | "30d" | "year";

export interface StatsBucket {
    label: string;
    minutes: number;
    pages: number;
}

export interface StatsBar {
    label: string;
    value: number;
}

export interface GenreStat {
    label: string;
    count: number;
    pct: number;
}

export interface AuthorStat {
    name: string;
    count: number;
}

export interface HeatmapDay {
    date: string; // 'YYYY-MM-DD' local
    value: number;
}

export interface RatingBar {
    star: number; // 1..5
    count: number;
}

export interface FormatStat {
    key: "paper" | "ebook" | "audio";
    label: string;
    value: number;
    pct: number;
}

export interface ReadingInsights {
    // Heatmap de constancia (últimos ~12 meses)
    heatmap: HeatmapDay[];
    heatmapMetric: "minutes" | "pages" | "sessions";
    daysRead: number;
    // Valoraciones (histórico)
    ratings: RatingBar[];
    ratingsAvg: number | null;
    ratingsTotal: number;
    // Libros terminados por mes (este año)
    booksByMonth: StatsBar[];
    bestMonth: string | null;
    booksThisYear: number;
    // Formatos (histórico) y velocidad de lectura
    formats: FormatStat[];
    formatsTotal: number;
    pagesPerHour: number | null;
    // Minutos escuchados de audiolibros (~último año), para mostrar junto a las páginas leídas.
    listeningMinutes: number;
    avgDaysToFinish: number | null;
    // Proyección y compartir
    projectedBooks: number;
    goalTarget: number | null;
    username: string | null;
}

export interface ReadingStatsOverview {
    range: StatsRange;
    // Resumen / chips
    sessions: number;
    minutes: number;
    pages: number;
    finishedBooks: number;
    streak: number;
    // Comparación con el periodo anterior equivalente
    prevSessions: number;
    prevMinutes: number;
    prevPages: number;
    // Ritmo
    byPeriod: StatsBucket[];
    byTimeOfDay: StatsBar[];
    byWeekday: StatsBar[];
    bestWeekday: string | null;
    // Biblioteca
    genres: GenreStat[];
    authors: AuthorStat[];
    avgPages: number | null;
    booksInRange: number;
    // Estado
    hasData: boolean;
}

const EMPTY: ReadingStatsOverview = {
    range: "30d",
    sessions: 0,
    minutes: 0,
    pages: 0,
    finishedBooks: 0,
    streak: 0,
    prevSessions: 0,
    prevMinutes: 0,
    prevPages: 0,
    byPeriod: [],
    byTimeOfDay: [],
    byWeekday: [],
    bestWeekday: null,
    genres: [],
    authors: [],
    avgPages: null,
    booksInRange: 0,
    hasData: false,
};

// --- CONSTANTES ---

const WEEKDAY_LABELS = ["L", "M", "X", "J", "V", "S", "D"]; // Lunes primero
const WEEKDAY_FULL = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
const MONTH_LABELS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
const WEEKDAY_MAP: Record<string, number> = { Mon: 0, Tue: 1, Wed: 2, Thu: 3, Fri: 4, Sat: 5, Sun: 6 };
const DAY_MS = 86400000;

// --- HELPERS DE ZONA HORARIA ---

// Partes de una fecha UTC interpretadas en la zona horaria del usuario.
interface ZonedParts {
    year: number;
    monthIdx: number;   // 0..11
    hour: number;       // 0..23
    weekdayIdx: number; // 0=Lunes .. 6=Domingo
    dateKey: string;    // 'YYYY-MM-DD' local
    epochDay: number;   // nº de día absoluto (para diferencias de días de calendario)
}

function safeTimeZone(tz?: string | null): string {
    if (!tz) return "UTC";
    try {
        new Intl.DateTimeFormat("en-US", { timeZone: tz });
        return tz;
    } catch {
        return "UTC";
    }
}

function epochDayFromKey(dateKey: string): number {
    return Math.floor(Date.parse(`${dateKey}T00:00:00Z`) / DAY_MS);
}

function keyFromEpochDay(epochDay: number): string {
    return new Date(epochDay * DAY_MS).toISOString().split("T")[0];
}

function zonedParts(date: Date, timeZone: string): ZonedParts {
    const dtf = new Intl.DateTimeFormat("en-US", {
        timeZone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        hourCycle: "h23",
        weekday: "short",
    });
    const parts = dtf.formatToParts(date);
    const get = (t: string) => parts.find((p) => p.type === t)?.value || "";
    const year = parseInt(get("year"), 10);
    const monthIdx = parseInt(get("month"), 10) - 1;
    const day = parseInt(get("day"), 10);
    let hour = parseInt(get("hour"), 10);
    if (hour === 24 || Number.isNaN(hour)) hour = 0;
    const weekdayIdx = WEEKDAY_MAP[get("weekday")] ?? 0;
    const dateKey = `${year}-${String(monthIdx + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return { year, monthIdx, hour, weekdayIdx, dateKey, epochDay: epochDayFromKey(dateKey) };
}

// Sesión anotada con sus partes locales.
interface AnnotatedSession {
    minutes: number;
    pages: number;
    hour: number;
    weekdayIdx: number;
    monthIdx: number;
    daysAgo: number;
    bookId: string;
}

// Reparte las sesiones del periodo actual en tramos (día / semana / mes).
function buildBuckets(range: StatsRange, cur: AnnotatedSession[], now: ZonedParts): StatsBucket[] {
    if (range === "7d") {
        const buckets: StatsBucket[] = [];
        for (let i = 0; i < 7; i++) {
            const daysAgo = 6 - i;
            const wd = ((now.weekdayIdx - daysAgo) % 7 + 7) % 7;
            buckets.push({ label: WEEKDAY_LABELS[wd], minutes: 0, pages: 0 });
        }
        for (const s of cur) {
            const idx = 6 - s.daysAgo;
            if (idx >= 0 && idx < 7) { buckets[idx].minutes += s.minutes; buckets[idx].pages += s.pages; }
        }
        return buckets;
    }

    if (range === "30d") {
        const buckets: StatsBucket[] = ["Sem 1", "Sem 2", "Sem 3", "Sem 4", "Sem 5"].map((label) => ({ label, minutes: 0, pages: 0 }));
        for (const s of cur) {
            const weeksAgo = Math.min(4, Math.floor(s.daysAgo / 7));
            const idx = 4 - weeksAgo;
            buckets[idx].minutes += s.minutes; buckets[idx].pages += s.pages;
        }
        return buckets;
    }

    // year → tramos mensuales desde enero hasta el mes actual.
    const buckets: StatsBucket[] = [];
    for (let m = 0; m <= now.monthIdx; m++) buckets.push({ label: MONTH_LABELS[m], minutes: 0, pages: 0 });
    for (const s of cur) {
        if (s.monthIdx >= 0 && s.monthIdx < buckets.length) { buckets[s.monthIdx].minutes += s.minutes; buckets[s.monthIdx].pages += s.pages; }
    }
    return buckets;
}

// --- MAIN ---

export async function getReadingStats(range: StatsRange = "30d", timeZone?: string): Promise<ReadingStatsOverview> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { ...EMPTY, range };

    const tz = safeTimeZone(timeZone);
    const now = new Date();
    const nowP = zonedParts(now, tz);
    const todayEpochDay = nowP.epochDay;

    // Ventana de consulta: generosa, cubre periodo actual + anterior + racha.
    // Después filtramos con precisión por día de calendario en la zona del usuario.
    const queryCutoffISO = range === "year"
        ? new Date(Date.UTC(nowP.year - 1, 0, 1) - 2 * 3600 * 1000).toISOString()
        : new Date(now.getTime() - 62 * DAY_MS).toISOString();

    // Fecha de inicio (date-only) para libros terminados en el periodo actual.
    const finishedStartKey = range === "year"
        ? `${nowP.year}-01-01`
        : keyFromEpochDay(todayEpochDay - (range === "7d" ? 6 : 29));

    const [sessionsRes, finishedRes] = await Promise.all([
        supabase
            .from("reading_sessions")
            .select("duration_seconds, pages_read, start_time, book_id")
            .eq("user_id", user.id)
            .gte("start_time", queryCutoffISO)
            .order("start_time", { ascending: true }),
        supabase
            .from("user_books")
            .select("finish_date")
            .eq("user_id", user.id)
            .gte("finish_date", finishedStartKey),
    ]);

    const rows = (sessionsRes.data || []) as { duration_seconds: number | null; pages_read: number | null; start_time: string; book_id: string }[];
    const finishedBooks = (finishedRes.data || []).length;

    // Clasificar cada sesión en periodo actual / anterior, con partes locales.
    const cur: AnnotatedSession[] = [];
    const prev: AnnotatedSession[] = [];
    const dayKeys = new Set<string>();

    for (const s of rows) {
        const p = zonedParts(new Date(s.start_time), tz);
        dayKeys.add(p.dateKey);
        const rec: AnnotatedSession = {
            minutes: Math.round((s.duration_seconds || 0) / 60),
            pages: s.pages_read || 0,
            hour: p.hour,
            weekdayIdx: p.weekdayIdx,
            monthIdx: p.monthIdx,
            daysAgo: todayEpochDay - p.epochDay,
            bookId: s.book_id,
        };
        if (range === "year") {
            if (p.year === nowP.year) cur.push(rec);
            else if (p.year === nowP.year - 1) prev.push(rec);
        } else {
            const N = range === "7d" ? 7 : 30;
            if (rec.daysAgo >= 0 && rec.daysAgo < N) cur.push(rec);
            else if (rec.daysAgo >= N && rec.daysAgo < 2 * N) prev.push(rec);
        }
    }

    // --- Agregados de resumen ---
    const minutes = cur.reduce((sum, s) => sum + s.minutes, 0);
    const pages = cur.reduce((sum, s) => sum + s.pages, 0);
    const prevMinutes = prev.reduce((sum, s) => sum + s.minutes, 0);
    const prevPages = prev.reduce((sum, s) => sum + s.pages, 0);

    // --- Racha (días consecutivos leyendo, hoy o ayer), en zona local ---
    let streak = 0;
    const days = Array.from(dayKeys).map(epochDayFromKey).sort((a, b) => b - a);
    if (days.length > 0 && (days[0] === todayEpochDay || days[0] === todayEpochDay - 1)) {
        streak = 1;
        let last = days[0];
        for (let i = 1; i < days.length; i++) {
            if (last - days[i] === 1) { streak++; last = days[i]; }
            else break;
        }
    }

    // --- Ritmo ---
    const byPeriod = buildBuckets(range, cur, nowP);

    const timeOfDay = { manana: 0, tarde: 0, noche: 0 };
    const weekdayCounts = [0, 0, 0, 0, 0, 0, 0];
    for (const s of cur) {
        if (s.hour >= 5 && s.hour < 12) timeOfDay.manana++;
        else if (s.hour >= 12 && s.hour < 20) timeOfDay.tarde++;
        else timeOfDay.noche++;
        weekdayCounts[s.weekdayIdx]++;
    }
    const byTimeOfDay: StatsBar[] = [
        { label: "Mañana", value: timeOfDay.manana },
        { label: "Tarde", value: timeOfDay.tarde },
        { label: "Noche", value: timeOfDay.noche },
    ];
    const byWeekday: StatsBar[] = WEEKDAY_LABELS.map((label, i) => ({ label, value: weekdayCounts[i] }));
    let bestWeekday: string | null = null;
    const maxWeekday = Math.max(...weekdayCounts);
    if (maxWeekday > 0) bestWeekday = WEEKDAY_FULL[weekdayCounts.indexOf(maxWeekday)];

    // --- Biblioteca (basado en los libros leídos en el periodo) ---
    const bookIds = Array.from(new Set(cur.map((s) => s.bookId).filter(Boolean)));
    let genres: GenreStat[] = [];
    let authors: AuthorStat[] = [];
    let avgPages: number | null = null;

    if (bookIds.length > 0) {
        const [genresRes, booksRes] = await Promise.all([
            supabase
                .from("book_genres")
                .select("book_id, genres(name)")
                .in("book_id", bookIds),
            // page_count vive en editions (movido desde books en 20260525); leemos la edición
            // preferida de cada libro para el promedio de páginas.
            supabase
                .from("books")
                .select("id, author, preferred_edition:editions!books_preferred_edition_fk (page_count)")
                .in("id", bookIds),
        ]);

        const genreCounts: Record<string, number> = {};
        for (const row of (genresRes.data || []) as { book_id: string; genres: { name?: string } | { name?: string }[] | null }[]) {
            const g = Array.isArray(row.genres) ? row.genres[0] : row.genres;
            const name = g?.name;
            if (!name) continue;
            genreCounts[name] = (genreCounts[name] || 0) + 1;
        }
        const maxGenre = Math.max(1, ...Object.values(genreCounts));
        genres = Object.entries(genreCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 6)
            .map(([label, count]) => ({ label, count, pct: Math.round((count / maxGenre) * 100) }));

        const authorCounts: Record<string, number> = {};
        const pageCounts: number[] = [];
        for (const row of (booksRes.data || []) as { id: string; author: string | null; preferred_edition: { page_count: number | null } | { page_count: number | null }[] | null }[]) {
            const name = (row.author || "").trim();
            if (name) authorCounts[name] = (authorCounts[name] || 0) + 1;
            const edition = Array.isArray(row.preferred_edition) ? row.preferred_edition[0] : row.preferred_edition;
            const pageCount = edition?.page_count;
            if (pageCount && pageCount > 0) pageCounts.push(pageCount);
        }
        authors = Object.entries(authorCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([name, count]) => ({ name, count }));
        if (pageCounts.length > 0) {
            avgPages = Math.round(pageCounts.reduce((a, b) => a + b, 0) / pageCounts.length);
        }
    }

    return {
        range,
        sessions: cur.length,
        minutes,
        pages,
        finishedBooks,
        streak,
        prevSessions: prev.length,
        prevMinutes,
        prevPages,
        byPeriod,
        byTimeOfDay,
        byWeekday,
        bestWeekday,
        genres,
        authors,
        avgPages,
        booksInRange: bookIds.length,
        hasData: cur.length > 0 || finishedBooks > 0,
    };
}

// --- INSIGHTS ANUALES (independientes del rango) ---

export async function getReadingInsights(timeZone?: string): Promise<ReadingInsights> {
    const empty: ReadingInsights = {
        heatmap: [],
        heatmapMetric: "sessions",
        daysRead: 0,
        ratings: [1, 2, 3, 4, 5].map((star) => ({ star, count: 0 })),
        ratingsAvg: null,
        ratingsTotal: 0,
        booksByMonth: [],
        bestMonth: null,
        booksThisYear: 0,
        formats: [],
        formatsTotal: 0,
        pagesPerHour: null,
        listeningMinutes: 0,
        avgDaysToFinish: null,
        projectedBooks: 0,
        goalTarget: null,
        username: null,
    };

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return empty;

    const tz = safeTimeZone(timeZone);
    const now = new Date();
    const nowP = zonedParts(now, tz);
    const heatmapCutoffISO = new Date(now.getTime() - 371 * DAY_MS).toISOString();

    const [heatmapRes, ratingsRes, finishedRes, formatsRes, durationsRes, goalRes, profileRes] = await Promise.all([
        supabase
            .from("reading_sessions")
            .select("duration_seconds, pages_read, start_time, book_id")
            .eq("user_id", user.id)
            .gte("start_time", heatmapCutoffISO),
        supabase
            .from("user_books")
            .select("rating")
            .eq("user_id", user.id)
            .not("rating", "is", null),
        supabase
            .from("user_books")
            .select("finish_date")
            .eq("user_id", user.id)
            .gte("finish_date", `${nowP.year}-01-01`),
        supabase
            .from("user_books")
            .select("book_id, format")
            .eq("user_id", user.id)
            .not("format", "is", null),
        supabase
            .from("user_books")
            .select("start_date, finish_date")
            .eq("user_id", user.id)
            .not("start_date", "is", null)
            .not("finish_date", "is", null)
            .limit(300),
        supabase
            .from("reading_goals")
            .select("target")
            .eq("user_id", user.id)
            .eq("year", nowP.year)
            .maybeSingle(),
        supabase
            .from("profiles")
            .select("username")
            .eq("id", user.id)
            .maybeSingle(),
    ]);

    // Mapa book_id → formato (las sesiones no llevan formato; vive en user_books).
    const bookFormat = new Map<string, string>();
    for (const row of (formatsRes.data || []) as { book_id: string; format: string | null }[]) {
        if (row.book_id && row.format) bookFormat.set(row.book_id, row.format);
    }

    // --- Heatmap ---
    const dayAgg = new Map<string, { minutes: number; pages: number; sessions: number }>();
    let totMin = 0;
    let totPag = 0;
    let pageMin = 0;   // minutos de lectura en formatos de página (para pág/hora, sin audio)
    let audioMin = 0;  // minutos escuchados de audiolibros
    for (const s of (heatmapRes.data || []) as { duration_seconds: number | null; pages_read: number | null; start_time: string; book_id: string }[]) {
        const key = zonedParts(new Date(s.start_time), tz).dateKey;
        const min = Math.round((s.duration_seconds || 0) / 60);
        const pages = s.pages_read || 0;
        const agg = dayAgg.get(key) || { minutes: 0, pages: 0, sessions: 0 };
        agg.minutes += min;
        agg.pages += pages;
        agg.sessions += 1;
        dayAgg.set(key, agg);
        totMin += min;
        totPag += pages;
        if (bookFormat.get(s.book_id) === "audio") audioMin += min;
        else pageMin += min;
    }
    const metric: "minutes" | "pages" | "sessions" = totMin > 0 ? "minutes" : totPag > 0 ? "pages" : "sessions";
    const heatmap: HeatmapDay[] = Array.from(dayAgg.entries()).map(([date, a]) => ({ date, value: a[metric] }));

    // --- Valoraciones ---
    const dist = [0, 0, 0, 0, 0]; // índice 0 = 1★
    let ratingSum = 0;
    let ratingsTotal = 0;
    for (const r of (ratingsRes.data || []) as { rating: number | null }[]) {
        const v = r.rating || 0;
        if (v >= 1 && v <= 5) { dist[v - 1]++; ratingSum += v; ratingsTotal++; }
    }
    const ratings: RatingBar[] = dist.map((count, i) => ({ star: i + 1, count }));
    const ratingsAvg = ratingsTotal > 0 ? Math.round((ratingSum / ratingsTotal) * 10) / 10 : null;

    // --- Libros terminados por mes (este año) ---
    const monthCounts = new Array(nowP.monthIdx + 1).fill(0);
    let booksThisYear = 0;
    for (const b of (finishedRes.data || []) as { finish_date: string | null }[]) {
        if (!b.finish_date) continue;
        const m = parseInt(b.finish_date.slice(5, 7), 10) - 1;
        if (m >= 0 && m < monthCounts.length) { monthCounts[m]++; booksThisYear++; }
    }
    const booksByMonth: StatsBar[] = monthCounts.map((value, m) => ({ label: MONTH_LABELS[m], value }));
    let bestMonth: string | null = null;
    const maxMonth = Math.max(0, ...monthCounts);
    if (maxMonth > 0) bestMonth = MONTH_LABELS[monthCounts.indexOf(maxMonth)];

    // --- Formatos (histórico) ---
    const FORMAT_META: { key: "paper" | "ebook" | "audio"; label: string }[] = [
        { key: "paper", label: "Papel" },
        { key: "ebook", label: "Ebook" },
        { key: "audio", label: "Audio" },
    ];
    const formatCounts: Record<string, number> = { paper: 0, ebook: 0, audio: 0 };
    for (const row of (formatsRes.data || []) as { format: string | null }[]) {
        if (row.format && row.format in formatCounts) formatCounts[row.format]++;
    }
    const formatsTotal = formatCounts.paper + formatCounts.ebook + formatCounts.audio;
    const formats: FormatStat[] = FORMAT_META
        .map((f) => ({
            key: f.key,
            label: f.label,
            value: formatCounts[f.key],
            pct: formatsTotal > 0 ? Math.round((formatCounts[f.key] / formatsTotal) * 100) : 0,
        }))
        .filter((f) => f.value > 0);

    // --- Velocidad de lectura (pág/hora) desde las sesiones del último año ---
    // Solo cuenta el tiempo de formatos de página; el audio no tiene páginas y
    // desvirtuaría la velocidad si se incluyera.
    const pagesPerHour = pageMin > 0 && totPag > 0 ? Math.round(totPag / (pageMin / 60)) : null;

    // --- Días medios para terminar un libro ---
    let avgDaysToFinish: number | null = null;
    const durationRows = (durationsRes.data || []) as { start_date: string | null; finish_date: string | null }[];
    const spans: number[] = [];
    for (const r of durationRows) {
        if (!r.start_date || !r.finish_date) continue;
        const days = Math.round((Date.parse(`${r.finish_date}T00:00:00Z`) - Date.parse(`${r.start_date}T00:00:00Z`)) / DAY_MS);
        if (days >= 0 && days <= 3650) spans.push(days);
    }
    if (spans.length > 0) avgDaysToFinish = Math.round(spans.reduce((a, b) => a + b, 0) / spans.length);

    // --- Proyección del año (a este ritmo) ---
    const jan1EpochDay = epochDayFromKey(`${nowP.year}-01-01`);
    const dayOfYear = Math.max(1, nowP.epochDay - jan1EpochDay + 1);
    const daysInYear = (nowP.year % 4 === 0 && nowP.year % 100 !== 0) || nowP.year % 400 === 0 ? 366 : 365;
    const projectedBooks = Math.round((booksThisYear / dayOfYear) * daysInYear);
    const goalTarget = (goalRes.data as { target: number } | null)?.target ?? null;
    const username = (profileRes.data as { username: string | null } | null)?.username ?? null;

    return {
        heatmap,
        heatmapMetric: metric,
        daysRead: dayAgg.size,
        ratings,
        ratingsAvg,
        ratingsTotal,
        booksByMonth,
        bestMonth,
        booksThisYear,
        formats,
        formatsTotal,
        pagesPerHour,
        listeningMinutes: audioMin,
        avgDaysToFinish,
        projectedBooks,
        goalTarget,
        username,
    };
}
