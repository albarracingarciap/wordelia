"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

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
    } | null;
    privateNote: string | null;
}

export interface WishlistDetailData {
    id: string;
    name: string;
    emoji: string;
    description: string | null;
    privacy: "public" | "private" | "shared";
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
        .select("id, name, emoji, description, privacy, user_id, wishlist_items(*)")
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
