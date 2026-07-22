"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";

export interface PublicEvent {
    id: string;
    title: string;
    description: string | null;
    coverUrl: string | null;
    location: string | null;
    startsAt: string;
    priceCoins: number;
    capacity: number | null;
    taken: number;
    hasTicket: boolean;
    soldOut: boolean;
}

export interface EventsView {
    events: PublicEvent[];
    balance: number;
}

/** Eventos publicados y próximos, con aforo y si el usuario ya tiene entrada. */
export async function getPublishedEvents(): Promise<EventsView> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { events: [], balance: 0 };

    const nowIso = new Date().toISOString();

    const [{ data: events }, { data: wallet }, { data: myTickets }] = await Promise.all([
        supabase
            .from("wordelia_events")
            .select("id, title, description, cover_url, location, starts_at, price_coins, capacity")
            .eq("is_published", true)
            .gte("starts_at", nowIso)
            .order("starts_at", { ascending: true }),
        supabase.from("coin_wallets").select("balance").eq("user_id", user.id).maybeSingle(),
        supabase.from("wordelia_event_tickets").select("event_id").eq("user_id", user.id),
    ]);

    const eventRows = events ?? [];
    const myEventIds = new Set((myTickets ?? []).map((t) => t.event_id));

    // Recuento de entradas por evento (cross-user → service role).
    // Cast sin tipar: los tipos generados de Supabase están desfasados.
    const takenByEvent: Record<string, number> = {};
    if (eventRows.length > 0) {
        const adminDb = createAdminClient() as unknown as { from: (t: string) => any };
        const { data: tickets } = await adminDb
            .from("wordelia_event_tickets")
            .select("event_id")
            .in("event_id", eventRows.map((e) => e.id));
        for (const t of (tickets ?? []) as { event_id: string }[]) {
            takenByEvent[t.event_id] = (takenByEvent[t.event_id] ?? 0) + 1;
        }
    }

    const events2: PublicEvent[] = eventRows.map((e) => {
        const taken = takenByEvent[e.id] ?? 0;
        return {
            id: e.id,
            title: e.title,
            description: e.description,
            coverUrl: e.cover_url,
            location: e.location,
            startsAt: e.starts_at,
            priceCoins: e.price_coins,
            capacity: e.capacity,
            taken,
            hasTicket: myEventIds.has(e.id),
            soldOut: e.capacity != null && taken >= e.capacity,
        };
    });

    return { events: events2, balance: wallet?.balance ?? 0 };
}

/** Consigue una entrada gastando monedas. */
export async function claimEventTicket(eventId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Debes iniciar sesión" };

    const { data, error } = await supabase.rpc("spend_coins_event", { target_event_id: eventId });
    if (error) {
        console.error("[claimEventTicket]", error);
        return { error: error.message || "No se pudo conseguir la entrada" };
    }

    revalidatePath("/app/eventos");
    const row = Array.isArray(data) ? data[0] : data;
    return {
        success: true,
        alreadyTicket: row?.already_ticket ?? false,
        coinsSpent: row?.coins_spent ?? 0,
        newBalance: row?.new_balance ?? 0,
    };
}
