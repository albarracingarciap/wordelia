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
    giftIdeas: GiftIdeaSummaryData[];
}

export interface GiftIdeaSummaryData {
    id: string;
    recipientId: string;
    title: string;
    author: string | null;
    coverUrl: string | null;
    price: number | null;
    isPurchased: boolean;
    giftStatus: "IDEA" | "RESERVED" | "PURCHASED" | "WRAPPED" | "DELIVERED";
    privateNote: string | null;
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
            ideas:gift_ideas(id, recipient_id, title, author, cover_url, price, is_purchased, gift_status, private_note)
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
        const ideas = (r.ideas || []).map((idea: any) => ({
            id: idea.id,
            recipientId: idea.recipient_id,
            title: idea.title,
            author: idea.author,
            coverUrl: idea.cover_url,
            price: idea.price == null ? null : Number(idea.price),
            isPurchased: idea.is_purchased,
            giftStatus: idea.gift_status || (idea.is_purchased ? "PURCHASED" : "IDEA"),
            privateNote: idea.private_note,
        }));

        return {
            id: r.id,
            name: r.name,
            relation: r.relation,
            avatarUrl: r.avatar_url,
            notes: r.notes,
            giftIdeasCount: ideas.length,
            giftIdeas: ideas,
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
    avatarUrl?: string | null;
    eventName?: string;
    eventDate?: string;
}) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "No autenticado" };

    if (!data.name.trim()) return { error: "El nombre es obligatorio" };

    const normalizedName = data.name.trim();
    const normalizedRelation = data.relation?.trim() || null;

    const { data: existingRecipient } = await supabase
        .from("gift_recipients")
        .select("id")
        .eq("user_id", user.id)
        .ilike("name", normalizedName)
        .limit(1)
        .maybeSingle();

    if (existingRecipient) return { error: "Ya tienes una persona con ese nombre." };

    // Insert recipient
    const { data: recipient, error } = await supabase
        .from("gift_recipients")
        .insert({
            user_id: user.id,
            name: normalizedName,
            relation: normalizedRelation,
            avatar_url: data.avatarUrl || null,
            notes: data.notes?.trim() || null,
        })
        .select("id")
        .single();

    if (error) return { error: error.message };

    // Insert event if provided
    if (data.eventName && data.eventDate && recipient) {
        const { error: eventError } = await supabase.from("gift_events").insert({
            recipient_id: recipient.id,
            name: data.eventName,
            event_date: data.eventDate,
            is_recurring: true,
        });

        if (eventError) return { error: eventError.message };
    }

    revalidatePath("/app/wishes");
    return { success: true };
}

export async function updateGiftRecipient(id: string, data: {
    name: string;
    relation?: string;
    notes?: string;
    avatarUrl?: string | null;
    eventId?: string | null;
    eventName?: string;
    eventDate?: string;
}) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "No autenticado" };

    if (!data.name.trim()) return { error: "El nombre es obligatorio" };

    const normalizedName = data.name.trim();
    const normalizedRelation = data.relation?.trim() || null;

    const { data: existingRecipient } = await supabase
        .from("gift_recipients")
        .select("id")
        .eq("user_id", user.id)
        .ilike("name", normalizedName)
        .neq("id", id)
        .limit(1)
        .maybeSingle();

    if (existingRecipient) return { error: "Ya tienes una persona con ese nombre." };

    const { error: updateError } = await supabase
        .from("gift_recipients")
        .update({
            name: normalizedName,
            relation: normalizedRelation,
            avatar_url: data.avatarUrl || null,
            notes: data.notes?.trim() || null,
        })
        .eq("id", id)
        .eq("user_id", user.id);

    if (updateError) return { error: updateError.message };

    if (data.eventName && data.eventDate) {
        if (data.eventId) {
            const { error: eventUpdateError } = await supabase
                .from("gift_events")
                .update({
                    name: data.eventName,
                    event_date: data.eventDate,
                    is_recurring: true,
                })
                .eq("id", data.eventId);

            if (eventUpdateError) return { error: eventUpdateError.message };
        } else {
            const { error: eventInsertError } = await supabase.from("gift_events").insert({
                recipient_id: id,
                name: data.eventName,
                event_date: data.eventDate,
                is_recurring: true,
            });

            if (eventInsertError) return { error: eventInsertError.message };
        }
    } else if (data.eventId) {
        const { error: eventDeleteError } = await supabase
            .from("gift_events")
            .delete()
            .eq("id", data.eventId);

        if (eventDeleteError) return { error: eventDeleteError.message };
    }

    revalidatePath("/app/wishes");
    revalidatePath(`/app/wishes/person/${id}`);
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
