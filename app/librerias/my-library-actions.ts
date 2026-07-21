"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { getOrganizationClubs, getOrganizationEvents } from "@/app/app/librerias/actions";
import { getPublishedRecommendations } from "@/app/app/librerias/recommendation-actions";

export interface MyLibrary {
    organizationId: string;
    isPrimary: boolean;
}

/** Estado de "mi librería" para un botón concreto. */
export interface MyLibraryState {
    isAuthed: boolean;
    isMine: boolean;
    isPrimary: boolean;
    /** Cuántas librerías tiene adoptadas el lector (para decidir si ofrecer "hacer principal"). */
    total: number;
}

export interface PrimaryLibrary {
    id: string;
    name: string;
    slug: string | null;
    buyLinkTemplate: string | null;
    brandColor: string | null;
    logoUrl: string | null;
}

/** La librería principal del lector actual (null si no hay sesión o no ha elegido ninguna). */
export async function getMyPrimaryLibrary(): Promise<PrimaryLibrary | null> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: row } = await supabase
        .from("user_libraries")
        .select("organization_id")
        .eq("user_id", user.id)
        .eq("is_primary", true)
        .maybeSingle();
    if (!row) return null;

    const { data: org } = await supabase
        .from("organizations")
        .select("id, name, slug, buy_link_template, brand_color, logo_url, is_active")
        .eq("id", row.organization_id)
        .maybeSingle();
    if (!org || !org.is_active) return null;

    return {
        id: org.id,
        name: org.name,
        slug: org.slug ?? null,
        buyLinkTemplate: org.buy_link_template ?? null,
        brandColor: org.brand_color ?? null,
        logoUrl: org.logo_url ?? null,
    };
}

/** Librerías adoptadas por el lector actual (vacío si no hay sesión). */
export async function getMyLibraries(): Promise<MyLibrary[]> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
        .from("user_libraries")
        .select("organization_id, is_primary")
        .eq("user_id", user.id);
    if (error) {
        console.error("getMyLibraries:", error.message);
        return [];
    }
    return (data ?? []).map((r: any) => ({ organizationId: r.organization_id, isPrimary: r.is_primary }));
}

/** Adopciones del lector + si hay sesión (para el directorio: decidir si mostrar el toggle). */
export async function getMyLibrariesWithAuth(): Promise<{ isAuthed: boolean; libraries: MyLibrary[] }> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { isAuthed: false, libraries: [] };

    const { data } = await supabase
        .from("user_libraries")
        .select("organization_id, is_primary")
        .eq("user_id", user.id);
    return {
        isAuthed: true,
        libraries: (data ?? []).map((r: any) => ({ organizationId: r.organization_id, isPrimary: r.is_primary })),
    };
}

/** Estado de adopción de una librería para el lector actual. */
export async function getMyLibraryState(orgId: string): Promise<MyLibraryState> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { isAuthed: false, isMine: false, isPrimary: false, total: 0 };

    const { data } = await supabase
        .from("user_libraries")
        .select("organization_id, is_primary")
        .eq("user_id", user.id);
    const rows = (data ?? []) as any[];
    const mine = rows.find((r) => r.organization_id === orgId);
    return {
        isAuthed: true,
        isMine: !!mine,
        isPrimary: !!mine?.is_primary,
        total: rows.length,
    };
}

export interface MyLibraryHomeEntry {
    id: string;
    name: string;
    slug: string | null;
    logoUrl: string | null;
    brandColor: string | null;
    isPrimary: boolean;
    events: { id: string; title: string; startsAt: string; format: string; eventType: string; venue: string | null }[];
    clubs: { id: string; name: string; memberCount: number; currentBookTitle: string | null }[];
    recommendations: { id: string; title: string }[];
}

/**
 * Datos del módulo "Mi librería" de la home: por cada librería adoptada (principal
 * primero), sus próximos eventos y clubs públicos. Vacío si no hay sesión/adopciones.
 */
