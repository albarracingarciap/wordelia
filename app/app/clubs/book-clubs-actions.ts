"use server";

import { createAdminClient } from "@/utils/supabase/admin";

type LooseClient = { from: (table: string) => any };

export interface BookClub {
    id: string;
    name: string;
    slug: string | null;
    isOfficial: boolean;
    coverUrl: string | null;
    memberCount: number;
    status: "current" | "planned";
    organizationName: string | null;
    organizationSlug: string | null;
}

/**
 * Clubs PÚBLICOS u OFICIALES que están leyendo (o han programado) un libro. Para la
 * ficha de libro. Service-role + filtro de visibilidad manual (el RLS de `clubs` no
 * está en migraciones; no dependemos de él en superficie pública). Nunca expone
 * clubs private/secret ni archivados.
 */
export async function getClubsReadingBook(bookId: string | null): Promise<BookClub[]> {
    if (!bookId) return [];
    const admin = createAdminClient() as unknown as LooseClient;

    const { data: cb } = await admin
        .from("club_books")
        .select("club_id, status")
        .eq("book_id", bookId)
        .in("status", ["current", "planned"]);
    const rows = (cb ?? []) as any[];
    if (rows.length === 0) return [];

    // Un estado por club, priorizando 'current' sobre 'planned'.
    const statusByClub = new Map<string, "current" | "planned">();
    for (const r of rows) {
        const prev = statusByClub.get(r.club_id);
        if (!prev || (prev !== "current" && r.status === "current")) statusByClub.set(r.club_id, r.status);
    }
    const clubIds = [...statusByClub.keys()];

    const { data: clubs } = await admin
        .from("clubs")
        .select("id, name, slug, cover_url, is_official, visibility, is_archived, organization_id")
        .in("id", clubIds);
    // Solo públicos u oficiales, no archivados.
    const clubRows = ((clubs ?? []) as any[]).filter((c) => !c.is_archived && (c.visibility === "public" || c.is_official));
    if (clubRows.length === 0) return [];

    const { data: members } = await admin
        .from("club_members")
        .select("club_id, role")
        .in("club_id", clubRows.map((c) => c.id));
    const countByClub = new Map<string, number>();
    for (const m of (members ?? []) as any[]) {
        if (m.role === "pending") continue;
        countByClub.set(m.club_id, (countByClub.get(m.club_id) ?? 0) + 1);
    }

    const orgIds = [...new Set(clubRows.map((c) => c.organization_id).filter(Boolean))];
    const orgById = new Map<string, any>();
    if (orgIds.length) {
        const { data: orgs } = await admin.from("organizations").select("id, name, slug").in("id", orgIds).eq("is_active", true);
        for (const o of (orgs ?? []) as any[]) orgById.set(o.id, o);
    }

    return clubRows
        .map((c) => {
            const org = c.organization_id ? orgById.get(c.organization_id) : null;
            return {
                id: c.id,
                name: c.name,
                slug: c.slug ?? null,
                isOfficial: !!c.is_official,
                coverUrl: c.cover_url ?? null,
                memberCount: countByClub.get(c.id) ?? 0,
                status: statusByClub.get(c.id)!,
                organizationName: org?.name ?? null,
                organizationSlug: org?.slug ?? null,
            } as BookClub;
        })
        .sort((a, b) => Number(b.isOfficial) - Number(a.isOfficial) || b.memberCount - a.memberCount);
}
