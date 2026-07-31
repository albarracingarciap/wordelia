"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { selectInChunks } from "@/lib/supabase-chunks";

export interface RetoItem {
    id: string;
    title: string;
    description: string | null;
    startDate: string | null;
    endDate: string | null;
    rules: string | null;
    goalType: string | null;
    goalTarget: number | null;
    goalGenre: string | null;
    rewardBadgeName: string | null;
    joined: boolean;
    progress: number;
    completed: boolean;
    active: boolean;
    participants: number;
    origin: "wordelia" | "community"; // oficial vs propuesto por la comunidad
    authorName: string | null;        // autor si es de comunidad
}

// Progreso del usuario para un reto, contado en vivo dentro de su ventana.
async function computeProgress(supabase: any, userId: string, ch: any): Promise<number> {
    const start = ch.start_date || "1900-01-01";
    const end = ch.end_date || "2999-12-31";

    if (ch.goal_type === "manual") {
        const { count } = await supabase
            .from("challenge_books")
            .select("*", { count: "exact", head: true })
            .eq("challenge_id", ch.id)
            .eq("user_id", userId);
        return count ?? 0;
    }

    if (ch.goal_type === "pages") {
        const { data } = await supabase
            .from("reading_sessions")
            .select("pages_read")
            .eq("user_id", userId)
            .gte("created_at", start)
            .lte("created_at", `${end}T23:59:59`);
        return (data ?? []).reduce((a: number, s: any) => a + (s.pages_read || 0), 0);
    }

    if (ch.goal_type === "genre") {
        const { data } = await supabase
            .from("user_books")
            .select("book:books(genre)")
            .eq("user_id", userId)
            .eq("status", "READ")
            .gte("finish_date", start)
            .lte("finish_date", end);
        const target = (ch.goal_genre || "").trim().toLowerCase();
        let c = 0;
        for (const r of (data ?? []) as any[]) {
            const b = Array.isArray(r.book) ? r.book[0] : r.book;
            if (b?.genre && String(b.genre).trim().toLowerCase() === target) c++;
        }
        return c;
    }

    // 'books' (por defecto)
    const { count } = await supabase
        .from("user_books")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("status", "READ")
        .gte("finish_date", start)
        .lte("finish_date", end);
    return count ?? 0;
}

// Marca la participación como completada (idempotente) y concede la insignia.
async function completeParticipation(userId: string, ch: any): Promise<void> {
    const admin = createAdminClient() as unknown as { from: (t: string) => any };
    const { data: claimed } = await admin
        .from("challenge_participants")
        .update({ completed_at: new Date().toISOString() })
        .eq("challenge_id", ch.id)
        .eq("user_id", userId)
        .is("completed_at", null)
        .select("id");
    if (!claimed || claimed.length === 0) return; // ya estaba completado
    if (ch.reward_badge_id) {
        await admin
            .from("user_badges")
            .upsert({ user_id: userId, badge_id: ch.reward_badge_id }, { onConflict: "user_id,badge_id", ignoreDuplicates: true });
    }
}

