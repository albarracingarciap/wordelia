"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";

export interface AdminEvent {
    id: string;
    title: string;
    description: string | null;
    coverUrl: string | null;
    location: string | null;
    startsAt: string;
    priceCoins: number;
    capacity: number | null;
    ticketCount: number;
    isPublished: boolean;
    createdAt: string;
}

export interface EventInput {
    title: string;
    description?: string | null;
    coverUrl?: string | null;
    location?: string | null;
    startsAt: string;      // ISO
    priceCoins: number;
    capacity?: number | null;
}

async function assertAdmin() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("No autenticado");
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    if (profile?.role !== "admin") throw new Error("No autorizado");
}

function admin() {
    return createAdminClient() as unknown as { from: (t: string) => any };
}

function sanitize(input: EventInput): { value?: Record<string, unknown>; error?: string } {
    const title = (input.title || "").trim();
    if (!title) return { error: "El título es obligatorio." };
    if (!input.startsAt) return { error: "La fecha del evento es obligatoria." };
    const date = new Date(input.startsAt);
    if (Number.isNaN(date.getTime())) return { error: "Fecha no válida." };
    const price = Math.max(0, Math.round(Number(input.priceCoins) || 0));
    const capacity = input.capacity == null || input.capacity === undefined || `${input.capacity}` === ""
        ? null
        : Math.max(1, Math.round(Number(input.capacity)));
    return {
        value: {
            title,
            description: (input.description || "").trim() || null,
            cover_url: (input.coverUrl || "").trim() || null,
            location: (input.location || "").trim() || null,
            starts_at: date.toISOString(),
            price_coins: price,
            capacity,
        },
    };
}

export async function adminListEvents(): Promise<AdminEvent[]> {
    try { await assertAdmin(); } catch { return []; }
    const a = admin();
    const { data } = await a
        .from("wordelia_events")
        .select("id, title, description, cover_url, location, starts_at, price_coins, capacity, is_published, created_at, tickets:wordelia_event_tickets(count)")
        .order("starts_at", { ascending: false });
    return ((data ?? []) as any[]).map((r) => ({
        id: r.id,
        title: r.title,
        description: r.description,
        coverUrl: r.cover_url,
        location: r.location,
        startsAt: r.starts_at,
        priceCoins: r.price_coins,
        capacity: r.capacity,
        ticketCount: r.tickets?.[0]?.count ?? 0,
        isPublished: r.is_published,
        createdAt: r.created_at,
    }));
}

export async function adminCreateEvent(input: EventInput) {
    try { await assertAdmin(); } catch { return { error: "No autorizado" }; }
    const { value, error } = sanitize(input);
    if (error) return { error };
    const { error: dbError } = await admin().from("wordelia_events").insert({ ...value, is_published: false });
    if (dbError) return { error: dbError.message };
    revalidatePath("/app/admin/eventos");
    return { success: true };
}

export async function adminUpdateEvent(id: string, input: EventInput) {
    try { await assertAdmin(); } catch { return { error: "No autorizado" }; }
    const { value, error } = sanitize(input);
    if (error) return { error };
    const { error: dbError } = await admin().from("wordelia_events").update({ ...value, updated_at: new Date().toISOString() }).eq("id", id);
    if (dbError) return { error: dbError.message };
    revalidatePath("/app/admin/eventos");
    revalidatePath("/app/eventos");
    return { success: true };
}

export async function adminSetEventPublished(id: string, published: boolean) {
    try { await assertAdmin(); } catch { return { error: "No autorizado" }; }
    const { error } = await admin().from("wordelia_events").update({ is_published: published, updated_at: new Date().toISOString() }).eq("id", id);
    if (error) return { error: error.message };
    revalidatePath("/app/admin/eventos");
    revalidatePath("/app/eventos");
    return { success: true };
}

export async function adminDeleteEvent(id: string) {
    try { await assertAdmin(); } catch { return { error: "No autorizado" }; }
    const { error } = await admin().from("wordelia_events").delete().eq("id", id);
    if (error) return { error: error.message };
    revalidatePath("/app/admin/eventos");
    revalidatePath("/app/eventos");
    return { success: true };
}