export async function getMyLibraryHome(): Promise<MyLibraryHomeEntry[]> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data: rows } = await supabase
        .from("user_libraries")
        .select("organization_id, is_primary")
        .eq("user_id", user.id);
    const list = (rows ?? []) as any[];
    if (list.length === 0) return [];

    const ids = list.map((r) => r.organization_id);
    const primaryById = new Map<string, boolean>(list.map((r) => [r.organization_id, r.is_primary]));

    const { data: orgs } = await supabase
        .from("organizations")
        .select("id, name, slug, logo_url, brand_color")
        .in("id", ids)
        .eq("is_active", true);

    const entries = await Promise.all(((orgs ?? []) as any[]).map(async (org) => {
        const [events, clubs, recos] = await Promise.all([
            getOrganizationEvents(org.id, { upcomingOnly: true }),
            getOrganizationClubs(org.id, { publicOnly: true }),
            getPublishedRecommendations(org.id),
        ]);
        const entry: MyLibraryHomeEntry = {
            id: org.id,
            name: org.name,
            slug: org.slug ?? null,
            logoUrl: org.logo_url ?? null,
            brandColor: org.brand_color ?? null,
            isPrimary: primaryById.get(org.id) ?? false,
            events: events.slice(0, 3).map((e) => ({
                id: e.id,
                title: e.title,
                startsAt: e.starts_at,
                format: e.format,
                eventType: e.event_type,
                venue: e.location ?? null,
            })),
            clubs: (clubs as any[]).slice(0, 3).map((c) => ({
                id: c.id,
                name: c.name,
                memberCount: c.memberCount ?? 0,
                currentBookTitle: c.currentBook?.title ?? null,
            })),
            recommendations: recos.slice(0, 2).map((l) => ({ id: l.id, title: l.title })),
        };
        return entry;
    }));

    // Principal primero, luego por nombre.
    return entries.sort((a, b) => (Number(b.isPrimary) - Number(a.isPrimary)) || a.name.localeCompare(b.name));
}

/** Marca una librería adoptada como principal (degrada la anterior). */
async function promoteToPrimary(supabase: any, userId: string, orgId: string) {
    await supabase.from("user_libraries").update({ is_primary: false }).eq("user_id", userId).eq("is_primary", true);
    await supabase.from("user_libraries").update({ is_primary: true }).eq("user_id", userId).eq("organization_id", orgId);
}

/**
 * Adopta o retira una librería. Al adoptar la primera, se marca principal. Al retirar
 * la principal teniendo otras, se promociona la más reciente para no quedar sin principal.
 */
export async function toggleMyLibrary(orgId: string): Promise<MyLibraryState | { error: string }> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Inicia sesión para elegir tu librería." };

    // La librería debe existir y estar activa.
    const { data: org } = await supabase.from("organizations").select("id").eq("id", orgId).eq("is_active", true).maybeSingle();
    if (!org) return { error: "Esta librería no está disponible." };

    const { data: existing } = await supabase
        .from("user_libraries")
        .select("organization_id, is_primary")
        .eq("user_id", user.id);
    const rows = (existing ?? []) as any[];
    const mine = rows.find((r) => r.organization_id === orgId);

    if (mine) {
        // Retirar.
        const { error } = await supabase.from("user_libraries").delete().eq("user_id", user.id).eq("organization_id", orgId);
        if (error) return { error: error.message };
        // Si era la principal y quedan otras, promociona la más reciente.
        if (mine.is_primary) {
            const { data: rest } = await supabase
                .from("user_libraries")
                .select("organization_id")
                .eq("user_id", user.id)
                .order("created_at", { ascending: false })
                .limit(1);
            const next = (rest ?? [])[0];
            if (next) await promoteToPrimary(supabase, user.id, next.organization_id);
        }
        revalidatePath(`/librerias`);
        return { isAuthed: true, isMine: false, isPrimary: false, total: Math.max(0, rows.length - 1) };
    }

    // Adoptar: principal si es la primera.
    const isPrimary = rows.length === 0;
    const { error } = await supabase.from("user_libraries").insert({ user_id: user.id, organization_id: orgId, is_primary: isPrimary });
    if (error) return { error: error.message };
    revalidatePath(`/librerias`);
    return { isAuthed: true, isMine: true, isPrimary, total: rows.length + 1 };
}

/** Marca como principal una librería ya adoptada. */
export async function setPrimaryLibrary(orgId: string): Promise<MyLibraryState | { error: string }> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Inicia sesión para elegir tu librería." };

    const { data: mine } = await supabase
        .from("user_libraries")
        .select("organization_id")
        .eq("user_id", user.id)
        .eq("organization_id", orgId)
        .maybeSingle();
    if (!mine) return { error: "Primero haz tuya esta librería." };

    await promoteToPrimary(supabase, user.id, orgId);
    const { count } = await supabase.from("user_libraries").select("organization_id", { count: "exact", head: true }).eq("user_id", user.id);
    revalidatePath(`/librerias`);
    return { isAuthed: true, isMine: true, isPrimary: true, total: count ?? 1 };
}
