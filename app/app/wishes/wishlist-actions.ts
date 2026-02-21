"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

// --- TYPES ---

export interface WishlistData {
    id: string;
    name: string;
    emoji: string;
    description: string | null;
    privacy: "public" | "private" | "shared";
    bookCount: number;
    coverImages: string[];
    lastUpdated: string;
}

// --- ACTIONS ---

export async function getMyWishlists(): Promise<WishlistData[]> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data: wishlists, error } = await supabase
        .from("wishlists")
        .select(`
            id, name, emoji, description, privacy, updated_at,
            items:wishlist_items(id, cover_url)
        `)
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false });

    if (error) {
        console.error("Error fetching wishlists:", error);
        return [];
    }

    return (wishlists || []).map((w: any) => {
        const items = w.items || [];
        const coverImages = items
            .filter((i: any) => i.cover_url)
            .slice(0, 3)
            .map((i: any) => i.cover_url);

        const now = new Date();
        const updated = new Date(w.updated_at);
        const diffDays = Math.floor((now.getTime() - updated.getTime()) / (1000 * 60 * 60 * 24));
        let lastUpdated = "Hoy";
        if (diffDays === 1) lastUpdated = "Ayer";
        else if (diffDays < 7) lastUpdated = `Hace ${diffDays} días`;
        else if (diffDays < 30) lastUpdated = `Hace ${Math.floor(diffDays / 7)} semanas`;
        else lastUpdated = `Hace ${Math.floor(diffDays / 30)} meses`;

        return {
            id: w.id,
            name: w.name,
            emoji: w.emoji || "📚",
            description: w.description,
            privacy: w.privacy as "public" | "private" | "shared",
            bookCount: items.length,
            coverImages,
            lastUpdated,
        };
    });
}

export async function createWishlist(data: {
    name: string;
    emoji: string;
    description?: string;
    privacy: "public" | "private" | "shared";
}) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "No autenticado" };

    if (!data.name.trim()) return { error: "El nombre es obligatorio" };

    const { error } = await supabase
        .from("wishlists")
        .insert({
            user_id: user.id,
            name: data.name.trim(),
            emoji: data.emoji,
            description: data.description?.trim() || null,
            privacy: data.privacy,
        });

    if (error) {
        console.error("Error creating wishlist:", error);
        return { error: error.message };
    }

    revalidatePath("/app/wishes");
    return { success: true };
}

export async function deleteWishlist(id: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "No autenticado" };

    const { error } = await supabase
        .from("wishlists")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

    if (error) return { error: error.message };
    revalidatePath("/app/wishes");
    return { success: true };
}

export async function updateWishlist(id: string, data: Partial<{
    name: string;
    emoji: string;
    description: string;
    privacy: "public" | "private" | "shared";
}>) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "No autenticado" };

    const { error } = await supabase
        .from("wishlists")
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq("id", id)
        .eq("user_id", user.id);

    if (error) return { error: error.message };
    revalidatePath("/app/wishes");
    return { success: true };
}
