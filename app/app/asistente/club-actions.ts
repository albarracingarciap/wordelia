"use server";

import { createClient } from "@/utils/supabase/server";
import { createAdminClient, hasSupabaseAdminConfig } from "@/utils/supabase/admin";
import { getBookResourceAvailability } from "@/app/app/recursos/actions";
import { callMistral } from "@/lib/mistral";
import { FEATURE_MAX_TOKENS } from "@/lib/assistant-config";
import { isSubscriptionActive } from "@/lib/subscription-access";
import { hasMonthlyQuota, withinRateLimit, logAiUsage, getCachedGeneration, saveGeneration } from "@/lib/assistant-access";

// Umbral de anonimato: nunca resumimos emociones si hay muy pocos participantes
// (un resumen de 1-2 personas no sería anónimo).
const MIN_PARTICIPANTS = 3;

export interface ClubHostAccess {
    isHost: boolean;
    isAdmin: boolean;
    allowed: boolean;
    reason?: "unauthenticated" | "not_host" | "requires_plan";
}

// Gate de herramientas de anfitrión: host del club (owner o admin/moderador) Y
// (admin global · plan Bibliófilo · o club de una librería de la que es miembro).
export async function getClubHostAccess(clubId: string): Promise<ClubHostAccess> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { isHost: false, isAdmin: false, allowed: false, reason: "unauthenticated" };

    const [clubRes, membershipRes, profileRes, subRes] = await Promise.all([
        supabase.from("clubs").select("owner_id, organization_id").eq("id", clubId).maybeSingle(),
        supabase.from("club_members").select("role").eq("club_id", clubId).eq("user_id", user.id).maybeSingle(),
        supabase.from("profiles").select("role").eq("id", user.id).maybeSingle(),
        supabase.from("user_subscriptions").select("plan, status, current_period_end").eq("user_id", user.id).maybeSingle(),
    ]);

    const club = clubRes.data as { owner_id: string; organization_id: string | null } | null;
    if (!club) return { isHost: false, isAdmin: false, allowed: false, reason: "not_host" };

    const role = (membershipRes.data as { role?: string } | null)?.role;
    const isHost = club.owner_id === user.id || role === "admin" || role === "moderator";

    const globalRole = (profileRes.data as { role?: string } | null)?.role;
    const isAdmin = globalRole === "admin" || globalRole === "editor";
    const sub = subRes.data as { plan: string; status: string; current_period_end: string | null } | null;
    const isBibliofilo = !!sub && isSubscriptionActive(sub.status, sub.current_period_end) && sub.plan === "ai";

    let isLibraryMember = false;
    if (club.organization_id) {
        const { data: orgMember } = await supabase
            .from("organization_members")
            .select("user_id")
            .eq("organization_id", club.organization_id)
            .eq("user_id", user.id)
            .maybeSingle();
        isLibraryMember = !!orgMember;
    }

    if (!isHost) return { isHost: false, isAdmin, allowed: false, reason: "not_host" };
    const allowed = isAdmin || isBibliofilo || isLibraryMember;
    return { isHost, isAdmin, allowed, reason: allowed ? undefined : "requires_plan" };
}

export type ClubEmotionResult =
    | { status: "ok"; text: string; bookTitle: string; participants: number; cached: boolean }
    | { status: "locked"; reason: "unauthenticated" | "not_host" | "requires_plan" }
    | { status: "no_book" }
    | { status: "not_enough"; participants: number }
    | { status: "limit" }
    | { status: "error"; message: string };

export type ClubEmotionPeek = ClubEmotionResult | { status: "empty" };

type EmotionRow = { emotion: string; intensity: number | null; user_id: string };

// Agrega (anónimo) las emociones de los miembros sobre el libro actual del club.
async function buildEmotionDigest(clubId: string): Promise<
    | { ok: true; digest: string; bookTitle: string; participants: number }
    | { ok: false; reason: "no_book" | "not_enough"; participants: number }
