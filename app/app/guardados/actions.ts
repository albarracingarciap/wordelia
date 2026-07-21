"use server";

import { createClient } from "@/utils/supabase/server";
import { cleanQuoteText } from "@/lib/shared-quote";

export type SavedBucket = "reseñas" | "citas" | "debates" | "libros";

export interface SavedEntry {
    key: string; // `${itemType}:${itemId}`
    itemType: "activity" | "book" | "quote";
    itemId: string;
    bucket: SavedBucket;
    title: string | null;
    subtitle: string | null;
    snippet: string | null;
    coverUrl: string | null;
    authorName: string | null;
    authorAvatar: string | null;
    href: string | null;
    time: string;
    createdAt: string;
}

function relTime(iso: string): string {
    const diffMins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    if (diffMins < 1) return "Hace un momento";
    if (diffMins < 60) return `Hace ${diffMins} min`;
    if (diffHours < 24) return `Hace ${diffHours} h`;
    if (diffDays === 1) return "Ayer";
    return `Hace ${diffDays} días`;
}

const ACTIVITY_BUCKET: Record<string, SavedBucket | undefined> = {
    review: "reseñas",
    note: "citas",
    club_post: "debates",
};

/** Guarda o quita de guardados un item (actividad / libro / cita). */
export async function toggleSaved(itemType: "activity" | "book" | "quote", itemId: string): Promise<{ saved: boolean } | { error: string }> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Inicia sesión para guardar." };

    const { data: existing } = await supabase
        .from("saved_items")
        .select("item_id")
        .eq("user_id", user.id)
        .eq("item_type", itemType)
        .eq("item_id", itemId)
        .maybeSingle();

    if (existing) {
        const { error } = await supabase.from("saved_items").delete().eq("user_id", user.id).eq("item_type", itemType).eq("item_id", itemId);
        if (error) return { error: error.message };
        return { saved: false };
    }

    const { error } = await supabase.from("saved_items").insert({ user_id: user.id, item_type: itemType, item_id: itemId });
    if (error) return { error: error.message };
    return { saved: true };
}

/** ¿Está guardado este item por el usuario? (para inicializar botones sueltos). */
export async function isSaved(itemType: "activity" | "book" | "quote", itemId: string): Promise<boolean> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;
    const { data } = await supabase.from("saved_items").select("item_id").eq("user_id", user.id).eq("item_type", itemType).eq("item_id", itemId).maybeSingle();
    return !!data;
}

/** IDs de ACTIVIDAD guardados (para marcar los botones del feed de comunidad). */
export async function getMySavedActivityIds(): Promise<string[]> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];
    const { data } = await supabase.from("saved_items").select("item_id").eq("user_id", user.id).eq("item_type", "activity");
    return ((data ?? []) as any[]).map((r) => r.item_id);
}

/** Todos los guardados hidratados, más recientes primero. Para la página Guardados. */
export async function getSavedItems(): Promise<SavedEntry[]> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data: saved } = await supabase
        .from("saved_items")
        .select("item_type, item_id, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
    const rows = (saved ?? []) as any[];
    if (rows.length === 0) return [];

    const activityIds = rows.filter((r) => r.item_type === "activity").map((r) => r.item_id);
    const bookIds = rows.filter((r) => r.item_type === "book").map((r) => r.item_id);
    const quoteIds = rows.filter((r) => r.item_type === "quote").map((r) => r.item_id);

    // --- Actividades ---
    const activityById = new Map<string, any>();
    if (activityIds.length) {
        const { data } = await supabase
            .from("activity_feed")
            .select(`id, activity_type, content, subtext, metadata, profiles:user_id ( full_name, username, avatar_url )`)
            .in("id", activityIds);
        for (const a of (data ?? []) as any[]) activityById.set(a.id, a);
    }

    // --- Libros (+ portada de la edición preferida) ---
    const bookById = new Map<string, any>();
    if (bookIds.length) {
        const { data: books } = await supabase.from("books").select("id, title, author, preferred_edition_id").in("id", bookIds);
        const edIds = ((books ?? []) as any[]).map((b) => b.preferred_edition_id).filter(Boolean);
        const coverByEd = new Map<string, string | null>();
        if (edIds.length) {
            const { data: eds } = await supabase.from("editions").select("id, cover_url").in("id", edIds);
            for (const e of (eds ?? []) as any[]) coverByEd.set(e.id, e.cover_url ?? null);
        }
        for (const b of (books ?? []) as any[]) bookById.set(b.id, { ...b, coverUrl: b.preferred_edition_id ? coverByEd.get(b.preferred_edition_id) ?? null : null });
    }

    // --- Citas (book_notes públicas) ---
    const quoteById = new Map<string, any>();
    if (quoteIds.length) {
        const { data: notes } = await supabase.from("book_notes").select("id, content, book_id, is_private").in("id", quoteIds);
        const noteBookIds = [...new Set(((notes ?? []) as any[]).map((n) => n.book_id).filter(Boolean))];
        const noteBookById = new Map<string, any>();
        if (noteBookIds.length) {
            const { data: nb } = await supabase.from("books").select("id, title, author").in("id", noteBookIds);
            for (const b of (nb ?? []) as any[]) noteBookById.set(b.id, b);
        }
        for (const n of (notes ?? []) as any[]) quoteById.set(n.id, { ...n, book: n.book_id ? noteBookById.get(n.book_id) ?? null : null });
    }

    const out: SavedEntry[] = [];
    for (const r of rows) {
        const time = relTime(r.created_at);
        if (r.item_type === "activity") {
            const a = activityById.get(r.item_id);
            if (!a) continue;
            const bucket = ACTIVITY_BUCKET[a.activity_type];
            if (!bucket) continue; // start_reading u otros no encajan en pestaña
            const p = a.profiles || {};
            out.push({
                key: `activity:${r.item_id}`, itemType: "activity", itemId: r.item_id, bucket,
                title: null, subtitle: null, snippet: a.subtext ?? null,
                coverUrl: null, authorName: p.full_name || p.username || "Usuario", authorAvatar: p.avatar_url || null,
                href: a.metadata?.book_id ? `/app/libros/${a.metadata.book_id}` : null,
                time, createdAt: r.created_at,
                // el "content" (acción) va en title para reutilizar el render
                ...(a.content ? { title: a.content } : {}),
            });
        } else if (r.item_type === "book") {
            const b = bookById.get(r.item_id);
            if (!b) continue;
            out.push({
                key: `book:${r.item_id}`, itemType: "book", itemId: r.item_id, bucket: "libros",
                title: b.title ?? "Libro", subtitle: b.author ?? null, snippet: null,
                coverUrl: b.coverUrl ?? null, authorName: null, authorAvatar: null,
                href: `/app/libros/${r.item_id}`, time, createdAt: r.created_at,
            });
        } else if (r.item_type === "quote") {
            const n = quoteById.get(r.item_id);
            if (!n) continue;
            out.push({
                key: `quote:${r.item_id}`, itemType: "quote", itemId: r.item_id, bucket: "citas",
                title: n.book?.title ?? null, subtitle: n.book?.author ?? null, snippet: cleanQuoteText(n.content || ""),
                coverUrl: null, authorName: null, authorAvatar: null,
                href: `/cita/${r.item_id}`, time, createdAt: r.created_at,
            });
        }
    }
    return out;
}
