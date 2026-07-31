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
        message?: string;          // solo se envía si el viewer es el autor o está desbloqueada
        from: string;
        style: string;
        isUnlocked: boolean;       // estado EFECTIVO (calculado en servidor)
        unlockDate?: string;       // fecha resuelta (la de la lista si unlockOnEventDate)
        unlockOnEventDate?: boolean;
        mine?: boolean;            // el viewer es quien la escribió (puede editar)
    } | null;
    // El viewer puede dejar/editar la dedicatoria: comprador de un regalo solo, o
    // cualquier mecenas de un bote (regalo grupal).
    canDedicate?: boolean;
    privateNote: string | null;
    // Mecenas del bote (solo para el propietario). Por etiqueta NO se expone el
    // importe por persona al destinatario: solo nombre (o null si anónimo) + nota.
    contributions?: { name: string | null; note: string | null }[];
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

type RawDedication = {
    message?: string;
    from?: string;
    style?: string;
    isUnlocked?: boolean;
    unlockDate?: string;
    unlockOnEventDate?: boolean;
} | null | undefined;

/**
 * Estado EFECTIVO de la tarjeta sorpresa + gating del mensaje. El mensaje solo se
 * envía si el viewer es el autor (para editarlo) o si está desbloqueada. Desbloqueo:
 * manual/now (isUnlocked), fecha exacta (unlockDate), o la fecha de la lista
 * (unlockOnEventDate → sigue a wishlists.target_date, así cambiar el cumpleaños importa).
 */
function buildDedication(
    raw: RawDedication,
    reservedByUserId: string | null,
    targetDate: string | null,
    viewerId: string | null,
    isContributor: boolean,
): WishlistItemData["dedication"] {
    if (!raw || !raw.from) return null;
    // Autor = comprador del regalo solo, o cualquier mecenas del bote (grupal).
    const isAuthor = (!!viewerId && reservedByUserId === viewerId) || isContributor;
    const todayStr = new Date().toISOString().slice(0, 10);

    let unlocked = false;
    let resolvedDate: string | undefined;
    if (raw.isUnlocked) {
        unlocked = true;
    } else if (raw.unlockOnEventDate) {
        resolvedDate = targetDate ?? undefined;
        unlocked = !!targetDate && targetDate <= todayStr;
    } else if (raw.unlockDate) {
        resolvedDate = raw.unlockDate;
        unlocked = raw.unlockDate <= todayStr;
    }

    return {
        from: raw.from,
        style: raw.style ?? "classic",
        isUnlocked: unlocked,
        unlockDate: resolvedDate,
        unlockOnEventDate: !!raw.unlockOnEventDate,
        mine: isAuthor,
        message: isAuthor || unlocked ? raw.message : undefined,
    };
}