/** Retos publicados con mi participación/progreso. Completa+premia en vivo. */
export async function getRetosView(): Promise<RetoItem[]> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const today = new Date().toISOString().slice(0, 10);

    const { data: challenges } = await (supabase.from("challenges") as any)
        .select("*")
        .eq("is_published", true)
        .eq("moderation_status", "approved")
        .order("end_date", { ascending: true });
    const rows = (challenges ?? []) as any[];
    if (rows.length === 0) return [];

    const { data: parts } = await (supabase.from("challenge_participants") as any)
        .select("challenge_id, completed_at")
        .eq("user_id", user.id);
    const partMap = new Map<string, any>((parts ?? []).map((p: any) => [p.challenge_id, p]));

    // Nombres de insignia de recompensa + recuento de participantes (service role).
    const admin = createAdminClient() as unknown as { from: (t: string) => any };
    const badgeIds = rows.map((r) => r.reward_badge_id).filter(Boolean);
    let badgeNames: Record<string, string> = {};
    if (badgeIds.length) {
        const { data: bs } = await admin.from("badges").select("id, name").in("id", badgeIds);
        badgeNames = Object.fromEntries((bs ?? []).map((b: any) => [b.id, b.name]));
    }
    const { data: allParts } = await admin
        .from("challenge_participants")
        .select("challenge_id")
        .in("challenge_id", rows.map((r) => r.id));
    const counts: Record<string, number> = {};
    for (const p of (allParts ?? []) as any[]) counts[p.challenge_id] = (counts[p.challenge_id] ?? 0) + 1;

    // Nombres de autor para los retos de comunidad (created_by).
    const authorIds = rows.map((r) => r.created_by).filter(Boolean);
    let authorNames: Record<string, string> = {};
    if (authorIds.length) {
        const { data: ps } = await admin.from("profiles").select("id, full_name, username").in("id", authorIds);
        authorNames = Object.fromEntries((ps ?? []).map((p: any) => [p.id, p.full_name || p.username || "Un lector"]));
    }

    const result: RetoItem[] = [];
    for (const ch of rows) {
        const part = partMap.get(ch.id);
        const joined = !!part;
        let completed = !!part?.completed_at;
        let progress = 0;
        if (joined) {
            progress = await computeProgress(supabase, user.id, ch);
            const target = ch.goal_target ?? 0;
            if (!completed && target > 0 && progress >= target) {
                await completeParticipation(user.id, ch);
                completed = true;
            }
        }
        result.push({
            id: ch.id,
            title: ch.title,
            description: ch.description ?? null,
            startDate: ch.start_date ?? null,
            endDate: ch.end_date ?? null,
            rules: ch.rules ?? null,
            goalType: ch.goal_type ?? null,
            goalTarget: ch.goal_target ?? null,
            goalGenre: ch.goal_genre ?? null,
            rewardBadgeName: ch.reward_badge_id ? (badgeNames[ch.reward_badge_id] ?? null) : (ch.reward_badge_name ?? null),
            joined,
            progress,
            completed,
            active: !ch.end_date || ch.end_date >= today,
            participants: counts[ch.id] ?? 0,
            origin: ch.created_by ? "community" : "wordelia",
            authorName: ch.created_by ? (authorNames[ch.created_by] ?? null) : null,
        });
    }
    return result;
}

/** Unirse a un reto. */
export async function joinChallenge(challengeId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Debes iniciar sesión" };

    const { error } = await (supabase.from("challenge_participants") as any)
        .insert({ challenge_id: challengeId, user_id: user.id });
    if (error && !`${error.message}`.toLowerCase().includes("duplicate")) {
        console.error("[joinChallenge]", error);
        return { error: "No se pudo unir al reto" };
    }
    revalidatePath("/app/retos");
    return { success: true };
}

/**
 * Reto recomendado para el perfil: un reto REAL (publicado, activo, no unido) que
 * encaje con los géneros favoritos del usuario. Si no hay ninguno, devuelve null
 * (la tarjeta se oculta). Sustituye al placeholder hardcodeado que había antes.
 */
export async function getRecommendedChallenge(favoriteGenres: string[] = []): Promise<RetoItem | null> {
    const retos = await getRetosView();
    const open = retos.filter((r) => r.active && !r.joined && !r.completed);
    if (open.length === 0) return null;

    const favs = favoriteGenres.map((g) => g.toLowerCase());
    const genreMatch = open.find((r) => r.goalGenre && favs.includes(r.goalGenre.toLowerCase()));
    return genreMatch ?? open[0];
}

export interface ProposeChallengeInput {
    title: string;
    description?: string;
    goalType: string; // 'books' | 'genre' | 'pages'
    goalTarget: number;
    goalGenre?: string;
    startDate?: string;
    endDate?: string;
}

