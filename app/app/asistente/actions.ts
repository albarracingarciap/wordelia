"use server";

import { createClient } from "@/utils/supabase/server";
import { createAdminClient, hasSupabaseAdminConfig } from "@/utils/supabase/admin";
import { callMistral } from "@/lib/mistral";
import { FEATURE_MAX_TOKENS } from "@/lib/assistant-config";
import { getReadingStats, getReadingInsights, type StatsRange } from "@/app/app/mi-lectura/estadisticas-actions";
import {
    getAssistantAccess,
    hasMonthlyQuota,
    withinRateLimit,
    logAiUsage,
    getCachedGeneration,
    saveGeneration,
} from "@/lib/assistant-access";

export interface NextReadBook {
    id: string;
    title: string;
    author: string;
    coverUrl: string | null;
}

export type NextReadResult =
    | { status: "ok"; book: NextReadBook; reason: string; cached: boolean }
    | { status: "locked"; reason: "unauthenticated" | "requires_plan" }
    | { status: "limit" }
    | { status: "no_candidates" }
    | { status: "error"; message: string };

type GenreRow = { book_id: string; genres: { name?: string } | { name?: string }[] | null };

// Mapa book_id -> lista de géneros (para perfil y candidatos).
async function genresByBook(bookIds: string[]): Promise<Record<string, string[]>> {
    if (bookIds.length === 0) return {};
    const supabase = await createClient();
    const { data } = await supabase.from("book_genres").select("book_id, genres(name)").in("book_id", bookIds);
    const map: Record<string, string[]> = {};
    for (const row of (data || []) as GenreRow[]) {
        const g = Array.isArray(row.genres) ? row.genres[0] : row.genres;
        if (!g?.name) continue;
        (map[row.book_id] ||= []).push(g.name);
    }
    return map;
}

// Digest compacto del perfil del lector para el prompt (pocos cientos de tokens).
async function buildReaderDigest(userId: string, readBookIds: string[], genreMap: Record<string, string[]>): Promise<string> {
    const supabase = await createClient();

    const [readRes, emotionRes] = await Promise.all([
        supabase
            .from("user_books")
            .select("book_id, rating, books(title, author)")
            .eq("user_id", userId)
            .eq("status", "READ")
            .order("finish_date", { ascending: false })
            .limit(40),
        supabase
            .from("user_book_emotions")
            .select("emotion")
            .eq("user_id", userId)
            .limit(200),
    ]);

    type ReadRow = { book_id: string; rating: number | null; books: { title?: string; author?: string } | { title?: string; author?: string }[] | null };
    const readRows = (readRes.data || []) as ReadRow[];

    // Géneros favoritos (por nº de libros leídos).
    const genreCounts: Record<string, number> = {};
    for (const id of readBookIds) {
        for (const g of genreMap[id] || []) genreCounts[g] = (genreCounts[g] || 0) + 1;
    }
    const topGenres = Object.entries(genreCounts).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([g]) => g);

    // Mejor valorados (5★) y media.
    const rated = readRows.filter((r) => typeof r.rating === "number");
    const avg = rated.length ? Math.round((rated.reduce((s, r) => s + (r.rating || 0), 0) / rated.length) * 10) / 10 : null;
    const loved = readRows
        .filter((r) => (r.rating || 0) >= 5)
        .map((r) => (Array.isArray(r.books) ? r.books[0] : r.books)?.title)
        .filter(Boolean)
        .slice(0, 5);

    // Emoción dominante.
    const emoCounts: Record<string, number> = {};
    for (const e of (emotionRes.data || []) as { emotion: string }[]) emoCounts[e.emotion] = (emoCounts[e.emotion] || 0) + 1;
    const domEmotion = Object.entries(emoCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || null;

    const lines: string[] = [];
    lines.push(`Libros leídos registrados: ${readRows.length}.`);
    if (topGenres.length) lines.push(`Géneros favoritos: ${topGenres.join(", ")}.`);
    if (avg !== null) lines.push(`Valoración media: ${avg}/5.`);
    if (loved.length) lines.push(`Libros que le encantaron (5★): ${loved.join("; ")}.`);
    if (domEmotion) lines.push(`Emoción dominante en sus lecturas: ${domEmotion}.`);
    if (lines.length === 1) lines.push("Historial aún escaso; recomienda de forma acogedora.");
    return lines.join("\n");
}

interface CandidateLite {
    id: string;
    title: string;
    author: string;
    coverUrl: string | null;
    inWishlist: boolean;
}

