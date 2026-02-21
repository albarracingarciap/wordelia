"use server";

import { createClient } from "@/utils/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

function getAdminClient() {
    return createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
}

// --- TYPES ---

export interface WishlistItemData {
    id: string;
    wishlistId: string;
    bookId: string | null;
    title: string;
    author: string | null;
    coverUrl: string | null;
    price: number | null;
    priority: "HIGH" | "MEDIUM" | "LOW";
    status: "AVAILABLE" | "RESERVED" | "PURCHASED";
    reservedBy: string | null;
    crowdfunding: {
        target: number;
        collected: number;
    } | null;
    dedication: {
        message: string;
        from: string;
        style: string;
        isUnlocked: boolean;
        unlockDate?: string; // YYYY-MM-DD format
    } | null;
    privateNote: string | null;
}

export interface WishlistDetailData {
    id: string;
    name: string;
    emoji: string;
    description: string | null;
    privacy: "public" | "private" | "shared";
    targetDate: string | null;
    bookCount: number;
}

// --- ACTIONS ---

export async function getWishlistDetail(id: string): Promise<{
    wishlist: WishlistDetailData | null;
    items: WishlistItemData[];
    isOwner: boolean;
}> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const { data: wishlist, error: wError } = await supabase
        .from("wishlists")
        .select("id, name, emoji, description, privacy, target_date, user_id, wishlist_items(*)")
        .eq("id", id)
        .single();

    if (wError || !wishlist) {
        return { wishlist: null, items: [], isOwner: false };
    }

    const isOwner = !!user && wishlist.user_id === user.id;

    // Non-owners can only see public/shared lists
    if (!isOwner && wishlist.privacy === "private") {
        return { wishlist: null, items: [], isOwner: false };
    }

    const rawItems: any[] = wishlist.wishlist_items || [];

    const items: WishlistItemData[] = rawItems
        .sort((a, b) => {
            // Sort: HIGH first, then MEDIUM, then LOW
            const order = { HIGH: 0, MEDIUM: 1, LOW: 2 };
            return (order[a.priority as keyof typeof order] ?? 1) - (order[b.priority as keyof typeof order] ?? 1);
        })
        .map((i) => ({
            id: i.id,
            wishlistId: i.wishlist_id,
            bookId: i.book_id,
            title: i.title,
            author: i.author,
            coverUrl: i.cover_url,
            price: i.price ? Number(i.price) : null,
            priority: i.priority,
            status: i.status,
            reservedBy: i.reserved_by,
            crowdfunding: i.crowdfunding_target
                ? { target: Number(i.crowdfunding_target), collected: Number(i.crowdfunding_collected || 0) }
                : null,
            dedication: i.dedication || null,
            privateNote: i.private_note,
        }));

    return {
        wishlist: {
            id: wishlist.id,
            name: wishlist.name,
            emoji: wishlist.emoji || "📚",
            description: wishlist.description,
            privacy: wishlist.privacy,
            targetDate: wishlist.target_date,
            bookCount: items.length,
        },
        items,
        isOwner,
    };
}

export async function addItemToWishlist(wishlistId: string, data: {
    title: string;
    author?: string;
    coverUrl?: string;
    price?: number;
    bookId?: string;
    priority?: "HIGH" | "MEDIUM" | "LOW";
}) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "No autenticado" };

    // Verify ownership
    const { data: wl } = await supabase
        .from("wishlists")
        .select("user_id")
        .eq("id", wishlistId)
        .single();

    if (!wl || wl.user_id !== user.id) return { error: "No autorizado" };

    const { error } = await supabase.from("wishlist_items").insert({
        wishlist_id: wishlistId,
        book_id: data.bookId || null,
        title: data.title,
        author: data.author || null,
        cover_url: data.coverUrl || null,
        price: data.price || null,
        priority: data.priority || "MEDIUM",
        status: "AVAILABLE",
    });

    if (error) return { error: error.message };
    revalidatePath(`/app/wishes/${wishlistId}`);
    return { success: true };
}

export async function removeItemFromWishlist(itemId: string, wishlistId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "No autenticado" };

    const { error } = await supabase
        .from("wishlist_items")
        .delete()
        .eq("id", itemId)
        .eq("wishlist_id", wishlistId);

    if (error) return { error: error.message };
    revalidatePath(`/app/wishes/${wishlistId}`);
    return { success: true };
}

export async function updateItemPriority(itemId: string, priority: "HIGH" | "MEDIUM" | "LOW", wishlistId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "No autenticado" };

    const { error } = await supabase
        .from("wishlist_items")
        .update({ priority })
        .eq("id", itemId);

    if (error) return { error: error.message };
    revalidatePath(`/app/wishes/${wishlistId}`);
    return { success: true };
}

