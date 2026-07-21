"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";

export interface FollowState {
    isSelf: boolean;
    isFollowing: boolean;
    followers: number;
    following: number;
}

/** Estado de seguimiento de un perfil objetivo (contadores + si lo sigo). */
export async function getFollowState(targetUserId: string): Promise<FollowState> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const follows = () => supabase.from("follows") as any;

    const [followersRes, followingRes, mineRes] = await Promise.all([
        follows().select("*", { count: "exact", head: true }).eq("following_id", targetUserId),
        follows().select("*", { count: "exact", head: true }).eq("follower_id", targetUserId),
        user
            ? follows().select("*", { count: "exact", head: true }).eq("follower_id", user.id).eq("following_id", targetUserId)
            : Promise.resolve({ count: 0 }),
    ]);

    return {
        isSelf: user?.id === targetUserId,
        isFollowing: (mineRes.count ?? 0) > 0,
        followers: followersRes.count ?? 0,
        following: followingRes.count ?? 0,
    };
}

export interface Person {
    id: string;
    username: string | null;
    name: string | null;
    avatarUrl: string | null;
    isFollowing: boolean;
}

async function annotateFollowing(supabase: any, people: Person[], currentUserId?: string): Promise<Person[]> {
    if (!currentUserId || people.length === 0) return people;
    const { data } = await (supabase.from("follows") as any)
        .select("following_id")
        .eq("follower_id", currentUserId)
        .in("following_id", people.map((p) => p.id));
    const set = new Set(((data ?? []) as any[]).map((f) => f.following_id));
    return people.map((p) => ({ ...p, isFollowing: set.has(p.id) }));
}

function toPerson(row: any): Person {
    return { id: row.id, username: row.username ?? null, name: row.full_name ?? null, avatarUrl: row.avatar_url ?? null, isFollowing: false };
}

const READERS_PAGE_SIZE = 10;

/**
 * Listado paginado de lectores (10/página). Sin búsqueda = todos los que tienen
 * @usuario, por orden de alta; con búsqueda (>=2) filtra por nombre/@usuario.
 * Devuelve la página y si hay más.
 */
export async function listReadersAction(
    query: string,
    page = 0,
): Promise<{ people: Person[]; hasMore: boolean }> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const q = query.trim().replace(/^@/, "");
    const from = Math.max(0, page) * READERS_PAGE_SIZE;
    const to = from + READERS_PAGE_SIZE; // rango inclusivo → pedimos PAGE_SIZE+1 para saber si hay más

    let dbq = supabase.from("profiles").select("id, username, full_name, avatar_url").not("username", "is", null);
    if (q.length >= 2) {
        const safe = q.replace(/[%,()]/g, " ");
        dbq = dbq.or(`username.ilike.%${safe}%,full_name.ilike.%${safe}%`);
    }
    dbq = dbq.order("created_at", { ascending: false }).range(from, to);

    const { data } = await dbq;
    let rows = ((data ?? []) as any[]).filter((p) => p.id !== user?.id);
    const hasMore = rows.length > READERS_PAGE_SIZE;
    rows = rows.slice(0, READERS_PAGE_SIZE);

    const people = await annotateFollowing(supabase, rows.map(toPerson), user?.id);
    return { people, hasMore };
}

/** Lista de seguidores o de seguidos de un usuario. */
export async function getFollowListAction(userId: string, kind: "followers" | "following"): Promise<Person[]> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const col = kind === "followers" ? "follower_id" : "following_id";
    const otherCol = kind === "followers" ? "following_id" : "follower_id";

    const { data: rows } = await (supabase.from("follows") as any).select(col).eq(otherCol, userId).limit(100);
    const ids = ((rows ?? []) as any[]).map((r) => r[col]);
    if (ids.length === 0) return [];

    const { data: profiles } = await supabase.from("profiles").select("id, username, full_name, avatar_url").in("id", ids);
    const people = ((profiles ?? []) as any[]).map(toPerson);
    return annotateFollowing(supabase, people, user?.id);
}

export interface SimilarReader extends Person {
    sharedCount: number;
}

/**
 * Lectores afines: otros usuarios que han LEÍDO libros en común contigo, ordenados
 * por nº de coincidencias. Solo sugiere a quien aún no sigues. Service role para el
 * cruce entre usuarios (RLS bloquea leer user_books de otros).
 */
export async function getSimilarReaders(limit = 6): Promise<SimilarReader[]> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const admin = createAdminClient() as unknown as { from: (t: string) => any };

    // Afinidad por libros en común en la biblioteca (cualquier estado, no solo leídos)
    // para que surja gente aunque haya pocos "leídos".
    const LIB_STATUSES = ["READ", "READING", "WANT_TO_READ", "PAUSED"];
    const { data: mine } = await admin.from("user_books").select("book_id").eq("user_id", user.id).in("status", LIB_STATUSES);
    const myBookIds = [...new Set(((mine ?? []) as any[]).map((r) => r.book_id).filter(Boolean))];
    if (myBookIds.length === 0) return [];

    const { data: others } = await admin
        .from("user_books")
        .select("user_id")
        .in("book_id", myBookIds)
        .in("status", LIB_STATUSES)
        .neq("user_id", user.id)
        .limit(5000);
    const countByUser = new Map<string, number>();
    for (const r of (others ?? []) as any[]) countByUser.set(r.user_id, (countByUser.get(r.user_id) ?? 0) + 1);
    if (countByUser.size === 0) return [];

    const ranked = [...countByUser.entries()].sort((a, b) => b[1] - a[1]).slice(0, limit * 3);
    const ids = ranked.map(([id]) => id);

    const [{ data: profiles }, { data: follows }] = await Promise.all([
        admin.from("profiles").select("id, username, full_name, avatar_url").in("id", ids).not("username", "is", null),
        supabase.from("follows").select("following_id").eq("follower_id", user.id).in("following_id", ids),
    ]);
    const profById = new Map<string, any>(((profiles ?? []) as any[]).map((p) => [p.id, p]));
    const following = new Set(((follows ?? []) as any[]).map((f) => f.following_id));

    const out: SimilarReader[] = [];
    for (const [id, count] of ranked) {
        if (following.has(id)) continue; // sugerir solo no seguidos
        const p = profById.get(id);
        if (!p) continue;
        out.push({ id, username: p.username ?? null, name: p.full_name ?? null, avatarUrl: p.avatar_url ?? null, isFollowing: false, sharedCount: count });
        if (out.length >= limit) break;
    }
    return out;
}

/** Sigue o deja de seguir. Devuelve el nuevo estado (siguiendo o no). */
export async function toggleFollowAction(
    targetUserId: string,
): Promise<{ following: boolean } | { error: string }> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "No autenticado" };
    if (user.id === targetUserId) return { error: "No puedes seguirte a ti mismo." };

    const follows = () => supabase.from("follows") as any;

    const { data: existing } = await follows()
        .select("follower_id")
        .eq("follower_id", user.id)
        .eq("following_id", targetUserId)
        .maybeSingle();

    if (existing) {
        const { error } = await follows().delete().eq("follower_id", user.id).eq("following_id", targetUserId);
        if (error) return { error: error.message };
        revalidatePath("/app/perfil");
        return { following: false };
    }

    const { error } = await follows().insert({ follower_id: user.id, following_id: targetUserId });
    if (error) return { error: error.message };
    revalidatePath("/app/perfil");
    return { following: true };
}