> {
    const supabase = await createClient();

    const { data: cb } = await supabase
        .from("club_books")
        .select("book_id, books(title)")
        .eq("club_id", clubId)
        .eq("status", "current")
        .limit(1)
        .maybeSingle();
    const current = cb as { book_id: string; books: { title?: string } | { title?: string }[] | null } | null;
    if (!current?.book_id) return { ok: false, reason: "no_book", participants: 0 };
    const bookTitle = (Array.isArray(current.books) ? current.books[0] : current.books)?.title || "el libro";

    const { data: membersData } = await supabase.from("club_members").select("user_id").eq("club_id", clubId);
    const memberIds = ((membersData || []) as { user_id: string }[]).map((m) => m.user_id);
    if (memberIds.length === 0) return { ok: false, reason: "not_enough", participants: 0 };

    const { data: emoData } = await supabase
        .from("user_book_emotions")
        .select("emotion, intensity, user_id")
        .eq("book_id", current.book_id)
        .in("user_id", memberIds);
    const emotions = (emoData || []) as EmotionRow[];

    const participants = new Set(emotions.map((e) => e.user_id)).size;
    if (participants < MIN_PARTICIPANTS) return { ok: false, reason: "not_enough", participants };

    // Agregado por emoción: nº de registros + intensidad media. Nunca por persona.
    const agg: Record<string, { count: number; sum: number }> = {};
    for (const e of emotions) {
        const a = (agg[e.emotion] ||= { count: 0, sum: 0 });
        a.count += 1;
        a.sum += e.intensity || 0;
    }
    const distribution = Object.entries(agg)
        .sort((a, b) => b[1].count - a[1].count)
        .map(([emotion, a]) => `${emotion} ×${a.count} (intensidad media ${Math.round((a.sum / a.count) * 10) / 10}/5)`)
        .join("; ");

    const digest = `Libro: ${bookTitle}.\n${participants} lectores registraron su pulso emocional (${emotions.length} registros en total).\nDistribución agregada de emociones: ${distribution}.`;
    return { ok: true, digest, bookTitle, participants };
}

export async function peekClubEmotionalMap(clubId: string): Promise<ClubEmotionPeek> {
    const access = await getClubHostAccess(clubId);
    if (!access.allowed) return { status: "locked", reason: access.reason || "requires_plan" };
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { status: "locked", reason: "unauthenticated" };
    const cached = await getCachedGeneration<{ text: string; bookTitle: string; participants: number }>(user.id, "club_emotions", clubId);
    if (cached?.text) return { status: "ok", text: cached.text, bookTitle: cached.bookTitle, participants: cached.participants, cached: true };
    return { status: "empty" };
}

export async function getClubEmotionalMap(clubId: string, forceRefresh = false): Promise<ClubEmotionResult> {
    const access = await getClubHostAccess(clubId);
    if (!access.allowed) return { status: "locked", reason: access.reason || "requires_plan" };

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { status: "locked", reason: "unauthenticated" };
    const userId = user.id;

    if (!forceRefresh) {
        const cached = await getCachedGeneration<{ text: string; bookTitle: string; participants: number }>(userId, "club_emotions", clubId);
        if (cached?.text) return { status: "ok", text: cached.text, bookTitle: cached.bookTitle, participants: cached.participants, cached: true };
    }

    const built = await buildEmotionDigest(clubId);
    if (!built.ok) {
        return built.reason === "no_book" ? { status: "no_book" } : { status: "not_enough", participants: built.participants };
    }

    if (!(await hasMonthlyQuota(userId, access.isAdmin))) return { status: "limit" };
    if (!(await withinRateLimit(userId, access.isAdmin))) return { status: "error", message: "Vas muy rápido. Espera unos segundos e inténtalo de nuevo." };

    const system =
        "Eres el asistente de anfitriones de clubs de lectura de Wordelia. A partir del mapa emocional AGREGADO y " +
        "ANÓNIMO del grupo sobre un libro, escribe para el anfitrión una síntesis breve (4-6 frases) de cómo ha vivido " +
        "el grupo la lectura y sugiere 1-2 hilos de conversación que aprovechen esas emociones para la sesión. " +
        "NUNCA menciones ni identifiques a personas concretas: habla siempre del grupo en agregado. Español, cálido y útil, " +
        "sin listas: en prosa.";
    const user2 = `MAPA EMOCIONAL DEL CLUB (agregado, anónimo):\n${built.digest}\n\nEscribe la síntesis para el anfitrión.`;

    try {
        const { content, usage } = await callMistral({ system, user: user2, maxTokens: FEATURE_MAX_TOKENS.club_emotions });
        await logAiUsage(userId, "club_emotions", usage);
        const text = content.trim();
        if (!text) return { status: "error", message: "No hemos podido generar el resumen." };
        await saveGeneration(userId, "club_emotions", { text, bookTitle: built.bookTitle, participants: built.participants }, clubId);
        return { status: "ok", text, bookTitle: built.bookTitle, participants: built.participants, cached: false };
    } catch (e) {
        console.error("getClubEmotionalMap error:", e);
        return { status: "error", message: "No hemos podido generar el resumen. Inténtalo de nuevo en un momento." };
    }
}

