"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { sendPushIfEnabled } from "@/lib/push-server";
import { resolveBookFromResult } from "@/lib/book-resolution";
import type { BookSearchResult } from "@/lib/isbndb";

export interface BuddyBook {
    id: string;
    title: string;
    author: string | null;
    coverUrl: string | null;
    pageCount: number | null;
}
export interface BuddyPerson {
    id: string;
    name: string | null;
    username: string | null;
    avatarUrl: string | null;
}
export interface BuddyRead {
    id: string;
    status: "invited" | "active" | "declined" | "finished";
    role: "host" | "guest";
    book: BuddyBook;
    other: BuddyPerson;
    myPage: number;
    otherPage: number;
    createdAt: string;
}
export interface BuddyMessage {
    id: string;
    userId: string;
    content: string;
    createdAt: string;
    authorName: string | null;
    authorAvatar: string | null;
    isMine: boolean;
}

async function loadBooks(supabase: any, bookIds: string[]): Promise<Map<string, BuddyBook>> {
    const map = new Map<string, BuddyBook>();
    if (bookIds.length === 0) return map;
    const { data: books } = await supabase.from("books").select("id, title, author, preferred_edition_id").in("id", bookIds);
    const edIds = ((books ?? []) as any[]).map((b) => b.preferred_edition_id).filter(Boolean);
    const edById = new Map<string, any>();
    if (edIds.length) {
        const { data: eds } = await supabase.from("editions").select("id, cover_url, page_count").in("id", edIds);
        for (const e of (eds ?? []) as any[]) edById.set(e.id, e);
    }
    for (const b of (books ?? []) as any[]) {
        const ed = b.preferred_edition_id ? edById.get(b.preferred_edition_id) : null;
        map.set(b.id, { id: b.id, title: b.title, author: b.author ?? null, coverUrl: ed?.cover_url ?? null, pageCount: ed?.page_count ?? null });
    }
    return map;
}

async function loadProfiles(supabase: any, ids: string[]): Promise<Map<string, BuddyPerson>> {
    const map = new Map<string, BuddyPerson>();
    if (ids.length === 0) return map;
    const { data } = await supabase.from("profiles").select("id, full_name, username, avatar_url").in("id", ids);
    for (const p of (data ?? []) as any[]) map.set(p.id, { id: p.id, name: p.full_name ?? null, username: p.username ?? null, avatarUrl: p.avatar_url ?? null });
    return map;
}

function toBuddy(row: any, meId: string, bookMap: Map<string, BuddyBook>, profMap: Map<string, BuddyPerson>): BuddyRead | null {
    const role: "host" | "guest" = row.host_id === meId ? "host" : "guest";
    const otherId = role === "host" ? row.guest_id : row.host_id;
    const book = bookMap.get(row.book_id);
    const other = profMap.get(otherId);
    if (!book || !other) return null;
    return {
        id: row.id,
        status: row.status,
        role,
        book,
        other,
        myPage: role === "host" ? row.host_page : row.guest_page,
        otherPage: role === "host" ? row.guest_page : row.host_page,
        createdAt: row.created_at,
    };
}

/** Lecturas en pareja del usuario (como anfitrión o invitado). */
export async function getMyBuddyReads(): Promise<BuddyRead[]> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];
    const { data } = await supabase
        .from("buddy_reads")
        .select("*")
        .or(`host_id.eq.${user.id},guest_id.eq.${user.id}`)
        .neq("status", "declined")
        .order("updated_at", { ascending: false });
    const rows = (data ?? []) as any[];
    if (rows.length === 0) return [];
    const bookMap = await loadBooks(supabase, [...new Set(rows.map((r) => r.book_id))]);
    const profMap = await loadProfiles(supabase, [...new Set(rows.flatMap((r) => [r.host_id, r.guest_id]))]);
    return rows.map((r) => toBuddy(r, user.id, bookMap, profMap)).filter(Boolean) as BuddyRead[];
}

export async function getBuddyRead(id: string): Promise<BuddyRead | null> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const { data: row } = await supabase.from("buddy_reads").select("*").eq("id", id).maybeSingle();
    if (!row) return null;
    const bookMap = await loadBooks(supabase, [row.book_id]);
    const profMap = await loadProfiles(supabase, [row.host_id, row.guest_id]);
    return toBuddy(row, user.id, bookMap, profMap);
}