const POOL_LIMIT = 30;

// Pool de candidatos: catálogo CURADO (libros con guía publicada) + la lista
// "Quiero leer" del lector (prioridad), excluyendo lo que ya lee/terminó.
async function buildCandidatePool(userId: string, topGenres: string[]): Promise<{ candidates: CandidateLite[]; genreMap: Record<string, string[]> }> {
    const supabase = await createClient();

    const { data: ubData } = await supabase.from("user_books").select("book_id, status").eq("user_id", userId);
    const ub = (ubData || []) as { book_id: string; status: string | null }[];
    const tbr = new Set(ub.filter((r) => r.status === "WANT_TO_READ").map((r) => r.book_id));
    const excluded = new Set(ub.filter((r) => r.status && r.status !== "WANT_TO_READ").map((r) => r.book_id));

    // Catálogo curado: libros con guía publicada (mismo criterio que /explorar).
    let curatedIds: string[] = [];
    if (hasSupabaseAdminConfig()) {
        const admin = createAdminClient() as unknown as { from: (t: string) => { select: (c: string) => { eq: (col: string, v: string) => Promise<{ data: { book_id: string }[] | null }> } } };
        const { data: guides } = await admin.from("book_guides").select("book_id").eq("status", "published");
        curatedIds = Array.from(new Set(((guides || []) as { book_id: string }[]).map((g) => g.book_id).filter(Boolean)));
    }

    let poolIds = Array.from(new Set([...tbr, ...curatedIds])).filter((id) => !excluded.has(id));
    if (poolIds.length === 0) return { candidates: [], genreMap: {} };
    // Límite defensivo antes de traer detalles (prioriza la wishlist).
    if (poolIds.length > 120) {
        const tbrFirst = poolIds.filter((id) => tbr.has(id));
        const rest = poolIds.filter((id) => !tbr.has(id)).slice(0, Math.max(0, 120 - tbrFirst.length));
        poolIds = [...tbrFirst, ...rest];
    }

    const genreMap = await genresByBook(poolIds);

    const { data: booksData } = await supabase.from("books").select("id, title, author, preferred_edition_id").in("id", poolIds);
    const books = (booksData || []) as { id: string; title: string | null; author: string | null; preferred_edition_id: string | null }[];
    const editionIds = books.map((b) => b.preferred_edition_id).filter(Boolean) as string[];
    const { data: edData } = editionIds.length
        ? await supabase.from("editions").select("id, cover_url").in("id", editionIds)
        : { data: [] as { id: string; cover_url: string | null }[] };
    const coverByEdition = new Map<string, string | null>(((edData || []) as { id: string; cover_url: string | null }[]).map((e) => [e.id, e.cover_url]));

    const topSet = new Set(topGenres);
    const scored = books.map((b) => {
        const inWishlist = tbr.has(b.id);
        const genreScore = (genreMap[b.id] || []).reduce((s, g) => s + (topSet.has(g) ? 1 : 0), 0);
        return {
            cand: {
                id: b.id,
                title: b.title || "Libro",
                author: b.author || "Autor desconocido",
                coverUrl: b.preferred_edition_id ? coverByEdition.get(b.preferred_edition_id) ?? null : null,
                inWishlist,
            } as CandidateLite,
            // La wishlist pesa; luego el solape de géneros con sus gustos.
            score: (inWishlist ? 100 : 0) + genreScore,
        };
    });
    scored.sort((a, b) => b.score - a.score);
    return { candidates: scored.slice(0, POOL_LIMIT).map((s) => s.cand), genreMap };
}

function safeParse(content: string): { bookId?: string; reason?: string } | null {
    try {
        return JSON.parse(content);
    } catch {
        const m = content.match(/\{[\s\S]*\}/);
        if (m) { try { return JSON.parse(m[0]); } catch { return null; } }
        return null;
    }
}

export type PeekResult = NextReadResult | { status: "empty" };

// Solo lee caché/estado; NO llama a Mistral. Para pintar la tarjeta al cargar.
export async function peekNextRead(): Promise<PeekResult> {
    const access = await getAssistantAccess();
    if (!access.allowed || !access.userId) {
        return { status: "locked", reason: access.reason === "unauthenticated" ? "unauthenticated" : "requires_plan" };
    }
    const cached = await getCachedGeneration<{ book: NextReadBook; reason: string }>(access.userId, "next_read");
    if (cached?.book) return { status: "ok", book: cached.book, reason: cached.reason, cached: true };
    return { status: "empty" };
}