// ============================================================
// F3b · "Preparar sesión" (agenda + preguntas desde guía + genoma)
// ============================================================

export type ClubSessionResult =
    | { status: "ok"; text: string; bookTitle: string; cached: boolean }
    | { status: "locked"; reason: "unauthenticated" | "not_host" | "requires_plan" }
    | { status: "no_book" }
    | { status: "no_resources" }
    | { status: "limit" }
    | { status: "error"; message: string };

export type ClubSessionPeek = ClubSessionResult | { status: "empty" };

type AdminLike = { from: (t: string) => { select: (c: string) => { eq: (col: string, v: string) => Promise<{ data: Record<string, unknown>[] | null }> } } };

function pickPayload(row: Record<string, unknown>): unknown {
    const keys = ["guide_data", "guide", "content", "chromosome_data", "genome_data", "data", "analysis", "payload", "source_payload", "raw_payload"];
    for (const k of keys) {
        if (row[k] !== null && row[k] !== undefined) return row[k];
    }
    return row;
}

function rowKey(row: Record<string, unknown>, i: number): string {
    for (const k of ["chromosome_key", "chromosome", "key", "type", "name", "slug"]) {
        const v = row[k];
        if (typeof v === "string" && v.trim()) return v;
    }
    return `cromosoma_${i + 1}`;
}

function truncate(s: string, max: number): string {
    return s.length > max ? s.slice(0, max) + "…" : s;
}

// Serializa guía + genoma del libro actual del club para el prompt.
async function buildSessionDigest(clubId: string): Promise<
    | { ok: true; digest: string; bookTitle: string }
    | { ok: false; reason: "no_book" | "no_resources" }
> {
    const supabase = await createClient();

    const { data: cb } = await supabase
        .from("club_books")
        .select("book_id, books(title)")
        .eq("club_id", clubId)
        .eq("status", "current")
        .limit(1)
        .maybeSingle();
    const current = cb as { book_id: string; books: { title?: string } | { title?: string }[] | null } | null;
    if (!current?.book_id) return { ok: false, reason: "no_book" };
    const bookTitle = (Array.isArray(current.books) ? current.books[0] : current.books)?.title || "el libro";

    if (!hasSupabaseAdminConfig()) return { ok: false, reason: "no_resources" };
    const admin = createAdminClient() as unknown as AdminLike;

    // Resuelve qué ficha tiene realmente guía/genoma (puede vivir en un duplicado por ISBN).
    let isbn: string | null = null;
    const { data: eds } = await admin.from("editions").select("isbn13, isbn").eq("book_id", current.book_id);
    const firstEd = (eds || [])[0] as { isbn13?: string | null; isbn?: string | null } | undefined;
    isbn = firstEd?.isbn13 || firstEd?.isbn || null;

    const avail = await getBookResourceAvailability(current.book_id, isbn);
    if (!avail.hasGuide && !avail.hasGenome) return { ok: false, reason: "no_resources" };

    const parts: string[] = [`LIBRO: ${bookTitle}.`];

    if (avail.guideBookId) {
        const { data: guideRows } = await admin.from("book_guides").select("*").eq("book_id", avail.guideBookId);
        const first = (guideRows || [])[0];
        if (first) parts.push(`GUÍA DE DISCUSIÓN:\n${truncate(JSON.stringify(pickPayload(first)), 9000)}`);
    }

    if (avail.genomeBookId) {
        const { data: genomeRows } = await admin.from("book_literary_chromosomes").select("*").eq("book_id", avail.genomeBookId);
        const rows = genomeRows || [];
        if (rows.length) {
            const combined = rows.length === 1
                ? pickPayload(rows[0])
                : rows.reduce<Record<string, unknown>>((acc, r, i) => { acc[rowKey(r, i)] = pickPayload(r); return acc; }, {});
            parts.push(`GENOMA LITERARIO (análisis por cromosomas):\n${truncate(JSON.stringify(combined), 24000)}`);
        }
    }

    if (parts.length === 1) return { ok: false, reason: "no_resources" };
    return { ok: true, digest: parts.join("\n\n"), bookTitle };
}

