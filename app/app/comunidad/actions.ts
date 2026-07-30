"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { sendPushIfEnabled, sendPushToUsers } from "@/lib/push-server";
import { REACTIONS } from "@/lib/community-reactions";

export type PostSubtype = "comentario" | "recomendacion" | "pregunta" | "leyendo";

export interface CommunityPostInput {
    content: string;
    subtype: PostSubtype;
    imageUrl?: string | null;
    book?: { title: string; coverUrl?: string | null; isbn?: string | null; bookId?: string | null } | null;
    spoiler?: boolean;
    promptId?: string | null;
}

const SUBTYPE_LABEL: Record<PostSubtype, string> = {
    comentario: "compartió una nota",
    recomendacion: "recomienda un libro",
    pregunta: "lanza una pregunta",
    leyendo: "está leyendo",
};

/** Crea un post nativo del usuario en la comunidad (activity_feed type='post'). */
export async function createCommunityPost(data: CommunityPostInput) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Inicia sesión para publicar." };

    const content = (data.content || "").trim();
    if (!content && !data.imageUrl) return { error: "Escribe algo o añade una foto." };
    if (content.length > 4000) return { error: "El texto es demasiado largo." };

    const subtype: PostSubtype = ["comentario", "recomendacion", "pregunta", "leyendo"].includes(data.subtype) ? data.subtype : "comentario";

    const metadata: Record<string, any> = { subtype, kind: "post" };
    if (data.spoiler) metadata.spoiler = true;
    if (data.promptId) metadata.promptId = data.promptId;
    if (data.imageUrl) metadata.imageUrl = data.imageUrl;
    if (data.book?.title) {
        metadata.book = {
            title: data.book.title,
            coverUrl: data.book.coverUrl ?? null,
            isbn: data.book.isbn ?? null,
            bookId: data.book.bookId ?? null,
        };
    }

    const { data: created, error } = await supabase
        .from("activity_feed")
        .insert({
            user_id: user.id,
            activity_type: "post",
            content: SUBTYPE_LABEL[subtype], // acción (cabecera): "compartió una nota"…
            subtext: content || null,        // el texto del post (cuerpo)
            metadata,
        })
        .select("id")
        .single();
    if (error) return { error: error.message };

    revalidatePath("/app/comunidad");
    revalidatePath("/app/mi-lectura");
    return { success: true, id: created.id };
}

/** Género de cada libro (para filtrar el feed por género). */
export async function getGenresForBooks(bookIds: string[]): Promise<Record<string, string>> {
    const supabase = await createClient();
    const ids = [...new Set(bookIds.filter(Boolean))];
    if (ids.length === 0) return {};
    const { data } = await supabase.from("books").select("id, genre").in("id", ids);
    const out: Record<string, string> = {};
    for (const b of (data ?? []) as any[]) if (b.genre) out[b.id] = b.genre;
    return out;
}

// --- Reacciones (emoji) -----------------------------------------------------

export interface ReactionState {
    counts: Record<string, number>;
    mine: string | null;
}

/** Reacciones por item del feed (contadores + la mía). */
export async function getReactions(activityIds: string[]): Promise<Record<string, ReactionState>> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (activityIds.length === 0) return {};
    const { data } = await supabase.from("activity_reactions").select("activity_id, user_id, emoji").in("activity_id", activityIds);
    const out: Record<string, ReactionState> = {};
    for (const r of (data ?? []) as any[]) {
        const st = (out[r.activity_id] ??= { counts: {}, mine: null });
        st.counts[r.emoji] = (st.counts[r.emoji] ?? 0) + 1;
        if (user && r.user_id === user.id) st.mine = r.emoji;
    }
    return out;
}

/** Fija/cambia/quita mi reacción a un item. Toggle si repites el mismo emoji. */
export async function setReaction(activityId: string, emoji: string): Promise<{ mine: string | null } | { error: string }> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Inicia sesión para reaccionar." };
    if (!(REACTIONS as readonly string[]).includes(emoji)) return { error: "Reacción no válida." };

    const { data: existing } = await supabase.from("activity_reactions").select("emoji").eq("activity_id", activityId).eq("user_id", user.id).maybeSingle();

    if (existing?.emoji === emoji) {
        const { error } = await supabase.from("activity_reactions").delete().eq("activity_id", activityId).eq("user_id", user.id);
        if (error) return { error: error.message };
        return { mine: null };
    }

    const { error } = await supabase.from("activity_reactions").upsert({ activity_id: activityId, user_id: user.id, emoji }, { onConflict: "activity_id,user_id" });
    if (error) return { error: error.message };

    // Push al dueño de la actividad (solo al AÑADIR reacción, no al quitarla).
    try {
        const { data: activity } = await supabase.from("activity_feed").select("user_id").eq("id", activityId).maybeSingle();
        const ownerId = (activity as { user_id?: string } | null)?.user_id;
        if (ownerId && ownerId !== user.id) {
            const { data: me } = await supabase.from("profiles").select("full_name, username").eq("id", user.id).maybeSingle();
            const name = (me as any)?.full_name || (me as any)?.username || "Alguien";
            await sendPushIfEnabled(ownerId, "social", {
                title: `${name} reaccionó a tu actividad`,
                body: emoji,
                url: "/app",
                tag: `activity-${activityId}`,
            });
        }
    } catch (e) {
        console.error("[Push] reacción:", e);
    }

    return { mine: emoji };
}