/** Proponer un reto de comunidad. Queda 'pending' hasta que un admin lo apruebe. */
export async function proposeChallenge(input: ProposeChallengeInput): Promise<{ success?: true; error?: string }> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Debes iniciar sesión" };

    const title = input.title.trim();
    if (!title) return { error: "El título es obligatorio." };
    if (!["books", "genre", "pages", "manual"].includes(input.goalType)) return { error: "Tipo de objetivo no válido." };
    const target = Number(input.goalTarget);
    if (!Number.isFinite(target) || target < 1) return { error: "El objetivo debe ser al menos 1." };
    if (input.goalType === "genre" && !input.goalGenre?.trim()) return { error: "Indica el género del reto." };
    if (input.startDate && input.endDate && input.endDate < input.startDate) return { error: "La fecha de fin no puede ser anterior a la de inicio." };

    const { error } = await (supabase.from("challenges") as any).insert({
        title,
        description: input.description?.trim() || null,
        goal_type: input.goalType,
        goal_target: Math.round(target),
        goal_genre: input.goalType === "genre" ? input.goalGenre?.trim() : null,
        start_date: input.startDate || null,
        end_date: input.endDate || null,
        created_by: user.id,
        is_published: false,
        moderation_status: "pending",
    });
    if (error) {
        console.error("[proposeChallenge]", error);
        return { error: "No se pudo enviar la propuesta." };
    }
    revalidatePath("/app/retos");
    return { success: true };
}

export interface MyProposal {
    id: string;
    title: string;
    description: string | null;
    goalType: string | null;
    goalTarget: number | null;
    goalGenre: string | null;
    status: "pending" | "approved" | "rejected";
    createdAt: string;
}

/** Mis propuestas de reto de comunidad (para ver su estado en /app/retos). */
export async function getMyProposals(): Promise<MyProposal[]> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data } = await (supabase.from("challenges") as any)
        .select("id, title, description, goal_type, goal_target, goal_genre, moderation_status, created_at")
        .eq("created_by", user.id)
        .order("created_at", { ascending: false });

    return ((data ?? []) as any[]).map((c) => ({
        id: c.id,
        title: c.title,
        description: c.description ?? null,
        goalType: c.goal_type ?? null,
        goalTarget: c.goal_target ?? null,
        goalGenre: c.goal_genre ?? null,
        status: (c.moderation_status ?? "pending") as MyProposal["status"],
        createdAt: c.created_at,
    }));
}

// ===== Detalle de un reto =====

export interface CountingBook {
    id: string;              // book id
    title: string;
    author: string | null;
    coverUrl: string | null;
    detail: string | null;   // fecha de fin o páginas, según el tipo
}

export interface ParticipantRow {
    userId: string;
    name: string;
    avatarUrl: string | null;
    progress: number;
    completed: boolean;
    isMe: boolean;
}

export interface RetoDetail {
    reto: RetoItem;
    countingBooks: CountingBook[];
    participants: ParticipantRow[];
}

type AdminClient = { from: (t: string) => any };

/** Portadas (editions.cover_url) para una lista de edition ids. */
async function fetchEditionCovers(admin: AdminClient, editionIds: string[]): Promise<Record<string, string | null>> {
    if (editionIds.length === 0) return {};
    const { data } = await selectInChunks<any>(editionIds, (chunk) =>
        admin.from("editions").select("id, cover_url").in("id", chunk));
    return Object.fromEntries((data ?? []).map((e: any) => [e.id, e.cover_url ?? null]));
}

/** Datos + portada para una lista de book ids (usa edición de sesión o la preferida). */
async function fetchBooksWithCovers(
    admin: AdminClient,
    bookIds: string[],
    editionByBook: Record<string, string | null>,
): Promise<Record<string, { title: string; author: string | null; coverUrl: string | null }>> {
    const result: Record<string, { title: string; author: string | null; coverUrl: string | null }> = {};
    if (bookIds.length === 0) return result;
    const { data: books } = await selectInChunks<any>(bookIds, (chunk) =>
        admin.from("books").select("id, title, author, preferred_edition_id").in("id", chunk));
    const editionIds = new Set<string>();
    for (const b of (books ?? []) as any[]) if (b.preferred_edition_id) editionIds.add(b.preferred_edition_id);
    for (const bid of bookIds) { const e = editionByBook[bid]; if (e) editionIds.add(e); }
    const covers = await fetchEditionCovers(admin, [...editionIds]);
    for (const b of (books ?? []) as any[]) {
        const sessEd = editionByBook[b.id];
        const cover = (sessEd && covers[sessEd]) || (b.preferred_edition_id && covers[b.preferred_edition_id]) || null;
        result[b.id] = { title: b.title, author: b.author ?? null, coverUrl: cover };
    }
    return result;
}

