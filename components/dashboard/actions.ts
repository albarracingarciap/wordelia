"use server";

import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { selectInChunks } from "@/lib/supabase-chunks";

export interface ActivityFeedItem {
    id: string;
    type: string;
    user: {
        name: string;
        avatar: string | null;
    };
    content: string;
    subtext: string | null;
    metadata: any;
    time: string;
    likes: number;
    isLikedByMe: boolean;
}

export interface FollowingReadingItem {
    userId: string;
    userName: string;
    username: string | null;
    avatar: string | null;
    bookId: string;
    bookTitle: string;
    coverUrl: string | null;
}

/**
 * Qué están leyendo AHORA las personas que sigues (user_books status READING).
 * Sale al instante aunque no hayan generado eventos de actividad. Respeta la
 * privacidad (show_recent_reads / visibilidad), por eso se lee con service role
 * y se filtra a mano (RLS bloquea leer user_books de otros).
 */
export async function getFollowingCurrentlyReading(limit = 12): Promise<FollowingReadingItem[]> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data: follows } = await (supabase.from("follows") as any).select("following_id").eq("follower_id", user.id);
    const followedIds = ((follows ?? []) as any[]).map((f) => f.following_id);
    if (followedIds.length === 0) return [];

    const admin = createAdminClient() as unknown as { from: (t: string) => any };

    // Solo lectores que permiten ver sus lecturas. Troceado: el grafo de seguidos
    // no tiene cota → evita 414 en usuarios muy sociales.
    const { data: profs } = await selectInChunks<any>(
        followedIds,
        (chunk) => admin
            .from("profiles")
            .select("id, full_name, username, avatar_url, privacy_settings")
            .in("id", chunk),
    );
    const profById = new Map<string, any>();
    const allowedIds: string[] = [];
    for (const p of (profs ?? []) as any[]) {
        const pr = p.privacy_settings || {};
        const visibility = pr.profile_visibility || "public";
        const showReads = pr.show_recent_reads !== false;
        if (showReads && (visibility === "public" || visibility === "members")) {
            allowedIds.push(p.id);
            profById.set(p.id, p);
        }
    }
    if (allowedIds.length === 0) return [];

    // Troceado por lote de allowedIds; cada lote trae su top `limit`, luego se
    // reordena y recorta al top global.
    const { data: ub } = await selectInChunks<any>(
        allowedIds,
        (chunk) => admin
            .from("user_books")
            .select("user_id, book_id, updated_at")
            .in("user_id", chunk)
            .eq("status", "READING")
            .order("updated_at", { ascending: false })
            .limit(limit),
    );
    const rows = ((ub ?? []) as any[])
        .sort((a, b) => new Date(b.updated_at || 0).getTime() - new Date(a.updated_at || 0).getTime())
        .slice(0, limit);
    if (rows.length === 0) return [];

    const bookIds = [...new Set(rows.map((r) => r.book_id))];
    const { data: books } = await admin.from("books").select("id, title, preferred_edition_id").in("id", bookIds);
    const bookById = new Map<string, any>((books ?? []).map((b: any) => [b.id, b]));

    const edIds = ((books ?? []) as any[]).map((b) => b.preferred_edition_id).filter(Boolean);
    const { data: eds } = edIds.length ? await admin.from("editions").select("id, cover_url").in("id", edIds) : { data: [] };
    const coverByEd = new Map<string, string | null>(((eds ?? []) as any[]).map((e) => [e.id, e.cover_url]));

    return rows.map((r) => {
        const b = bookById.get(r.book_id);
        const p = profById.get(r.user_id);
        return {
            userId: r.user_id,
            userName: p?.full_name || p?.username || "Lector",
            username: p?.username ?? null,
            avatar: p?.avatar_url ?? null,
            bookId: r.book_id,
            bookTitle: b?.title ?? "Libro",
            coverUrl: b?.preferred_edition_id ? coverByEd.get(b.preferred_edition_id) ?? null : null,
        };
    });
}

function formatFeedItems(feedData: any[], userId?: string): ActivityFeedItem[] {
    return feedData.map((item: any) => {
        const likesList = item.likes || [];
        const isLikedByMe = userId ? likesList.some((like: any) => like.user_id === userId) : false;

        const userData = item.profiles || {};
        const userName = userData.full_name || userData.username || "Usuario";

        const date = new Date(item.created_at);
        const diffMins = Math.floor((Date.now() - date.getTime()) / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);
        let timeStr = "";
        if (diffMins < 1) timeStr = "Hace un momento";
        else if (diffMins < 60) timeStr = `Hace ${diffMins} min`;
        else if (diffHours < 24) timeStr = `Hace ${diffHours} h`;
        else if (diffDays === 1) timeStr = "Ayer";
        else timeStr = `Hace ${diffDays} días`;

        return {
            id: item.id,
            type: item.activity_type,
            user: { name: userName, avatar: userData.avatar_url || null },
            content: item.content,
            subtext: item.subtext,
            metadata: item.metadata,
            time: timeStr,
            likes: likesList.length,
            isLikedByMe,
        };
    });
}

