"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";

export interface WishlistCandidateData {
    id: string;
    wishlistId: string;
    source: "manual" | "isbn_scan" | "cover_photo";
    status: "draft" | "matched" | "needs_review" | "added" | "discarded";
    title: string;
    author: string | null;
    isbn: string | null;
    coverUrl: string | null;
    photoUrl: string | null;
    price: number | null;
    priority: "HIGH" | "MEDIUM" | "LOW";
    notes: string | null;
    confidence: number | null;
    createdAt: string;
}

async function requireWishlistOwner(wishlistId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { supabase, user: null, error: "No autenticado" };

    const { data: wishlist } = await supabase
        .from("wishlists")
        .select("user_id")
        .eq("id", wishlistId)
        .single();

    if (!wishlist || wishlist.user_id !== user.id) {
        return { supabase, user, error: "No autorizado" };
    }

    return { supabase, user, error: null };
}

export async function getWishlistCandidates(wishlistId: string): Promise<WishlistCandidateData[]> {
    const { supabase, error } = await requireWishlistOwner(wishlistId);
    if (error) return [];

    const { data, error: fetchError } = await supabase
        .from("wishlist_candidates")
        .select("*")
        .eq("wishlist_id", wishlistId)
        .in("status", ["draft", "matched", "needs_review"])
        .order("created_at", { ascending: false });

    if (fetchError) {
        console.error("Error fetching wishlist candidates:", fetchError);
        return [];
    }

    return (data || []).map((candidate: any) => ({
        id: candidate.id,
        wishlistId: candidate.wishlist_id,
        source: candidate.source,
        status: candidate.status,
        title: candidate.title,
        author: candidate.author,
        isbn: candidate.isbn,
        coverUrl: candidate.cover_url,
        photoUrl: candidate.photo_url,
        price: candidate.price ? Number(candidate.price) : null,
        priority: candidate.priority || "MEDIUM",
        notes: candidate.notes,
        confidence: candidate.confidence == null ? null : Number(candidate.confidence),
        createdAt: candidate.created_at,
    }));
}

export async function createWishlistCandidate(wishlistId: string, data: {
    source: "manual" | "isbn_scan" | "cover_photo";
    status?: "draft" | "matched" | "needs_review";
    title: string;
    author?: string | null;
    isbn?: string | null;
    coverUrl?: string | null;
    photoUrl?: string | null;
    price?: number | null;
    priority?: "HIGH" | "MEDIUM" | "LOW";
    notes?: string | null;
    confidence?: number | null;
}) {
    const { supabase, user, error } = await requireWishlistOwner(wishlistId);
    if (error) return { error };

    if (!data.title.trim()) return { error: "El titulo es obligatorio" };

    const duplicate = await findDuplicateCandidateOrItem(supabase, wishlistId, {
        title: data.title,
        author: data.author,
        isbn: data.isbn,
        source: data.source,
    });
    if (duplicate) return { error: duplicate };

    const status = data.status || (data.source === "manual" || data.source === "isbn_scan" ? "matched" : "needs_review");

    const { error: insertError } = await supabase
        .from("wishlist_candidates")
        .insert({
            wishlist_id: wishlistId,
            user_id: user!.id,
            source: data.source,
            status,
            title: data.title.trim(),
            author: data.author || null,
            isbn: data.isbn || null,
            cover_url: data.coverUrl || null,
            photo_url: data.photoUrl || null,
            price: data.price ?? null,
            priority: data.priority || "MEDIUM",
            notes: data.notes || null,
            confidence: data.confidence ?? null,
        });

    if (insertError) return { error: insertError.message };

    revalidatePath(`/app/wishes/${wishlistId}`);
    return { success: true };
}