/** Progreso de MUCHOS usuarios a la vez (para la clasificación), con service role. */
async function computeProgressBatch(admin: AdminClient, userIds: string[], ch: any): Promise<Map<string, number>> {
    const map = new Map<string, number>();
    if (userIds.length === 0) return map;
    const start = ch.start_date || "1900-01-01";
    const end = ch.end_date || "2999-12-31";

    if (ch.goal_type === "manual") {
        const { data } = await admin.from("challenge_books").select("user_id").eq("challenge_id", ch.id);
        for (const r of (data ?? []) as any[]) map.set(r.user_id, (map.get(r.user_id) ?? 0) + 1);
        return map;
    }

    if (ch.goal_type === "pages") {
        const { data } = await selectInChunks<any>(userIds, (chunk) =>
            admin.from("reading_sessions").select("user_id, pages_read")
                .in("user_id", chunk).gte("created_at", start).lte("created_at", `${end}T23:59:59`));
        for (const s of (data ?? []) as any[]) map.set(s.user_id, (map.get(s.user_id) ?? 0) + (s.pages_read || 0));
        return map;
    }

    if (ch.goal_type === "genre") {
        const target = (ch.goal_genre || "").trim().toLowerCase();
        const { data } = await selectInChunks<any>(userIds, (chunk) =>
            admin.from("user_books").select("user_id, book:books(genre)")
                .in("user_id", chunk).eq("status", "READ").gte("finish_date", start).lte("finish_date", end));
        for (const r of (data ?? []) as any[]) {
            const b = Array.isArray(r.book) ? r.book[0] : r.book;
            if (b?.genre && String(b.genre).trim().toLowerCase() === target) map.set(r.user_id, (map.get(r.user_id) ?? 0) + 1);
        }
        return map;
    }

    const { data } = await selectInChunks<any>(userIds, (chunk) =>
        admin.from("user_books").select("user_id")
            .in("user_id", chunk).eq("status", "READ").gte("finish_date", start).lte("finish_date", end));
    for (const r of (data ?? []) as any[]) map.set(r.user_id, (map.get(r.user_id) ?? 0) + 1);
    return map;
}