export async function getNextReadRecommendation(forceRefresh = false): Promise<NextReadResult> {
    const access = await getAssistantAccess();
    if (!access.allowed || !access.userId) {
        return { status: "locked", reason: access.reason === "unauthenticated" ? "unauthenticated" : "requires_plan" };
    }
    const userId = access.userId;

    // Caché (salvo refresco explícito).
    if (!forceRefresh) {
        const cached = await getCachedGeneration<{ book: NextReadBook; reason: string }>(userId, "next_read");
        if (cached?.book) return { status: "ok", book: cached.book, reason: cached.reason, cached: true };
    }

    // Cuota mensual + rate-limit (admin sin límite).
    if (!(await hasMonthlyQuota(userId, access.isAdmin))) return { status: "limit" };
    if (!(await withinRateLimit(userId, access.isAdmin))) return { status: "error", message: "Vas muy rápido. Espera unos segundos e inténtalo de nuevo." };

    // Perfil del lector: géneros favoritos a partir de sus libros leídos.
    const supabase = await createClient();
    const { data: readIdsData } = await supabase
        .from("user_books")
        .select("book_id")
        .eq("user_id", userId)
        .eq("status", "READ")
        .limit(200);
    const readBookIds = ((readIdsData || []) as { book_id: string }[]).map((r) => r.book_id);
    const readGenreMap = await genresByBook(readBookIds);
    const gc: Record<string, number> = {};
    for (const id of readBookIds) for (const g of readGenreMap[id] || []) gc[g] = (gc[g] || 0) + 1;
    const topGenres = Object.entries(gc).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([g]) => g);

    // Candidatos: catálogo curado + wishlist (prioridad).
    const { candidates, genreMap: candGenreMap } = await buildCandidatePool(userId, topGenres);
    if (candidates.length === 0) return { status: "no_candidates" };

    const digest = await buildReaderDigest(userId, readBookIds, readGenreMap);
    const candidateLines = candidates
        .map((c) => {
            const g = candGenreMap[c.id]?.length ? ` | géneros: ${candGenreMap[c.id].join(", ")}` : "";
            const w = c.inWishlist ? " | (ya en su lista)" : "";
            return `- id: ${c.id} | ${c.title} — ${c.author}${g}${w}`;
        })
        .join("\n");

    const system =
        "Eres el bibliotecario de Wordelia: cálido, culto y breve. Recomiendas al lector su PRÓXIMA lectura " +
        "eligiendo EXCLUSIVAMENTE uno de los libros de su lista de candidatos (nunca inventes ni sugieras libros " +
        "fuera de esa lista). Te basas en su perfil lector; si un candidato encaja y además ya está en su lista, es " +
        'buena señal. Responde SOLO con un objeto JSON válido con las claves: "bookId" (el id exacto del candidato ' +
        'elegido) y "reason" (2-3 frases en español, cálidas y personalizadas, que conecten el libro con sus gustos; ' +
        "sin spoilers). No añadas texto fuera del JSON.";
    const user = `PERFIL DEL LECTOR:\n${digest}\n\nCANDIDATOS (elige uno por su id):\n${candidateLines}\n\nDevuelve el JSON.`;

    try {
        const { content, usage } = await callMistral({ system, user, maxTokens: FEATURE_MAX_TOKENS.next_read, jsonMode: true });
        await logAiUsage(userId, "next_read", usage);

        const parsed = safeParse(content);
        const chosen = candidates.find((c) => c.id === parsed?.bookId) || candidates[0];
        const reason = (parsed?.reason || "").trim() || "Una lectura que encaja con lo que sueles disfrutar.";

        const book: NextReadBook = { id: chosen.id, title: chosen.title, author: chosen.author, coverUrl: chosen.coverUrl };
        await saveGeneration(userId, "next_read", { book, reason });
        return { status: "ok", book, reason, cached: false };
    } catch (e) {
        console.error("getNextReadRecommendation error:", e);
        return { status: "error", message: "No hemos podido generar la recomendación. Inténtalo de nuevo en un momento." };
    }
}

// ============================================================
// F2 · "Estadísticas en palabras" (narrativa del año lector)
// ============================================================

export type NarrativeResult =
    | { status: "ok"; text: string; cached: boolean }
    | { status: "locked"; reason: "unauthenticated" | "requires_plan" }
    | { status: "limit" }
    | { status: "no_data" }
    | { status: "error"; message: string };

export type NarrativePeek = NarrativeResult | { status: "empty" };