const FEED_SELECT = `
    id,
    activity_type,
    content,
    subtext,
    metadata,
    created_at,
    profiles:user_id ( full_name, username, avatar_url ),
    likes:activity_likes ( user_id )
`;

/** Actividad de las personas que sigue el usuario. Vacío si no sigue a nadie. */
export async function getFollowingActivityFeed(limit = 15): Promise<ActivityFeedItem[]> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data: follows } = await (supabase.from("follows") as any)
        .select("following_id")
        .eq("follower_id", user.id);
    const ids = ((follows ?? []) as any[]).map((f) => f.following_id);
    if (ids.length === 0) return [];

    // Troceado por lote del grafo de seguidos; reordenamos y recortamos al top global.
    const { data: feedData, error } = await selectInChunks<any, { message?: string }>(
        ids,
        (chunk) => supabase
            .from("activity_feed")
            .select(FEED_SELECT)
            .in("user_id", chunk)
            .order("created_at", { ascending: false })
            .limit(limit),
    );

    if (error) {
        console.error("Error fetching following feed:", (error as { message?: string })?.message);
        return [];
    }
    const feedRows = ((feedData ?? []) as any[])
        .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
        .slice(0, limit);
    return formatFeedItems(feedRows, user.id);
}

export async function getGlobalActivityFeed(limit = 10): Promise<ActivityFeedItem[]> {
    const supabase = await createClient();

    // 1. Get the current user to check likes
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id;

    // 2. Fetch the feed from Supabase
    // We join with public.profiles to get the user's name
    // We join with activity_likes to count likes and check if the current user liked it
    const { data: feedData, error } = await supabase
        .from('activity_feed')
        .select(`
            id,
            activity_type,
            content,
            subtext,
            metadata,
            created_at,
            profiles:user_id ( full_name, username, avatar_url ),
            likes:activity_likes ( user_id )
        `)
        .order('created_at', { ascending: false })
        .limit(limit);

    if (error) {
        console.error("Error fetching activity feed:", error);
        return [];
    }

    if (!feedData || feedData.length === 0) {
        return [];
    }

    // 3. Transform the data for the frontend
    const formattedFeed: ActivityFeedItem[] = feedData.map((item: any) => {

        // Count likes and check if current user liked it
        const likesList = item.likes || [];
        const likesCount = likesList.length;
        const isLikedByMe = userId ? likesList.some((like: any) => like.user_id === userId) : false;

        // Extract user data from profiles
        const userData = item.profiles || {};
        const userName = userData.full_name || userData.username || "Usuario";

        // Format time relative to now (e.g. "Hace 10 min")
        const date = new Date(item.created_at);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        let timeStr = "";
        if (diffMins < 1) timeStr = "Hace un momento";
        else if (diffMins < 60) timeStr = `Hace ${diffMins} min`;
        else if (diffHours < 24) timeStr = `Hace ${diffHours} h`;
        else if (diffDays === 1) timeStr = "Ayer";
        else timeStr = `Hace ${diffDays} días`;

        return {
            id: item.id,
            type: item.activity_type,
            user: {
                name: userName,
                avatar: userData.avatar_url || null,
            },
            content: item.content,
            subtext: item.subtext,
            metadata: item.metadata,
            time: timeStr,
            likes: likesCount,
            isLikedByMe: isLikedByMe,
        };
    });

    return formattedFeed;
}

export async function toggleActivityLike(activityId: string): Promise<{ success: boolean; isLiked: boolean; error?: string }> {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        return { success: false, isLiked: false, error: "Unauthorized" };
    }

    // Check if like exists
    const { data: existingLike } = await supabase
        .from('activity_likes')
        .select('*')
        .eq('activity_id', activityId)
        .eq('user_id', user.id)
        .single();

    if (existingLike) {
        // Unlike
        const { error: deleteError } = await supabase
            .from('activity_likes')
            .delete()
            .eq('activity_id', activityId)
            .eq('user_id', user.id);

        if (deleteError) {
            console.error("Error deleting like:", deleteError);
            return { success: false, isLiked: true, error: deleteError.message };
        }

        return { success: true, isLiked: false };
    } else {
        // Like
        const { error: insertError } = await supabase
            .from('activity_likes')
            .insert({
                activity_id: activityId,
                user_id: user.id
            });

        if (insertError) {
            console.error("Error inserting like:", insertError);
            return { success: false, isLiked: false, error: insertError.message };
        }

        return { success: true, isLiked: true };
    }
}