/** Los libros del usuario que cuentan para este reto (con portada). */
async function getCountingBooks(supabase: any, admin: AdminClient, userId: string, ch: any): Promise<CountingBook[]> {
    const start = ch.start_date || "1900-01-01";
    const end = ch.end_date || "2999-12-31";

    if (ch.goal_type === "manual") {
        const { data } = await supabase.from("challenge_books")
            .select("book_id, book:books(id, title, author, preferred_edition_id)")
            .eq("challenge_id", ch.id).eq("user_id", userId)
            .order("created_at", { ascending: false });
        const rows = (data ?? []) as any[];
        // Portada preferida del catálogo (+ edición del usuario si la tiene).
        const bookIds = rows.map((r) => r.book_id);
        const editionByBook: Record<string, string | null> = {};
        if (bookIds.length) {
            const { data: ub } = await selectInChunks<any>(bookIds, (chunk) =>
                supabase.from("user_books").select("book_id, edition_id").eq("user_id", userId).in("book_id", chunk));
            for (const r of (ub ?? []) as any[]) if (r.edition_id) editionByBook[r.book_id] = r.edition_id;
        }
        const editionIds = new Set<string>();
        for (const r of rows) {
            const b = Array.isArray(r.book) ? r.book[0] : r.book;
            if (b?.preferred_edition_id) editionIds.add(b.preferred_edition_id);
            if (editionByBook[r.book_id]) editionIds.add(editionByBook[r.book_id]!);
        }
        const covers = await fetchEditionCovers(admin, [...editionIds]);
        return rows.map((r) => {
            const b = Array.isArray(r.book) ? r.book[0] : r.book;
            const userEd = editionByBook[r.book_id];
            const cover = (userEd && covers[userEd]) || (b?.preferred_edition_id && covers[b.preferred_edition_id]) || null;
            return { id: b?.id ?? r.book_id, title: b?.title ?? "Libro", author: b?.author ?? null, coverUrl: cover, detail: null };
        });
    }

    if (ch.goal_type === "pages") {
        const { data } = await supabase.from("reading_sessions")
            .select("book_id, pages_read, edition_id")
            .eq("user_id", userId).gte("created_at", start).lte("created_at", `${end}T23:59:59`);
        const byBook = new Map<string, { pages: number; editionId: string | null }>();
        for (const s of (data ?? []) as any[]) {
            if (!s.book_id) continue;
            const cur = byBook.get(s.book_id) ?? { pages: 0, editionId: s.edition_id ?? null };
            cur.pages += s.pages_read || 0;
            if (!cur.editionId && s.edition_id) cur.editionId = s.edition_id;
            byBook.set(s.book_id, cur);
        }
        const bookIds = [...byBook.keys()];
        const editionByBook = Object.fromEntries([...byBook].map(([k, v]) => [k, v.editionId]));
        const books = await fetchBooksWithCovers(admin, bookIds, editionByBook);
        return bookIds
            .map((id) => {
                const b = books[id];
                const pages = byBook.get(id)!.pages;
                return { id, title: b?.title ?? "Libro", author: b?.author ?? null, coverUrl: b?.coverUrl ?? null, detail: `${pages} pág.`, _pages: pages };
            })
            .sort((a, b) => b._pages - a._pages)
            .map(({ _pages, ...rest }) => rest);
    }

    // 'books' / 'genre'
    const { data } = await supabase.from("user_books")
        .select("book_id, edition_id, finish_date, book:books(id, title, author, genre, preferred_edition_id)")
        .eq("user_id", userId).eq("status", "READ").gte("finish_date", start).lte("finish_date", end)
        .order("finish_date", { ascending: false });
    let rows = (data ?? []) as any[];
    if (ch.goal_type === "genre") {
        const target = (ch.goal_genre || "").trim().toLowerCase();
        rows = rows.filter((r) => {
            const b = Array.isArray(r.book) ? r.book[0] : r.book;
            return b?.genre && String(b.genre).trim().toLowerCase() === target;
        });
    }
    const editionIds = new Set<string>();
    for (const r of rows) {
        const b = Array.isArray(r.book) ? r.book[0] : r.book;
        if (r.edition_id) editionIds.add(r.edition_id);
        if (b?.preferred_edition_id) editionIds.add(b.preferred_edition_id);
    }
    const covers = await fetchEditionCovers(admin, [...editionIds]);
    return rows.map((r) => {
        const b = Array.isArray(r.book) ? r.book[0] : r.book;
        const cover = (r.edition_id && covers[r.edition_id]) || (b?.preferred_edition_id && covers[b.preferred_edition_id]) || null;
        return {
            id: b?.id ?? r.book_id,
            title: b?.title ?? "Libro",
            author: b?.author ?? null,
            coverUrl: cover,
            detail: r.finish_date ? new Date(r.finish_date).toLocaleDateString("es-ES", { day: "numeric", month: "short" }) : null,
        };
    });
}