// ¿Puede el usuario gestionar la dedicatoria de este item? Comprador de un regalo
// solo (reservado + comprado), o cualquier mecenas de un bote (regalo grupal).
async function canManageDedication(adminClient: ReturnType<typeof getAdminClient>, itemId: string, userId: string): Promise<boolean> {
    const { data: item } = await adminClient
        .from("wishlist_items")
        .select("reserved_by_user_id, status, crowdfunding_target")
        .eq("id", itemId)
        .single();
    if (!item) return false;
    if (item.reserved_by_user_id === userId && item.status === "PURCHASED") return true;
    if (item.crowdfunding_target != null) {
        const { count } = await adminClient
            .from("wishlist_contributions")
            .select("id", { count: "exact", head: true })
            .eq("item_id", itemId)
            .eq("contributor_user_id", userId);
        if ((count ?? 0) > 0) return true;
    }
    return false;
}

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

    // Items en los que el viewer ha contribuido a un bote (habilita la dedicatoria
    // grupal: cualquier mecenas puede escribirla/editarla y ver su mensaje).
    let viewerContributedItems = new Set<string>();
    if (user && rawItems.length > 0) {
        const adminClient = getAdminClient();
        const { data: myContribs } = await adminClient
            .from("wishlist_contributions")
            .select("item_id")
            .eq("contributor_user_id", user.id)
            .in("item_id", rawItems.map((i: any) => i.id));
        viewerContributedItems = new Set((myContribs ?? []).map((c: any) => c.item_id as string));
    }

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
            dedication: buildDedication(i.dedication, i.reserved_by_user_id, wishlist.target_date, user?.id ?? null, viewerContributedItems.has(i.id)),
            canDedicate: (!!user && i.reserved_by_user_id === user.id && i.status === "PURCHASED") || viewerContributedItems.has(i.id),
            privateNote: i.private_note,
        }));

    // Mecenas: solo para el propietario, de los items con bote. Se lee con service
    // role (la RLS de contribuciones solo deja ver las propias).
    if (isOwner) {
        const boteItemIds = items.filter((i) => i.crowdfunding).map((i) => i.id);
        if (boteItemIds.length > 0) {
            const adminClient = getAdminClient();
            const { data: contribs } = await adminClient
                .from("wishlist_contributions")
                .select("item_id, contributor_name, note, is_anonymous, created_at")
                .in("item_id", boteItemIds)
                .order("created_at", { ascending: true });
            const byItem = new Map<string, WishlistItemData["contributions"]>();
            for (const c of contribs ?? []) {
                const list = byItem.get(c.item_id) ?? [];
                list!.push({ name: c.is_anonymous ? null : c.contributor_name, note: c.note });
                byItem.set(c.item_id, list);
            }
            for (const it of items) it.contributions = byItem.get(it.id) ?? [];
        }
    }

    // Saneado de la sorpresa: el propietario NO recibe el estado de reserva/compra
    // ni quién reservó (ni siquiera por red). Ve su lista como "disponible". Así su
    // "Vista amigo" es una previsualización limpia y no se estropea la sorpresa.
    // (El bote sí lo ve — es un regalo grupal transparente que él gestiona.)
    if (isOwner) {
        for (const it of items) {
            it.status = "AVAILABLE";
            it.reservedBy = null;
        }
    }

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

    // Verificar propiedad de la lista (antes se confiaba solo en RLS).
    const { data: wl } = await supabase.from("wishlists").select("user_id").eq("id", wishlistId).single();
    if (!wl || wl.user_id !== user.id) return { error: "No autorizado" };

    // No borrar un libro con contribuciones en el bote (no hay reembolso): hay que
    // desactivar el bote primero. Evita destruir el registro de mecenas sin querer.
    const { data: item } = await supabase
        .from("wishlist_items")
        .select("crowdfunding_collected")
        .eq("id", itemId)
        .eq("wishlist_id", wishlistId)
        .single();
    if (item && Number(item.crowdfunding_collected || 0) > 0) {
        return { error: "Este libro tiene contribuciones en su bote. Desactiva el bote antes de borrarlo." };
    }

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

    // Verificar propiedad de la lista.
    const { data: wl } = await supabase.from("wishlists").select("user_id").eq("id", wishlistId).single();
    if (!wl || wl.user_id !== user.id) return { error: "No autorizado" };

    const { error } = await supabase
        .from("wishlist_items")
        .update({ priority })
        .eq("id", itemId)
        .eq("wishlist_id", wishlistId);

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

    const target = Number(targetAmount);
    if (!Number.isFinite(target) || target <= 0) return { error: "El objetivo debe ser mayor que 0." };

    // No re-activar un bote existente (borraría lo recaudado). Para cambiarlo se usará
    // la edición del objetivo (W2).
    const { data: existing } = await supabase
        .from("wishlist_items")
        .select("crowdfunding_target")
        .eq("id", itemId)
        .eq("wishlist_id", wishlistId)
        .single();
    if (existing?.crowdfunding_target) return { error: "Este libro ya tiene un bote activo." };

    const { error } = await supabase
        .from("wishlist_items")
        .update({
            crowdfunding_target: target,
            crowdfunding_collected: 0
        })
        .eq("id", itemId)
        .eq("wishlist_id", wishlistId);

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

    // El propietario no reserva en su propia lista (spoiler + no tiene sentido).
    const { data: ownerWl } = await adminClient.from("wishlists").select("user_id").eq("id", wishlistId).single();
    if (ownerWl?.user_id === user.id) return { error: "No puedes reservar en tu propia lista." };

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

export async function contributeToCrowdfunding(itemId: string, wishlistId: string, amount: number, note?: string, anonymous?: boolean) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Debes iniciar sesión para contribuir" };

    // Validación de importe en servidor (el modal valida, pero no es fiable).
    const amt = Number(amount);
    if (!Number.isFinite(amt) || amt <= 0) return { error: "El importe debe ser mayor que 0." };

    const adminClient = getAdminClient();

    // El propietario no contribuye al bote de su propia lista.
    const { data: ownerWl } = await adminClient.from("wishlists").select("user_id").eq("id", wishlistId).single();
    if (ownerWl?.user_id === user.id) return { error: "No puedes contribuir al bote de tu propia lista." };

    const { data: current, error: fetchError } = await adminClient
        .from("wishlist_items")
        .select("crowdfunding_collected, crowdfunding_target, status")
        .eq("id", itemId)
        .single();

    if (fetchError || !current) return { error: "Artículo no encontrado" };
    if (!current.crowdfunding_target) return { error: "Este libro no tiene un bote activo." };
    if (current.status === "PURCHASED") return { error: "El bote de este libro ya está completo." };

    const target = Number(current.crowdfunding_target);
    const collected = Number(current.crowdfunding_collected || 0);
    const remaining = Math.max(0, target - collected);
    if (amt > remaining) return { error: `Solo faltan ${remaining.toFixed(2)}€ para completar el bote.` };

    // Nombre para mostrar en el mayor.
    const { data: profile } = await adminClient
        .from("profiles")
        .select("full_name, username")
        .eq("id", user.id)
        .maybeSingle();
    const contributorName = profile?.full_name || profile?.username || null;

    // Registrar la contribución en el libro mayor.
    const { error: insertError } = await adminClient.from("wishlist_contributions").insert({
        item_id: itemId,
        contributor_user_id: user.id,
        contributor_name: contributorName,
        amount: amt,
        note: note?.trim() || null,
        is_anonymous: !!anonymous,
    });
    if (insertError) return { error: insertError.message };

    // Recalcular el acumulado como SUMA del mayor (fuente de verdad).
    const { data: rows } = await adminClient.from("wishlist_contributions").select("amount").eq("item_id", itemId);
    const newCollected = (rows ?? []).reduce((sum: number, r: { amount: number }) => sum + Number(r.amount), 0);
    const isCompleted = newCollected >= target;

    const { error } = await adminClient
        .from("wishlist_items")
        .update({ crowdfunding_collected: newCollected, ...(isCompleted ? { status: "PURCHASED" } : {}) })
        .eq("id", itemId);

    if (error) return { error: error.message };
    revalidatePath(`/app/wishes/${wishlistId}`);
    return { success: true };
}

