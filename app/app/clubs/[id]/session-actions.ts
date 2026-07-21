"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";

export interface AgendaBlock {
    title: string;
    minutes: number;
}

export interface LiveSession {
    id: string;
    clubId: string;
    clubBookId: string | null;
    title: string;
    scheduledAt: string;
    durationMinutes: number;
    agenda: AgendaBlock[];
    status: "scheduled" | "live" | "ended";
    currentBlock: number;
    startedAt: string | null;
    endedAt: string | null;
    summary: string | null;
}

export interface SessionMessage {
    id: string;
    userId: string;
    content: string;
    createdAt: string;
    authorName: string | null;
    authorAvatar: string | null;
}

function normalizeAgenda(raw: any): AgendaBlock[] {
    if (!Array.isArray(raw)) return [];
    return raw
        .map((b) => ({ title: String(b?.title ?? "").trim(), minutes: Number(b?.minutes) || 0 }))
        .filter((b) => b.title);
}

function toLiveSession(row: any): LiveSession {
    return {
        id: row.id,
        clubId: row.club_id,
        clubBookId: row.club_book_id ?? null,
        title: row.title,
        scheduledAt: row.scheduled_at,
        durationMinutes: row.duration_minutes ?? 60,
        agenda: normalizeAgenda(row.agenda),
        status: row.status,
        currentBlock: row.current_block ?? 0,
        startedAt: row.started_at ?? null,
        endedAt: row.ended_at ?? null,
        summary: row.summary ?? null,
    };
}

async function managerRole(supabase: any, clubId: string, userId: string): Promise<string | null> {
    const { data } = await supabase.from("club_members").select("role").eq("club_id", clubId).eq("user_id", userId).maybeSingle();
    return data?.role ?? null;
}

/** Todas las sesiones de un club (próximas primero por fecha). Solo miembros (RLS). */
export async function getLiveSessions(clubId: string): Promise<LiveSession[]> {
    const supabase = await createClient();
    const { data } = await supabase
        .from("club_live_sessions")
        .select("*")
        .eq("club_id", clubId)
        .order("scheduled_at", { ascending: false });
    return ((data ?? []) as any[]).map(toLiveSession);
}

/** Una sesión + rol del usuario en el club. null si no existe o no eres miembro (RLS). */
export async function getLiveSession(sessionId: string): Promise<{ session: LiveSession; role: string | null; isManager: boolean } | null> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: row } = await supabase.from("club_live_sessions").select("*").eq("id", sessionId).maybeSingle();
    if (!row) return null;

    const role = await managerRole(supabase, row.club_id, user.id);
    return { session: toLiveSession(row), role, isManager: role === "admin" || role === "moderator" };
}

export async function createLiveSession(clubId: string, data: { title: string; scheduledAt: string; durationMinutes?: number; agenda?: AgendaBlock[]; clubBookId?: string | null }) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "No autenticado" };
    if (!data.title?.trim()) return { error: "Ponle un título a la sesión." };
    if (!data.scheduledAt) return { error: "Elige fecha y hora." };

    const role = await managerRole(supabase, clubId, user.id);
    if (role !== "admin" && role !== "moderator") return { error: "Solo admin o moderador pueden programar sesiones." };

    const { data: created, error } = await supabase
        .from("club_live_sessions")
        .insert({
            club_id: clubId,
            club_book_id: data.clubBookId ?? null,
            title: data.title.trim(),
            scheduled_at: data.scheduledAt,
            duration_minutes: data.durationMinutes && data.durationMinutes > 0 ? data.durationMinutes : 60,
            agenda: normalizeAgenda(data.agenda ?? []),
            created_by: user.id,
        })
        .select("id")
        .single();
    if (error) return { error: error.message };
    revalidatePath(`/app/clubs/${clubId}`);
    return { success: true, sessionId: created.id };
}

export async function updateLiveSession(sessionId: string, data: { title?: string; scheduledAt?: string; durationMinutes?: number; agenda?: AgendaBlock[] }) {
    const supabase = await createClient();
    const updates: Record<string, any> = { updated_at: new Date().toISOString() };
    if (data.title !== undefined) {
        if (!data.title.trim()) return { error: "El título es obligatorio." };
        updates.title = data.title.trim();
    }
    if (data.scheduledAt !== undefined) updates.scheduled_at = data.scheduledAt;
    if (data.durationMinutes !== undefined) updates.duration_minutes = data.durationMinutes > 0 ? data.durationMinutes : 60;
    if (data.agenda !== undefined) updates.agenda = normalizeAgenda(data.agenda);

    // RLS restringe a gestores; .select() detecta el no-op.
    const { data: updated, error } = await supabase.from("club_live_sessions").update(updates).eq("id", sessionId).select("club_id");
    if (error) return { error: error.message };
    if (!updated || updated.length === 0) return { error: "No tienes permiso para editar esta sesión." };
    revalidatePath(`/app/clubs/${updated[0].club_id}`);
    return { success: true };
}