export async function enableCrowdfunding(itemId: string, targetAmount: number, wishlistId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "No autenticado" };

    // Verify ownership
    const { data: wl } = await supabase
        .from("wishlists")
        .select("user_id")
        .eq("id", wishlistId)
        .single();

    if (!wl || wl.user_id !== user.id) return { error: "No autorizado" };

    const { error } = await supabase
        .from("wishlist_items")
        .update({
            crowdfunding_target: targetAmount,
            crowdfunding_collected: 0
        })
        .eq("id", itemId);

    if (error) return { error: error.message };
    revalidatePath(`/app/wishes/${wishlistId}`);
    return { success: true };
}

// --- GUEST ACTIONS (Requires Admin client to bypass RLS since guests only have FOR SELECT on wishlist_items) ---

export async function reserveWishlistItem(itemId: string, wishlistId: string, guestName: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Debes iniciar sesión para reservar regalos" };

    const adminClient = getAdminClient();

    // Safety check: is it already reserved?
    const { data: current } = await adminClient.from("wishlist_items").select("status").eq("id", itemId).single();
    if (current?.status === "RESERVED" || current?.status === "PURCHASED") {
        return { error: "Este artículo ya ha sido reservado o comprado" };
    }

    const { error } = await adminClient
        .from("wishlist_items")
        .update({
            status: "RESERVED",
            reserved_by: guestName,
            reserved_by_user_id: user ? user.id : null
        })
        .eq("id", itemId);

    if (error) return { error: error.message };
    revalidatePath(`/app/wishes/${wishlistId}`);
    return { success: true };
}

export async function markWishlistItemPurchased(itemId: string, wishlistId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Debes iniciar sesión para confirmar compra" };

    const adminClient = getAdminClient();

    // Verify they are either the owner of the wishlist or the reserver
    const { data: current } = await adminClient.from("wishlist_items").select("wishlist_id, reserved_by_user_id").eq("id", itemId).single();
    if (!current) return { error: "Artículo no encontrado" };

    let isAuthorized = false;
    if (current.reserved_by_user_id === user.id) {
        isAuthorized = true;
    } else {
        const { data: wl } = await supabase.from("wishlists").select("user_id").eq("id", current.wishlist_id).single();
        if (wl && wl.user_id === user.id) isAuthorized = true;
    }

    if (!isAuthorized) return { error: "No autorizado" };

    const { error } = await adminClient
        .from("wishlist_items")
        .update({ status: "PURCHASED" })
        .eq("id", itemId);

    if (error) return { error: error.message };
    revalidatePath(`/app/wishes/${wishlistId}`);
    revalidatePath(`/app/wishes`);
    return { success: true };
}

export async function cancelReservation(itemId: string, wishlistId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Debes iniciar sesión para cancelar una reserva" };

    const adminClient = getAdminClient();

    const { data: current } = await adminClient.from("wishlist_items").select("reserved_by_user_id").eq("id", itemId).single();
    if (!current || current.reserved_by_user_id !== user.id) {
        return { error: "No puedes cancelar una reserva que no es tuya" };
    }

    const { error } = await adminClient
        .from("wishlist_items")
        .update({
            status: "AVAILABLE",
            reserved_by: null,
            reserved_by_user_id: null
        })
        .eq("id", itemId);

    if (error) return { error: error.message };
    revalidatePath(`/app/wishes/${wishlistId}`);
    revalidatePath(`/app/wishes`);
    return { success: true };
}

export async function contributeToCrowdfunding(itemId: string, wishlistId: string, amount: number) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Debes iniciar sesión para contribuir" };

    const adminClient = getAdminClient();

    // Fetch current collected amount
    const { data: current, error: fetchError } = await adminClient
        .from("wishlist_items")
        .select("crowdfunding_collected, crowdfunding_target")
        .eq("id", itemId)
        .single();

    if (fetchError || !current) return { error: "Artículo no encontrado" };

    const newCollected = Number(current.crowdfunding_collected || 0) + amount;
    const isCompleted = newCollected >= Number(current.crowdfunding_target || 0);

    const updateData: any = { crowdfunding_collected: newCollected };
    if (isCompleted) {
        updateData.status = "PURCHASED";
    }

    const { error } = await adminClient
        .from("wishlist_items")
        .update(updateData)
        .eq("id", itemId);

    if (error) return { error: error.message };
    revalidatePath(`/app/wishes/${wishlistId}`);
    return { success: true };
}

export async function addDedication(itemId: string, wishlistId: string, dedication: { message: string; from: string; style: string; isUnlocked: boolean; unlockDate?: string }) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Debes iniciar sesión para añadir dedicatorias" };

    const adminClient = getAdminClient();

    const { error } = await adminClient
        .from("wishlist_items")
        .update({ dedication })
        .eq("id", itemId);

    if (error) return { error: error.message };
    revalidatePath(`/app/wishes/${wishlistId}`);
    return { success: true };
}