export async function addDedication(itemId: string, wishlistId: string, dedication: { message: string; from: string; style: string; isUnlocked: boolean; unlockDate?: string; unlockOnEventDate?: boolean }) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Debes iniciar sesión para añadir dedicatorias" };

    const adminClient = getAdminClient();

    // Autor autorizado: comprador del regalo solo, o cualquier mecenas del bote.
    if (!(await canManageDedication(adminClient, itemId, user.id))) {
        return { error: "Solo quien ha comprado (o contribuido al bote de) este regalo puede dejar una dedicatoria." };
    }

    const { error } = await adminClient
        .from("wishlist_items")
        .update({ dedication })
        .eq("id", itemId);

    if (error) return { error: error.message };
    revalidatePath(`/app/wishes/${wishlistId}`);
    return { success: true };
}

export async function removeDedication(itemId: string, wishlistId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Debes iniciar sesión" };

    const adminClient = getAdminClient();

    // Comprador del regalo solo, o cualquier mecenas del bote.
    if (!(await canManageDedication(adminClient, itemId, user.id))) {
        return { error: "Solo quien ha comprado (o contribuido al bote de) este regalo puede quitar la dedicatoria." };
    }

    const { error } = await adminClient.from("wishlist_items").update({ dedication: null }).eq("id", itemId);
    if (error) return { error: error.message };
    revalidatePath(`/app/wishes/${wishlistId}`);
    return { success: true };
}

export async function updateCrowdfundingTarget(itemId: string, wishlistId: string, newTarget: number) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "No autenticado" };

    const { data: wl } = await supabase.from("wishlists").select("user_id").eq("id", wishlistId).single();
    if (!wl || wl.user_id !== user.id) return { error: "No autorizado" };

    const target = Number(newTarget);
    if (!Number.isFinite(target) || target <= 0) return { error: "El objetivo debe ser mayor que 0." };

    const { data: item } = await supabase
        .from("wishlist_items")
        .select("crowdfunding_target, crowdfunding_collected")
        .eq("id", itemId)
        .eq("wishlist_id", wishlistId)
        .single();
    if (!item?.crowdfunding_target) return { error: "Este libro no tiene un bote activo." };

    const collected = Number(item.crowdfunding_collected || 0);
    if (target < collected) {
        return { error: `No puedes bajar el objetivo por debajo de lo ya recaudado (${collected.toFixed(2)}€).` };
    }

    const { error } = await supabase
        .from("wishlist_items")
        .update({ crowdfunding_target: target, ...(collected >= target ? { status: "PURCHASED" } : {}) })
        .eq("id", itemId)
        .eq("wishlist_id", wishlistId);

    if (error) return { error: error.message };
    revalidatePath(`/app/wishes/${wishlistId}`);
    return { success: true };
}

export async function disableCrowdfunding(itemId: string, wishlistId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "No autenticado" };

    const { data: wl } = await supabase.from("wishlists").select("user_id").eq("id", wishlistId).single();
    if (!wl || wl.user_id !== user.id) return { error: "No autorizado" };

    const adminClient = getAdminClient();

    // Bote simbólico y sin reembolso: al desactivar se borra el mayor y se limpia el
    // bote. Si el bote había completado el item (PURCHASED), se revierte a AVAILABLE.
    await adminClient.from("wishlist_contributions").delete().eq("item_id", itemId);

    const { data: item } = await adminClient.from("wishlist_items").select("status").eq("id", itemId).single();
    const revert = item?.status === "PURCHASED" ? { status: "AVAILABLE" } : {};

    const { error } = await adminClient
        .from("wishlist_items")
        .update({ crowdfunding_target: null, crowdfunding_collected: 0, ...revert })
        .eq("id", itemId);

    if (error) return { error: error.message };
    revalidatePath(`/app/wishes/${wishlistId}`);
    return { success: true };
}