/** Detalle completo de un reto: progreso, libros que cuentan y clasificación. */
export async function getRetoDetail(id: string): Promise<RetoDetail | null> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const today = new Date().toISOString().slice(0, 10);

    const { data: ch } = await (supabase.from("challenges") as any)
        .select("*").eq("id", id).eq("is_published", true).eq("moderation_status", "approved").maybeSingle();
    if (!ch) return null;

    const admin = createAdminClient() as unknown as AdminClient;

    // Mi participación + progreso (completa+premia en vivo si procede).
    const { data: part } = await (supabase.from("challenge_participants") as any)
        .select("completed_at").eq("user_id", user.id).eq("challenge_id", id).maybeSingle();
    const joined = !!part;
    let completed = !!part?.completed_at;
    const myProgress = await computeProgress(supabase, user.id, ch);
    const target = ch.goal_target ?? 0;
    if (joined && !completed && target > 0 && myProgress >= target) {
        await completeParticipation(user.id, ch);
        completed = true;
    }

    // Nombre de insignia + autor (si es de comunidad).
    let rewardBadgeName: string | null = ch.reward_badge_name ?? null;
    if (ch.reward_badge_id) {
        const { data: b } = await admin.from("badges").select("name").eq("id", ch.reward_badge_id).maybeSingle();
        rewardBadgeName = b?.name ?? rewardBadgeName;
    }
    let authorName: string | null = null;
    if (ch.created_by) {
        const { data: p } = await admin.from("profiles").select("full_name, username").eq("id", ch.created_by).maybeSingle();
        authorName = p?.full_name || p?.username || "Un lector";
    }

    // Participantes + clasificación.
    const { data: allParts } = await admin.from("challenge_participants")
        .select("user_id, completed_at").eq("challenge_id", id);
    const partRows = (allParts ?? []) as any[];
    const userIds = partRows.map((p) => p.user_id);
    let profMap: Record<string, any> = {};
    if (userIds.length) {
        const { data: profs } = await selectInChunks<any>(userIds, (chunk) =>
            admin.from("profiles").select("id, full_name, username, avatar_url").in("id", chunk));
        profMap = Object.fromEntries((profs ?? []).map((p: any) => [p.id, p]));
    }
    const progressMap = await computeProgressBatch(admin, userIds, ch);
    const participants: ParticipantRow[] = partRows
        .map((p) => {
            const prof = profMap[p.user_id];
            return {
                userId: p.user_id,
                name: prof?.full_name || prof?.username || "Un lector",
                avatarUrl: prof?.avatar_url ?? null,
                progress: progressMap.get(p.user_id) ?? 0,
                completed: !!p.completed_at,
                isMe: p.user_id === user.id,
            };
        })
        .sort((a, b) => (b.completed ? 1 : 0) - (a.completed ? 1 : 0) || b.progress - a.progress);

    const countingBooks = await getCountingBooks(supabase, admin, user.id, ch);

    const reto: RetoItem = {
        id: ch.id,
        title: ch.title,
        description: ch.description ?? null,
        startDate: ch.start_date ?? null,
        endDate: ch.end_date ?? null,
        rules: ch.rules ?? null,
        goalType: ch.goal_type ?? null,
        goalTarget: ch.goal_target ?? null,
        goalGenre: ch.goal_genre ?? null,
        rewardBadgeName,
        joined,
        progress: myProgress,
        completed,
        active: !ch.end_date || ch.end_date >= today,
        participants: partRows.length,
        origin: ch.created_by ? "community" : "wordelia",
        authorName,
    };

    return { reto, countingBooks, participants };
}

// ===== Retos curados (manual): marcar qué libros cuentan =====

export interface PickerBook {
    id: string;              // book id
    title: string;
    author: string | null;
    coverUrl: string | null;
    attributed: boolean;     // ya marcado para este reto
}

async function loadManualChallenge(supabase: any, challengeId: string): Promise<any | null> {
    const { data: ch } = await (supabase.from("challenges") as any)
        .select("*").eq("id", challengeId).eq("is_published", true).eq("moderation_status", "approved").maybeSingle();
    if (!ch || ch.goal_type !== "manual") return null;
    return ch;
}

/** Los libros leídos del usuario, con marca de si ya cuentan para el reto. */
export async function getChallengeBookPicker(challengeId: string): Promise<PickerBook[]> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];
    const ch = await loadManualChallenge(supabase, challengeId);
    if (!ch) return [];

    const admin = createAdminClient() as unknown as AdminClient;

    const { data: ub } = await supabase.from("user_books")
        .select("book_id, edition_id, finish_date, book:books(id, title, author, preferred_edition_id)")
        .eq("user_id", user.id).eq("status", "READ")
        .order("finish_date", { ascending: false });
    const rows = (ub ?? []) as any[];

    const editionIds = new Set<string>();
    for (const r of rows) {
        const b = Array.isArray(r.book) ? r.book[0] : r.book;
        if (r.edition_id) editionIds.add(r.edition_id);
        if (b?.preferred_edition_id) editionIds.add(b.preferred_edition_id);
    }
    const covers = await fetchEditionCovers(admin, [...editionIds]);

    const { data: attr } = await supabase.from("challenge_books")
        .select("book_id").eq("challenge_id", challengeId).eq("user_id", user.id);
    const attributed = new Set<string>((attr ?? []).map((a: any) => a.book_id));

    // Deduplica por libro (un usuario puede tener el mismo libro en varias filas).
    const seen = new Set<string>();
    const out: PickerBook[] = [];
    for (const r of rows) {
        const b = Array.isArray(r.book) ? r.book[0] : r.book;
        const id = b?.id ?? r.book_id;
        if (!id || seen.has(id)) continue;
        seen.add(id);
        const cover = (r.edition_id && covers[r.edition_id]) || (b?.preferred_edition_id && covers[b.preferred_edition_id]) || null;
        out.push({ id, title: b?.title ?? "Libro", author: b?.author ?? null, coverUrl: cover, attributed: attributed.has(id) });
    }
    return out;
}