export async function peekClubSessionPlan(clubId: string): Promise<ClubSessionPeek> {
    const access = await getClubHostAccess(clubId);
    if (!access.allowed) return { status: "locked", reason: access.reason || "requires_plan" };
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { status: "locked", reason: "unauthenticated" };
    const cached = await getCachedGeneration<{ text: string; bookTitle: string }>(user.id, "club_session", clubId);
    if (cached?.text) return { status: "ok", text: cached.text, bookTitle: cached.bookTitle, cached: true };
    return { status: "empty" };
}

export async function getClubSessionPlan(clubId: string, forceRefresh = false): Promise<ClubSessionResult> {
    const access = await getClubHostAccess(clubId);
    if (!access.allowed) return { status: "locked", reason: access.reason || "requires_plan" };

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { status: "locked", reason: "unauthenticated" };
    const userId = user.id;

    if (!forceRefresh) {
        const cached = await getCachedGeneration<{ text: string; bookTitle: string }>(userId, "club_session", clubId);
        if (cached?.text) return { status: "ok", text: cached.text, bookTitle: cached.bookTitle, cached: true };
    }

    const built = await buildSessionDigest(clubId);
    if (!built.ok) return built.reason === "no_book" ? { status: "no_book" } : { status: "no_resources" };

    if (!(await hasMonthlyQuota(userId, access.isAdmin))) return { status: "limit" };
    if (!(await withinRateLimit(userId, access.isAdmin))) return { status: "error", message: "Vas muy rápido. Espera unos segundos e inténtalo de nuevo." };

    const system =
        "Eres el asistente de anfitriones de clubs de lectura de Wordelia. A partir de la guía de discusión y el genoma " +
        "literario del libro (el club ya lo ha leído, puedes hablar de toda la obra), prepara para el anfitrión un PLAN DE " +
        "SESIÓN práctico: (1) una agenda breve con bloques y tiempos aproximados para ~60 min, y (2) entre 5 y 7 preguntas " +
        "de análisis ordenadas de lo general a lo profundo, ancladas en los temas, la estructura, los personajes y el estilo " +
        "que aparecen en el genoma. Español, claro y accionable. Usa markdown sencillo (encabezados y listas). No inventes " +
        "datos que no aparezcan en el material.";
    const user2 = `MATERIAL DEL LIBRO:\n${built.digest}\n\nPrepara el plan de sesión.`;

    try {
        const { content, usage } = await callMistral({ system, user: user2, maxTokens: FEATURE_MAX_TOKENS.club_session });
        await logAiUsage(userId, "club_session", usage);
        const text = content.trim();
        if (!text) return { status: "error", message: "No hemos podido preparar la sesión." };
        await saveGeneration(userId, "club_session", { text, bookTitle: built.bookTitle }, clubId);
        return { status: "ok", text, bookTitle: built.bookTitle, cached: false };
    } catch (e) {
        console.error("getClubSessionPlan error:", e);
        return { status: "error", message: "No hemos podido preparar la sesión. Inténtalo de nuevo en un momento." };
    }
}
