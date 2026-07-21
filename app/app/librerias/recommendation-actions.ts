"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";

export interface RecommendationItem {
    id: string;
    bookId: string | null;
    title: string;
    author: string | null;
    coverUrl: string | null;
    isbn: string | null;
    note: string | null;
}

export interface RecommendationList {
    id: string;
    title: string;
    description: string | null;
    isPublished: boolean;
    sortOrder: number;
    items: RecommendationItem[];
}

/** Libro elegido en el selector, reducido a lo que guardamos en la recomendación. */
export interface RecommendationBookInput {
    title: string;
    author?: string | null;
    coverUrl?: string | null;
    isbn?: string | null;
}

async function assertOrgManager(supabase: any, orgId: string, userId: string) {
    const { data: membership } = await supabase
        .from("organization_members")
        .select("role")
        .eq("organization_id", orgId)
        .eq("user_id", userId)
        .maybeSingle();
    if (!membership || !["owner", "manager"].includes(membership.role)) {
        throw new Error("No tienes permiso para gestionar esta librería.");
    }
}

/** Localiza el id de la lista y su organización (para autorizar operaciones por ítem/lista). */
async function orgOfList(supabase: any, listId: string): Promise<string | null> {
    const { data } = await supabase.from("org_recommendation_lists").select("organization_id").eq("id", listId).maybeSingle();
    return data?.organization_id ?? null;
}

/** Todas las listas de una librería (incluidas no publicadas) con sus ítems. Solo gestor. */
export async function getRecommendationLists(orgId: string): Promise<RecommendationList[]> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];
    try {
        await assertOrgManager(supabase, orgId, user.id);
    } catch {
        return [];
    }

    const { data: lists } = await supabase
        .from("org_recommendation_lists")
        .select("id, title, description, is_published, sort_order")
        .eq("organization_id", orgId)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true });

    const listRows = (lists ?? []) as any[];
    if (listRows.length === 0) return [];

    const { data: items } = await supabase
        .from("org_recommendation_items")
        .select("id, list_id, book_id, title, author, cover_url, isbn, note, sort_order")
        .in("list_id", listRows.map((l) => l.id))
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true });

    const itemsByList = new Map<string, RecommendationItem[]>();
    for (const it of (items ?? []) as any[]) {
        const arr = itemsByList.get(it.list_id) ?? [];
        arr.push({ id: it.id, bookId: it.book_id ?? null, title: it.title, author: it.author ?? null, coverUrl: it.cover_url ?? null, isbn: it.isbn ?? null, note: it.note ?? null });
        itemsByList.set(it.list_id, arr);
    }

    return listRows.map((l) => ({
        id: l.id,
        title: l.title,
        description: l.description ?? null,
        isPublished: l.is_published,
        sortOrder: l.sort_order,
        items: itemsByList.get(l.id) ?? [],
    }));
}

/** Listas PUBLICADAS de una librería con sus ítems. Lectura pública (perfil, home). */
export async function getPublishedRecommendations(orgId: string): Promise<RecommendationList[]> {
    const supabase = await createClient();

    const { data: lists } = await supabase
        .from("org_recommendation_lists")
        .select("id, title, description, is_published, sort_order")
        .eq("organization_id", orgId)
        .eq("is_published", true)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true });

    const listRows = (lists ?? []) as any[];
    if (listRows.length === 0) return [];

    const { data: items } = await supabase
        .from("org_recommendation_items")
        .select("id, list_id, book_id, title, author, cover_url, isbn, note, sort_order")
        .in("list_id", listRows.map((l) => l.id))
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true });

    const itemsByList = new Map<string, RecommendationItem[]>();
    for (const it of (items ?? []) as any[]) {
        const arr = itemsByList.get(it.list_id) ?? [];
        arr.push({ id: it.id, bookId: it.book_id ?? null, title: it.title, author: it.author ?? null, coverUrl: it.cover_url ?? null, isbn: it.isbn ?? null, note: it.note ?? null });
        itemsByList.set(it.list_id, arr);
    }

    // Solo listas con al menos un libro (una estantería vacía no aporta en público).
    return listRows
        .map((l) => ({ id: l.id, title: l.title, description: l.description ?? null, isPublished: true, sortOrder: l.sort_order, items: itemsByList.get(l.id) ?? [] }))
        .filter((l) => l.items.length > 0);
}

export interface BookRecommender {
    orgId: string;
    name: string;
    slug: string | null;
    city: string | null;
    logoUrl: string | null;
    brandColor: string | null;
    note: string | null;
}

/**
 * Librerías que recomiendan un libro (en una estantería publicada), con su nota.
 * Casa por book_id (catálogo) o por ISBN. Lectura pública para la ficha de libro.
 */