/** Marca un libro (leído) como contable para un reto curado. Auto-une si hace falta. */
export async function attributeBookToChallenge(challengeId: string, bookId: string): Promise<{ success?: true; error?: string }> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Debes iniciar sesión" };

    const ch = await loadManualChallenge(supabase, challengeId);
    if (!ch) return { error: "Este reto no admite selección manual." };

    // Solo libros que el usuario ha marcado como leídos.
    const { data: read } = await supabase.from("user_books")
        .select("id").eq("user_id", user.id).eq("book_id", bookId).eq("status", "READ").limit(1).maybeSingle();
    if (!read) return { error: "Solo puedes añadir libros que hayas marcado como leídos." };

    // Asegura participación (unirse) para aparecer en la clasificación.
    await (supabase.from("challenge_participants") as any).insert({ challenge_id: challengeId, user_id: user.id });

    const { error } = await (supabase.from("challenge_books") as any)
        .insert({ challenge_id: challengeId, user_id: user.id, book_id: bookId });
    if (error && !`${error.message}`.toLowerCase().includes("duplicate")) {
        console.error("[attributeBookToChallenge]", error);
        return { error: "No se pudo añadir el libro al reto." };
    }

    // Completa + premia en vivo si se alcanza el objetivo.
    const progress = await computeProgress(supabase, user.id, ch);
    const target = ch.goal_target ?? 0;
    if (target > 0 && progress >= target) await completeParticipation(user.id, ch);

    revalidatePath(`/app/retos/${challengeId}`);
    revalidatePath("/app/retos");
    return { success: true };
}

export interface ManualChallengeForBook {
    id: string;
    title: string;
    goalTarget: number | null;
    attributed: boolean;
}

/**
 * Retos curados (manuales) activos a los que se puede añadir ESTE libro desde su
 * ficha. Solo si el usuario lo tiene marcado como leído. Devuelve [] si no aplica.
 */
export async function getManualChallengesForBook(bookId: string): Promise<ManualChallengeForBook[]> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    // Solo libros leídos pueden atribuirse.
    const { data: read } = await supabase.from("user_books")
        .select("id").eq("user_id", user.id).eq("book_id", bookId).eq("status", "READ").limit(1).maybeSingle();
    if (!read) return [];

    const today = new Date().toISOString().slice(0, 10);
    const { data: chs } = await (supabase.from("challenges") as any)
        .select("id, title, goal_target, end_date")
        .eq("is_published", true).eq("moderation_status", "approved").eq("goal_type", "manual")
        .order("end_date", { ascending: true });
    const rows = ((chs ?? []) as any[]).filter((c) => !c.end_date || c.end_date >= today);
    if (rows.length === 0) return [];

    const { data: attr } = await supabase.from("challenge_books")
        .select("challenge_id").eq("user_id", user.id).eq("book_id", bookId);
    const attributed = new Set<string>((attr ?? []).map((a: any) => a.challenge_id));

    return rows.map((c) => ({ id: c.id, title: c.title, goalTarget: c.goal_target ?? null, attributed: attributed.has(c.id) }));
}

/** Quita un libro de un reto curado. */
export async function removeBookFromChallenge(challengeId: string, bookId: string): Promise<{ success?: true; error?: string }> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Debes iniciar sesión" };

    const { error } = await (supabase.from("challenge_books") as any)
        .delete().eq("challenge_id", challengeId).eq("user_id", user.id).eq("book_id", bookId);
    if (error) {
        console.error("[removeBookFromChallenge]", error);
        return { error: "No se pudo quitar el libro del reto." };
    }
    revalidatePath(`/app/retos/${challengeId}`);
    revalidatePath("/app/retos");
    return { success: true };
}
