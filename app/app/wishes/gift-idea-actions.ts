"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

// --- TYPES ---

export interface GiftIdeaData {
    id: string;
    recipientId: string;
    bookId: string | null;
    title: string;
    author: string | null;
    coverUrl: string | null;
    price: number | null;
    isPurchased: boolean;
    giftStatus: GiftIdeaStatus;
    isSecret: boolean;
    privateNote: string | null;
}

export type GiftIdeaStatus = "IDEA" | "RESERVED" | "PURCHASED" | "WRAPPED" | "DELIVERED";

export interface GiftRecipientDetailData {
    id: string;
    name: string;
    relation: string | null;
    avatarUrl: string | null;
    notes: string | null;
    upcomingEvent: {
        id: string;
        name: string;
        eventDate: string;
        daysLeft: number;
    } | null;
}

function getDaysLeft(dateStr: string): number {
    const today = new Date();
    const eventDate = new Date(dateStr);
    eventDate.setFullYear(today.getFullYear());
    if (eventDate < today) eventDate.setFullYear(today.getFullYear() + 1);
    return Math.ceil((eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

// --- ACTIONS ---

export async function getGiftRecipientDetail(id: string): Promise<{
    recipient: GiftRecipientDetailData | null;
    ideas: GiftIdeaData[];
}> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { recipient: null, ideas: [] };

    const { data: recipient, error } = await supabase
        .from("gift_recipients")
        .select(`
            id, name, relation, avatar_url, notes,
            events:gift_events(id, name, event_date),
            ideas:gift_ideas(*)
        `)
        .eq("id", id)
        .eq("user_id", user.id)
        .single();

    if (error || !recipient) return { recipient: null, ideas: [] };

    const events: any[] = recipient.events || [];
    const upcomingEvents = events
        .map((e: any) => ({ ...e, daysLeft: getDaysLeft(e.event_date) }))
        .sort((a: any, b: any) => a.daysLeft - b.daysLeft);

    const nextEvent = upcomingEvents[0];

    const ideas: GiftIdeaData[] = (recipient.ideas || []).map((i: any) => ({
        id: i.id,
        recipientId: i.recipient_id,
        bookId: i.book_id,
        title: i.title,
        author: i.author,
        coverUrl: i.cover_url,
        price: i.price ? Number(i.price) : null,
        isPurchased: i.is_purchased,
        giftStatus: i.gift_status || (i.is_purchased ? "PURCHASED" : "IDEA"),
        isSecret: i.is_secret,
        privateNote: i.private_note,
    }));

    return {
        recipient: {
            id: recipient.id,
            name: recipient.name,
            relation: recipient.relation,
            avatarUrl: recipient.avatar_url,
            notes: recipient.notes,
            upcomingEvent: nextEvent
                ? { id: nextEvent.id, name: nextEvent.name, eventDate: nextEvent.event_date, daysLeft: nextEvent.daysLeft }
                : null,
        },
        ideas,
    };
}

export async function addGiftIdea(recipientId: string, data: {
    title: string;
    author?: string;
    coverUrl?: string;
    price?: number;
    bookId?: string;
    privateNote?: string;
}) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "No autenticado" };

    // Verify ownership
    const { data: recipient } = await supabase
        .from("gift_recipients")
        .select("user_id")
        .eq("id", recipientId)
        .single();

    if (!recipient || recipient.user_id !== user.id) return { error: "No autorizado" };

    const { error } = await supabase.from("gift_ideas").insert({
        recipient_id: recipientId,
        book_id: data.bookId || null,
        title: data.title,
        author: data.author || null,
        cover_url: data.coverUrl || null,
        price: data.price || null,
        private_note: data.privateNote || null,
        is_purchased: false,
        gift_status: "IDEA",
        is_secret: true,
    });

    if (error) return { error: error.message };
    revalidatePath(`/app/wishes/person/${recipientId}`);
    revalidatePath("/app/wishes");
    return { success: true };
}

export async function markGiftIdeaAsPurchased(ideaId: string, recipientId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "No autenticado" };

    const { error } = await supabase
        .from("gift_ideas")
        .update({ is_purchased: true, gift_status: "PURCHASED" })
        .eq("id", ideaId);

    if (error) return { error: error.message };
    revalidatePath(`/app/wishes/person/${recipientId}`);
    revalidatePath("/app/wishes");
    return { success: true };
}

export async function updateGiftIdeaStatus(ideaId: string, recipientId: string, status: GiftIdeaStatus) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "No autenticado" };

    const { data: recipient } = await supabase
        .from("gift_recipients")
        .select("user_id")
        .eq("id", recipientId)
        .single();

    if (!recipient || recipient.user_id !== user.id) return { error: "No autorizado" };

    const { error } = await supabase
        .from("gift_ideas")
        .update({
            gift_status: status,
            is_purchased: ["PURCHASED", "WRAPPED", "DELIVERED"].includes(status),
        })
        .eq("id", ideaId)
        .eq("recipient_id", recipientId);

    if (error) return { error: error.message };
    revalidatePath(`/app/wishes/person/${recipientId}`);
    revalidatePath("/app/wishes");
    return { success: true };
}

export async function updateGiftIdea(ideaId: string, recipientId: string, data: {
    title: string;
    author?: string | null;
    price?: number | null;
    privateNote?: string | null;
}) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "No autenticado" };

    if (!data.title.trim()) return { error: "El título es obligatorio" };

    const { data: recipient } = await supabase
        .from("gift_recipients")
        .select("user_id")
        .eq("id", recipientId)
        .single();

    if (!recipient || recipient.user_id !== user.id) return { error: "No autorizado" };

    const { error } = await supabase
        .from("gift_ideas")
        .update({
            title: data.title.trim(),
            author: data.author?.trim() || null,
            price: data.price ?? null,
            private_note: data.privateNote?.trim() || null,
        })
        .eq("id", ideaId)
        .eq("recipient_id", recipientId);

    if (error) return { error: error.message };
    revalidatePath(`/app/wishes/person/${recipientId}`);
    revalidatePath("/app/wishes");
    return { success: true };
}

export async function deleteGiftIdea(ideaId: string, recipientId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "No autenticado" };

    const { error } = await supabase
        .from("gift_ideas")
        .delete()
        .eq("id", ideaId);

    if (error) return { error: error.message };
    revalidatePath(`/app/wishes/person/${recipientId}`);
    revalidatePath("/app/wishes");
    return { success: true };
}