// --- Comentarios / hilos en el feed ----------------------------------------

export interface ActivityComment {
    id: string;
    userId: string;
    parentId: string | null;
    content: string;
    createdAt: string;
    authorName: string | null;
    authorAvatar: string | null;
    isMine: boolean;
}

/** Comentarios de un item del feed (con perfiles), orden cronológico. */
export async function getActivityComments(activityId: string): Promise<ActivityComment[]> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const { data } = await supabase
        .from("activity_comments")
        .select("id, user_id, parent_id, content, created_at")
        .eq("activity_id", activityId)
        .order("created_at", { ascending: true });
    const rows = (data ?? []) as any[];
    if (rows.length === 0) return [];

    const userIds = [...new Set(rows.map((r) => r.user_id))];
    const { data: profiles } = await supabase.from("profiles").select("id, full_name, username, avatar_url").in("id", userIds);
    const byId = new Map<string, any>((profiles ?? []).map((p: any) => [p.id, p]));

    return rows.map((r) => {
        const p = byId.get(r.user_id);
        return {
            id: r.id, userId: r.user_id, parentId: r.parent_id ?? null, content: r.content, createdAt: r.created_at,
            authorName: p?.full_name || p?.username || "Lector", authorAvatar: p?.avatar_url ?? null,
            isMine: r.user_id === user?.id,
        };
    });
}

/** Cuántos comentarios tiene cada item (para los contadores del feed). */
export async function getCommentCounts(activityIds: string[]): Promise<Record<string, number>> {
    const supabase = await createClient();
    if (activityIds.length === 0) return {};
    const { data } = await supabase.from("activity_comments").select("activity_id").in("activity_id", activityIds);
    const counts: Record<string, number> = {};
    for (const r of (data ?? []) as any[]) counts[r.activity_id] = (counts[r.activity_id] ?? 0) + 1;
    return counts;
}

/** Añade un comentario (o respuesta si parentId). Devuelve el comentario creado. */
export async function addActivityComment(activityId: string, content: string, parentId?: string | null): Promise<{ comment: ActivityComment } | { error: string }> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Inicia sesión para comentar." };
    const text = (content || "").trim();
    if (!text) return { error: "Escribe un comentario." };
    if (text.length > 2000) return { error: "Comentario demasiado largo." };

    const { data: created, error } = await supabase
        .from("activity_comments")
        .insert({ activity_id: activityId, user_id: user.id, parent_id: parentId ?? null, content: text })
        .select("id, created_at")
        .single();
    if (error) return { error: error.message };

    const { data: p } = await supabase.from("profiles").select("full_name, username, avatar_url").eq("id", user.id).maybeSingle();
    const authorName = (p as any)?.full_name || (p as any)?.username || "Lector";

    // Push al dueño de la actividad (y al del comentario padre, si es respuesta).
    try {
        const recipients: string[] = [];
        const { data: activity } = await supabase.from("activity_feed").select("user_id").eq("id", activityId).maybeSingle();
        if ((activity as { user_id?: string } | null)?.user_id) recipients.push((activity as { user_id: string }).user_id);
        if (parentId) {
            const { data: parent } = await supabase.from("activity_comments").select("user_id").eq("id", parentId).maybeSingle();
            if ((parent as { user_id?: string } | null)?.user_id) recipients.push((parent as { user_id: string }).user_id);
        }
        await sendPushToUsers(recipients, "social", {
            title: `${authorName} comentó tu actividad`,
            body: text.slice(0, 140),
            url: "/app",
            tag: `activity-${activityId}`,
        }, user.id);
    } catch (e) {
        console.error("[Push] comentario:", e);
    }

    return {
        comment: {
            id: created.id, userId: user.id, parentId: parentId ?? null, content: text, createdAt: created.created_at,
            authorName, authorAvatar: (p as any)?.avatar_url ?? null, isMine: true,
        },
    };
}

export async function deleteActivityComment(commentId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "No autenticado" };
    const { data: deleted, error } = await supabase.from("activity_comments").delete().eq("id", commentId).eq("user_id", user.id).select("id");
    if (error) return { error: error.message };
    if (!deleted || deleted.length === 0) return { error: "No puedes borrar este comentario." };
    return { success: true };
}

/** Borra un post propio del feed. */
export async function deleteCommunityPost(activityId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "No autenticado" };
    const { data: deleted, error } = await supabase
        .from("activity_feed")
        .delete()
        .eq("id", activityId)
        .eq("user_id", user.id)
        .select("id");
    if (error) return { error: error.message };
    if (!deleted || deleted.length === 0) return { error: "No puedes borrar este post." };
    revalidatePath("/app/comunidad");
    return { success: true };
}