export async function getBookRecommenders(bookId: string | null, isbn: string | null): Promise<BookRecommender[]> {
    const supabase = await createClient();

    const conds: string[] = [];
    if (bookId) conds.push(`book_id.eq.${bookId}`);
    if (isbn) conds.push(`isbn.eq.${isbn}`);
    if (conds.length === 0) return [];

    const { data: items } = await supabase
        .from("org_recommendation_items")
        .select("list_id, note")
        .or(conds.join(","));
    const itemRows = (items ?? []) as any[];
    if (itemRows.length === 0) return [];

    const listIds = [...new Set(itemRows.map((i) => i.list_id))];
    const { data: lists } = await supabase
        .from("org_recommendation_lists")
        .select("id, organization_id")
        .in("id", listIds)
        .eq("is_published", true);
    const pubLists = (lists ?? []) as any[];
    if (pubLists.length === 0) return [];
    const listToOrg = new Map<string, string>(pubLists.map((l) => [l.id, l.organization_id]));

    const orgIds = [...new Set(pubLists.map((l) => l.organization_id))];
    const { data: orgs } = await supabase
        .from("organizations")
        .select("id, name, slug, city, logo_url, brand_color")
        .in("id", orgIds)
        .eq("is_active", true);
    const orgById = new Map<string, any>((orgs ?? []).map((o) => [o.id, o]));

    // Una entrada por librería (con la primera nota disponible para este libro).
    const byOrg = new Map<string, BookRecommender>();
    for (const it of itemRows) {
        const orgId = listToOrg.get(it.list_id);
        if (!orgId) continue; // lista no publicada
        const org = orgById.get(orgId);
        if (!org) continue; // librería inactiva
        const existing = byOrg.get(orgId);
        if (!existing) {
            byOrg.set(orgId, { orgId, name: org.name, slug: org.slug ?? null, city: org.city ?? null, logoUrl: org.logo_url ?? null, brandColor: org.brand_color ?? null, note: it.note ?? null });
        } else if (!existing.note && it.note) {
            existing.note = it.note;
        }
    }
    return [...byOrg.values()];
}

export async function createRecommendationList(orgId: string, data: { title: string; description?: string }) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "No autenticado" };
    if (!data.title?.trim()) return { error: "El título es obligatorio." };
    try {
        await assertOrgManager(supabase, orgId, user.id);
        const { count } = await supabase.from("org_recommendation_lists").select("id", { count: "exact", head: true }).eq("organization_id", orgId);
        const { error } = await supabase.from("org_recommendation_lists").insert({
            organization_id: orgId,
            title: data.title.trim(),
            description: data.description?.trim() || null,
            sort_order: count ?? 0,
        });
        if (error) return { error: error.message };
        revalidatePath("/app/librerias");
        return { success: true };
    } catch (e: any) {
        return { error: e.message };
    }
}

export async function updateRecommendationList(listId: string, data: { title?: string; description?: string; isPublished?: boolean }) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "No autenticado" };

    const updates: Record<string, any> = { updated_at: new Date().toISOString() };
    if (data.title !== undefined) {
        if (!data.title.trim()) return { error: "El título es obligatorio." };
        updates.title = data.title.trim();
    }
    if (data.description !== undefined) updates.description = data.description.trim() || null;
    if (data.isPublished !== undefined) updates.is_published = data.isPublished;

    // RLS restringe a gestores; .select() detecta el no-op (bloqueado / no existe).
    const { data: updated, error } = await supabase.from("org_recommendation_lists").update(updates).eq("id", listId).select("id");
    if (error) return { error: error.message };
    if (!updated || updated.length === 0) return { error: "No tienes permiso para editar esta lista." };
    revalidatePath("/app/librerias");
    return { success: true };
}

export async function deleteRecommendationList(listId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "No autenticado" };
    const { data: deleted, error } = await supabase.from("org_recommendation_lists").delete().eq("id", listId).select("id");
    if (error) return { error: error.message };
    if (!deleted || deleted.length === 0) return { error: "No tienes permiso para eliminar esta lista." };
    revalidatePath("/app/librerias");
    return { success: true };
}

export async function addRecommendationItem(listId: string, book: RecommendationBookInput, note?: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "No autenticado" };
    if (!book?.title?.trim()) return { error: "Falta el libro." };

    try {
        const orgId = await orgOfList(supabase, listId);
        if (!orgId) return { error: "Lista no encontrada." };
        await assertOrgManager(supabase, orgId, user.id);

        const isbn = book.isbn?.trim() || null;
        // Enlace best-effort al catálogo por ISBN (para portada/enlaces si existe).
        let bookId: string | null = null;
        if (isbn) {
            const { data: ed } = await supabase.from("editions").select("book_id").or(`isbn13.eq.${isbn},isbn.eq.${isbn}`).maybeSingle();
            bookId = ed?.book_id ?? null;
        }

        const { count } = await supabase.from("org_recommendation_items").select("id", { count: "exact", head: true }).eq("list_id", listId);
        const { error } = await supabase.from("org_recommendation_items").insert({
            list_id: listId,
            book_id: bookId,
            title: book.title.trim(),
            author: book.author?.trim() || null,
            cover_url: book.coverUrl?.trim() || null,
            isbn,
            note: note?.trim() || null,
            sort_order: count ?? 0,
        });
        if (error) return { error: error.message };
        revalidatePath("/app/librerias");
        return { success: true };
    } catch (e: any) {
        return { error: e.message };
    }
}

export async function updateRecommendationItem(itemId: string, data: { note?: string }) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "No autenticado" };
    const updates: Record<string, any> = {};
    if (data.note !== undefined) updates.note = data.note.trim() || null;
    const { data: updated, error } = await supabase.from("org_recommendation_items").update(updates).eq("id", itemId).select("id");
    if (error) return { error: error.message };
    if (!updated || updated.length === 0) return { error: "No tienes permiso para editar esta recomendación." };
    revalidatePath("/app/librerias");
    return { success: true };
}

export async function deleteRecommendationItem(itemId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "No autenticado" };
    const { data: deleted, error } = await supabase.from("org_recommendation_items").delete().eq("id", itemId).select("id");
    if (error) return { error: error.message };
    if (!deleted || deleted.length === 0) return { error: "No tienes permiso para eliminar esta recomendación." };
    revalidatePath("/app/librerias");
    return { success: true };
}
