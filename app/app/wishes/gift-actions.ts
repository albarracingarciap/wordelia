"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

// --- TYPES ---

export interface GiftEvent {
    id: string;
    name: string;
    eventDate: string;
    daysLeft: number | null;
    isRecurring: boolean;
}

export interface GiftRecipientData {
    id: string;
    name: string;
    relation: string | null;
    avatarUrl: string | null;
    notes: string | null;
    upcomingEvent: GiftEvent | null;
    giftIdeasCount: number;
}

export interface ReservedItemData {
    id: string;
    wishlistId: string;
    wishlistName: string;
    title: string;
    author: string | null;
    coverUrl: string | null;
    price: number | null;
    status: "RESERVED" | "PURCHASED";
    reservedAt: string;
}

// --- HELPERS ---

function getDaysLeft(dateStr: string): number {
    const today = new Date();
    const eventDate = new Date(dateStr);
    // For recurring events, use this year or next
    eventDate.setFullYear(today.getFullYear());
    if (eventDate < today) {
        eventDate.setFullYear(today.getFullYear() + 1);
    }
    return Math.ceil((eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

// --- ACTIONS ---

export async function getGiftRecipients(): Promise<GiftRecipientData[]> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data: recipients, error } = await supabase
        .from("gift_recipients")
        .select(`
            id, name, relation, avatar_url, notes,
            events:gift_events(id, name, event_date, is_recurring, remind_days_before),
            ideas:gift_ideas(id)
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Error fetching gift recipients:", error);
        return [];
    }

    return (recipients || []).map((r: any) => {
        const events: any[] = r.events || [];
        // Find the most urgent upcoming event
        const upcomingEvents = events
            .map((e: any) => ({
                ...e,
                daysLeft: getDaysLeft(e.event_date),
            }))
            .sort((a: any, b: any) => a.daysLeft - b.daysLeft);

        const nextEvent = upcomingEvents[0];

        return {
            id: r.id,
            name: r.name,
            relation: r.relation,
            avatarUrl: r.avatar_url,
            notes: r.notes,
            giftIdeasCount: (r.ideas || []).length,
            upcomingEvent: nextEvent
                ? {
                    id: nextEvent.id,
                    name: nextEvent.name,
                    eventDate: nextEvent.event_date,
                    daysLeft: nextEvent.daysLeft,
                    isRecurring: nextEvent.is_recurring,
                }
                : null,
        };
    });
}

export async function createGiftRecipient(data: {
    name: string;
    relation?: string;
    notes?: string;
    eventName?: string;
    eventDate?: string;
}) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "No autenticado" };

    if (!data.name.trim()) return { error: "El nombre es obligatorio" };

    // Insert recipient
    const { data: recipient, error } = await supabase
        .from("gift_recipients")
        .insert({
            user_id: user.id,
            name: data.name.trim(),
            relation: data.relation?.trim() || null,
            notes: data.notes?.trim() || null,
        })
        .select("id")
        .single();

    if (error) return { error: error.message };

    // Insert event if provided
    if (data.eventName && data.eventDate && recipient) {
        await supabase.from("gift_events").insert({
            recipient_id: recipient.id,
            name: data.eventName,
            event_date: data.eventDate,
            is_recurring: true,
        });
    }

    revalidatePath("/app/wishes");
    return { success: true };
}

export async function deleteGiftRecipient(id: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "No autenticado" };

    const { error } = await supabase
        .from("gift_recipients")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

    if (error) return { error: error.message };
    revalidatePath("/app/wishes");
    return { success: true };
}

export async function getMyReservations(): Promise<ReservedItemData[]> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
        .from("wishlist_items")
        .select(`
            id, wishlist_id, title, author, cover_url, price, status, updated_at,
            wishlists ( name )
        `)
        .eq("reserved_by_user_id", user.id)
        .order("updated_at", { ascending: false });

    if (error) {
        console.error("Error fetching reservations:", error);
        return [];
    }

    return (data || []).map((item: any) => ({
        id: item.id,
        wishlistId: item.wishlist_id,
        wishlistName: item.wishlists?.name || "Lista",
        title: item.title,
        author: item.author,
        coverUrl: item.cover_url,
        price: item.price,
        status: item.status as "RESERVED" | "PURCHASED",
        reservedAt: item.updated_at,
    }));
}