// Digest compacto de las estadísticas para el prompt (solo líneas con datos).
async function buildStatsDigest(tz?: string): Promise<{ digest: string; hasData: boolean }> {
    const range: StatsRange = "year";
    const [insights, stats] = await Promise.all([getReadingInsights(tz), getReadingStats(range, tz)]);

    const lines: string[] = [];
    if (insights.booksThisYear > 0) {
        const proj = insights.projectedBooks > 0 ? ` (proyección a este ritmo: ${insights.projectedBooks}${insights.goalTarget ? `, su meta es ${insights.goalTarget}` : ""})` : "";
        lines.push(`Libros terminados este año: ${insights.booksThisYear}${proj}.`);
    }
    if (insights.daysRead > 0) lines.push(`Días con lectura en los últimos 12 meses: ${insights.daysRead}.`);
    if (stats.streak > 0) lines.push(`Racha actual: ${stats.streak} días seguidos.`);
    if (stats.genres.length) lines.push(`Géneros que más lee: ${stats.genres.slice(0, 3).map((g) => g.label).join(", ")}.`);
    if (insights.ratingsAvg !== null) lines.push(`Valoración media que da: ${insights.ratingsAvg}/5.`);
    if (insights.bestMonth) lines.push(`Su mejor mes de lectura: ${insights.bestMonth}.`);
    if (insights.formats.length) lines.push(`Formatos: ${insights.formats.map((f) => `${f.label} ${f.pct}%`).join(", ")}.`);
    if (insights.pagesPerHour) lines.push(`Ritmo de lectura: ~${insights.pagesPerHour} páginas por hora.`);
    if (insights.avgDaysToFinish) lines.push(`Tarda de media ~${insights.avgDaysToFinish} días en terminar un libro.`);

    return { digest: lines.join("\n"), hasData: insights.booksThisYear > 0 || insights.daysRead > 0 };
}

// Solo lee caché; NO llama a Mistral.
export async function peekStatsNarrative(): Promise<NarrativePeek> {
    const access = await getAssistantAccess();
    if (!access.allowed || !access.userId) {
        return { status: "locked", reason: access.reason === "unauthenticated" ? "unauthenticated" : "requires_plan" };
    }
    const cached = await getCachedGeneration<{ text: string }>(access.userId, "stats_narrative");
    if (cached?.text) return { status: "ok", text: cached.text, cached: true };
    return { status: "empty" };
}

export async function getStatsNarrative(tz?: string, forceRefresh = false): Promise<NarrativeResult> {
    const access = await getAssistantAccess();
    if (!access.allowed || !access.userId) {
        return { status: "locked", reason: access.reason === "unauthenticated" ? "unauthenticated" : "requires_plan" };
    }
    const userId = access.userId;

    if (!forceRefresh) {
        const cached = await getCachedGeneration<{ text: string }>(userId, "stats_narrative");
        if (cached?.text) return { status: "ok", text: cached.text, cached: true };
    }

    const { digest, hasData } = await buildStatsDigest(tz);
    if (!hasData) return { status: "no_data" };

    if (!(await hasMonthlyQuota(userId, access.isAdmin))) return { status: "limit" };
    if (!(await withinRateLimit(userId, access.isAdmin))) return { status: "error", message: "Vas muy rápido. Espera unos segundos e inténtalo de nuevo." };

    const system =
        "Eres el narrador de Wordelia. A partir de las estadísticas de lectura del usuario, escribe un único párrafo " +
        "cálido, sereno y personal, en español y en segunda persona (tú), de 3-4 frases. Celebra 2-3 patrones concretos " +
        "usando sus números, sin comparar con nadie y sin juzgar, coherente con el lema 'sin comparaciones, solo tu ritmo'. " +
        "No uses listas ni títulos: solo el párrafo. No inventes datos que no aparezcan.";
    const user = `ESTADÍSTICAS DEL LECTOR:\n${digest}\n\nEscribe el párrafo.`;

    try {
        const { content, usage } = await callMistral({ system, user, maxTokens: FEATURE_MAX_TOKENS.stats_narrative });
        await logAiUsage(userId, "stats_narrative", usage);
        const text = content.trim();
        if (!text) return { status: "error", message: "No hemos podido generar la narrativa." };
        await saveGeneration(userId, "stats_narrative", { text });
        return { status: "ok", text, cached: false };
    } catch (e) {
        console.error("getStatsNarrative error:", e);
        return { status: "error", message: "No hemos podido generar la narrativa. Inténtalo de nuevo en un momento." };
    }
}