export async function updateWishlistCandidate(candidateId: string, wishlistId: string, data: Partial<{
    title: string;
    author: string | null;
    isbn: string | null;
    price: number | null;
    priority: "HIGH" | "MEDIUM" | "LOW";
    notes: string | null;
}>) {
    const { supabase, error } = await requireWishlistOwner(wishlistId);
    if (error) return { error };

    if (data.title !== undefined && !data.title.trim()) {
        return { error: "El titulo es obligatorio" };
    }

    const { error: updateError } = await supabase
        .from("wishlist_candidates")
        .update({
            title: data.title?.trim(),
            author: data.author,
            isbn: data.isbn,
            price: data.price,
            priority: data.priority,
            notes: data.notes,
            status: "matched",
        })
        .eq("id", candidateId)
        .eq("wishlist_id", wishlistId);

    if (updateError) return { error: updateError.message };

    revalidatePath(`/app/wishes/${wishlistId}`);
    return { success: true };
}

export async function addCandidateToWishlist(candidateId: string, wishlistId: string) {
    const { supabase, error } = await requireWishlistOwner(wishlistId);
    if (error) return { error };

    const { data: candidate, error: candidateError } = await supabase
        .from("wishlist_candidates")
        .select("*")
        .eq("id", candidateId)
        .eq("wishlist_id", wishlistId)
        .single();

    if (candidateError || !candidate) return { error: "Candidato no encontrado" };

    const { error: itemError } = await supabase
        .from("wishlist_items")
        .insert({
            wishlist_id: wishlistId,
            book_id: candidate.isbn || null,
            title: candidate.title,
            author: candidate.author || null,
            cover_url: candidate.cover_url || null,
            price: candidate.price ?? null,
            priority: candidate.priority || "MEDIUM",
            status: "AVAILABLE",
        });

    if (itemError) return { error: itemError.message };

    const { error: updateError } = await supabase
        .from("wishlist_candidates")
        .update({ status: "added" })
        .eq("id", candidateId)
        .eq("wishlist_id", wishlistId);

    if (updateError) return { error: updateError.message };

    revalidatePath(`/app/wishes/${wishlistId}`);
    revalidatePath("/app/wishes");
    return { success: true };
}

export async function discardWishlistCandidate(candidateId: string, wishlistId: string) {
    const { supabase, error } = await requireWishlistOwner(wishlistId);
    if (error) return { error };

    const { error: updateError } = await supabase
        .from("wishlist_candidates")
        .update({ status: "discarded" })
        .eq("id", candidateId)
        .eq("wishlist_id", wishlistId);

    if (updateError) return { error: updateError.message };

    revalidatePath(`/app/wishes/${wishlistId}`);
    return { success: true };
}

async function findDuplicateCandidateOrItem(supabase: any, wishlistId: string, data: {
    title: string;
    author?: string | null;
    isbn?: string | null;
    source: "manual" | "isbn_scan" | "cover_photo";
}) {
    if (data.source === "cover_photo" && !data.isbn) return null;

    const isbn = data.isbn?.trim();
    if (isbn) {
        const { data: existingItem } = await supabase
            .from("wishlist_items")
            .select("id")
            .eq("wishlist_id", wishlistId)
            .eq("book_id", isbn)
            .limit(1)
            .maybeSingle();

        if (existingItem) return "Este libro ya esta en la lista.";

        const { data: existingCandidate } = await supabase
            .from("wishlist_candidates")
            .select("id")
            .eq("wishlist_id", wishlistId)
            .eq("isbn", isbn)
            .in("status", ["draft", "matched", "needs_review"])
            .limit(1)
            .maybeSingle();

        if (existingCandidate) return "Este libro ya esta capturado en tienda.";
    }

    const normalizedTitle = data.title.trim().toLowerCase();
    if (!normalizedTitle || normalizedTitle.startsWith("portada pendiente")) return null;

    const { data: candidateRows } = await supabase
        .from("wishlist_candidates")
        .select("id, title, author")
        .eq("wishlist_id", wishlistId)
        .in("status", ["draft", "matched", "needs_review"])
        .limit(30);

    const normalizedAuthor = (data.author || "").trim().toLowerCase();
    const hasCandidateTitleMatch = (candidateRows || []).some((row: any) =>
        String(row.title || "").trim().toLowerCase() === normalizedTitle &&
        String(row.author || "").trim().toLowerCase() === normalizedAuthor
    );

    if (hasCandidateTitleMatch) return "Este libro ya esta capturado en tienda.";

    return null;
}