/** Invita a un amigo (por username) a leer un libro juntos. Resuelve el libro al catálogo. */
export async function createBuddyRead(book: BookSearchResult, guestUsername: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "No autenticado" };
    if (!book?.title) return { error: "Falta el libro." };

    const uname = (guestUsername || "").trim().replace(/^@/, "");
    if (!uname) return { error: "Indica el @usuario del amigo." };
    const { data: guest } = await supabase.from("profiles").select("id").eq("username", uname).maybeSingle();
    if (!guest) return { error: "No encontramos a ese usuario." };
    if (guest.id === user.id) return { error: "No puedes invitarte a ti mismo." };

    let bookId: string;
    try {
        const resolved = await resolveBookFromResult(book);
        bookId = resolved.bookId;
    } catch {
        return { error: "No pudimos preparar el libro. Inténtalo con otro." };
    }

    const { data: created, error } = await supabase
        .from("buddy_reads")
        .insert({ book_id: bookId, host_id: user.id, guest_id: guest.id, status: "invited" })
        .select("id")
        .single();
    if (error) return { error: error.message };
    revalidatePath("/app/lectura-pareja");
    return { success: true, id: created.id };
}

/** El invitado acepta o rechaza. */
export async function respondBuddyRead(id: string, accept: boolean) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "No autenticado" };
    const { data: updated, error } = await supabase
        .from("buddy_reads")
        .update({ status: accept ? "active" : "declined", updated_at: new Date().toISOString() })
        .eq("id", id)
        .eq("guest_id", user.id)
        .eq("status", "invited")
        .select("id");
    if (error) return { error: error.message };
    if (!updated || updated.length === 0) return { error: "No puedes responder a esta invitación." };
    revalidatePath("/app/lectura-pareja");
    return { success: true };
}

/** Actualiza mi página actual en la lectura. */
export async function updateBuddyProgress(id: string, page: number) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "No autenticado" };
    const { data: row } = await supabase.from("buddy_reads").select("host_id, guest_id").eq("id", id).maybeSingle();
    if (!row) return { error: "No encontrada." };
    const col = row.host_id === user.id ? "host_page" : row.guest_id === user.id ? "guest_page" : null;
    if (!col) return { error: "No participas en esta lectura." };
    const { error } = await supabase.from("buddy_reads").update({ [col]: Math.max(0, Math.floor(page)), updated_at: new Date().toISOString() }).eq("id", id);
    if (error) return { error: error.message };
    revalidatePath(`/app/lectura-pareja/${id}`);
    return { success: true };
}

export async function finishBuddyRead(id: string) {
    const supabase = await createClient();
    const { data: updated, error } = await supabase.from("buddy_reads").update({ status: "finished", updated_at: new Date().toISOString() }).eq("id", id).select("id");
    if (error) return { error: error.message };
    if (!updated || updated.length === 0) return { error: "No tienes permiso." };
    revalidatePath(`/app/lectura-pareja/${id}`);
    return { success: true };
}

// --- Hilo de conversación ---------------------------------------------------

export async function getBuddyMessages(id: string): Promise<BuddyMessage[]> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const { data } = await supabase.from("buddy_read_messages").select("id, user_id, content, created_at").eq("buddy_read_id", id).order("created_at", { ascending: true }).limit(500);
    const rows = (data ?? []) as any[];
    if (rows.length === 0) return [];
    const profMap = await loadProfiles(supabase, [...new Set(rows.map((r) => r.user_id))]);
    return rows.map((r) => {
        const p = profMap.get(r.user_id);
        return { id: r.id, userId: r.user_id, content: r.content, createdAt: r.created_at, authorName: p?.name ?? null, authorAvatar: p?.avatarUrl ?? null, isMine: r.user_id === user?.id };
    });
}

export async function sendBuddyMessage(id: string, content: string): Promise<{ message: BuddyMessage } | { error: string }> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "No autenticado" };
    const text = (content || "").trim();
    if (!text) return { error: "Mensaje vacío" };
    if (text.length > 2000) return { error: "Mensaje demasiado largo" };
    const { data: created, error } = await supabase.from("buddy_read_messages").insert({ buddy_read_id: id, user_id: user.id, content: text }).select("id, created_at").single();
    if (error) return { error: error.message };
    const { data: p } = await supabase.from("profiles").select("full_name, avatar_url").eq("id", user.id).maybeSingle();

    // Push al otro participante de la lectura conjunta.
    try {
        const { data: br } = await supabase.from("buddy_reads").select("host_id, guest_id").eq("id", id).maybeSingle();
        const pair = br as { host_id?: string; guest_id?: string } | null;
        const recipient = pair ? (pair.host_id === user.id ? pair.guest_id : pair.host_id) : null;
        if (recipient) {
            const name = (p as any)?.full_name || "Tu compañero/a de lectura";
            await sendPushIfEnabled(recipient, "social", {
                title: `${name} · lectura conjunta`,
                body: text.slice(0, 140),
                url: "/app/lectura-pareja",
                tag: `buddy-${id}`,
            });
        }
    } catch (e) {
        console.error("[Push] buddy read:", e);
    }

    return { message: { id: created.id, userId: user.id, content: text, createdAt: created.created_at, authorName: (p as any)?.full_name ?? null, authorAvatar: (p as any)?.avatar_url ?? null, isMine: true } };
}