export async function deleteLiveSession(sessionId: string) {
    const supabase = await createClient();
    const { data: deleted, error } = await supabase.from("club_live_sessions").delete().eq("id", sessionId).select("club_id");
    if (error) return { error: error.message };
    if (!deleted || deleted.length === 0) return { error: "No tienes permiso para eliminar esta sesión." };
    revalidatePath(`/app/clubs/${deleted[0].club_id}`);
    return { success: true };
}

/** Cambia el estado (iniciar/terminar). Solo gestor (RLS). */
export async function setSessionStatus(sessionId: string, status: "live" | "ended") {
    const supabase = await createClient();
    const updates: Record<string, any> = { status, updated_at: new Date().toISOString() };
    if (status === "live") { updates.started_at = new Date().toISOString(); updates.current_block = 0; }
    if (status === "ended") updates.ended_at = new Date().toISOString();

    const { data: updated, error } = await supabase.from("club_live_sessions").update(updates).eq("id", sessionId).select("club_id");
    if (error) return { error: error.message };
    if (!updated || updated.length === 0) return { error: "No tienes permiso." };
    revalidatePath(`/app/clubs/${updated[0].club_id}`);
    return { success: true };
}

/** Avanza/retrocede el bloque de la agenda. Solo gestor (RLS). */
export async function setSessionBlock(sessionId: string, index: number) {
    const supabase = await createClient();
    const { error } = await supabase.from("club_live_sessions").update({ current_block: Math.max(0, index), updated_at: new Date().toISOString() }).eq("id", sessionId).select("id");
    if (error) return { error: error.message };
    return { success: true };
}

export async function saveSessionSummary(sessionId: string, summary: string) {
    const supabase = await createClient();
    const { data: updated, error } = await supabase.from("club_live_sessions").update({ summary: summary.trim() || null, updated_at: new Date().toISOString() }).eq("id", sessionId).select("club_id");
    if (error) return { error: error.message };
    if (!updated || updated.length === 0) return { error: "No tienes permiso." };
    revalidatePath(`/app/clubs/${updated[0].club_id}`);
    return { success: true };
}

/** Envía un mensaje al chat de la sesión (debe estar en vivo). */
export async function sendSessionMessage(sessionId: string, content: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "No autenticado" };
    const text = content.trim();
    if (!text) return { error: "Mensaje vacío" };
    if (text.length > 2000) return { error: "Mensaje demasiado largo" };

    const { data: session } = await supabase.from("club_live_sessions").select("status").eq("id", sessionId).maybeSingle();
    if (!session) return { error: "Sesión no encontrada" };
    if (session.status !== "live") return { error: "La sesión no está en vivo." };

    const { error } = await supabase.from("club_session_messages").insert({ session_id: sessionId, user_id: user.id, content: text });
    if (error) return { error: error.message };
    return { success: true };
}

/** Carga inicial de mensajes (el resto llega por Realtime). */
export async function getSessionMessages(sessionId: string): Promise<SessionMessage[]> {
    const supabase = await createClient();
    const { data } = await supabase
        .from("club_session_messages")
        .select("id, user_id, content, created_at")
        .eq("session_id", sessionId)
        .order("created_at", { ascending: true })
        .limit(500);
    const rows = (data ?? []) as any[];
    if (rows.length === 0) return [];

    const userIds = [...new Set(rows.map((r) => r.user_id))];
    const { data: profiles } = await supabase.from("profiles").select("id, full_name, avatar_url").in("id", userIds);
    const byId = new Map<string, any>((profiles ?? []).map((p: any) => [p.id, p]));

    return rows.map((r) => {
        const p = byId.get(r.user_id);
        return { id: r.id, userId: r.user_id, content: r.content, createdAt: r.created_at, authorName: p?.full_name ?? null, authorAvatar: p?.avatar_url ?? null };
    });
}
