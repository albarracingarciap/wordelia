// Capa de datos del panel admin de librerías. Server-only, service role: cruza
// organizations + organization_subscriptions + clubs + profiles (propietario),
// que no conceden SELECT global por RLS. `verified`/`admin_notes` no están en los
// tipos generados (migración 20260720_org_admin_fields), de ahí el cliente loose.
import { createAdminClient } from "@/utils/supabase/admin";

type LooseClient = { from: (table: string) => any };
function db(): LooseClient {
    return createAdminClient() as unknown as LooseClient;
}

export interface LibraryListRow {
    id: string;
    name: string;
    slug: string;
    city: string | null;
    verified: boolean;
    isActive: boolean;
    createdAt: string;
    tier: string;
    subStatus: string | null;
    clubsCount: number;
    ownerName: string | null;
    ownerEmail: string | null;
}

export type LibraryFilter = "all" | "pending" | "pro" | "suspended";

export async function fetchLibrariesList(query = "", filter: LibraryFilter = "all"): Promise<LibraryListRow[]> {
    const admin = db();

    let q = admin
        .from("organizations")
        .select("id, name, slug, city, verified, is_active, created_at, owner_id, subscription:organization_subscriptions(tier, status)")
        .order("created_at", { ascending: false })
        .limit(80);

    const safe = query.replace(/[%,()]/g, " ").trim();
    if (safe) q = q.or(`name.ilike.%${safe}%,city.ilike.%${safe}%,slug.ilike.%${safe}%`);
    if (filter === "pending") q = q.eq("verified", false);
    if (filter === "suspended") q = q.eq("is_active", false);

    const { data: orgs, error } = await q;
    if (error || !orgs) {
        // PostgrestError se serializa como {} si se loguea el objeto crudo.
        console.error("fetchLibrariesList:", error?.message, error?.hint ?? "", error?.code ?? "");
        return [];
    }

    const ids = orgs.map((o: any) => o.id);
    const ownerIds = orgs.map((o: any) => o.owner_id).filter(Boolean);

    const [{ data: clubs }, { data: owners }] = await Promise.all([
        ids.length ? admin.from("clubs").select("organization_id, is_archived").in("organization_id", ids) : Promise.resolve({ data: [] }),
        ownerIds.length ? admin.from("profiles").select("id, full_name, email").in("id", ownerIds) : Promise.resolve({ data: [] }),
    ]);

    const clubCount = new Map<string, number>();
    for (const c of (clubs ?? []) as any[]) {
        if (c.is_archived) continue;
        clubCount.set(c.organization_id, (clubCount.get(c.organization_id) ?? 0) + 1);
    }
    const ownerById = new Map<string, any>((owners ?? []).map((p: any) => [p.id, p]));

    const rows: LibraryListRow[] = orgs.map((o: any) => {
        const sub = Array.isArray(o.subscription) ? o.subscription[0] : o.subscription;
        const owner = ownerById.get(o.owner_id);
        return {
            id: o.id,
            name: o.name,
            slug: o.slug,
            city: o.city ?? null,
            verified: Boolean(o.verified),
            isActive: o.is_active !== false,
            createdAt: o.created_at,
            tier: sub?.tier ?? "free",
            subStatus: sub?.status ?? null,
            clubsCount: clubCount.get(o.id) ?? 0,
            ownerName: owner?.full_name ?? null,
            ownerEmail: owner?.email ?? null,
        };
    });

    // El filtro Pro se resuelve en JS (la sub es una relación embebida).
    return filter === "pro" ? rows.filter((r) => r.tier === "pro") : rows;
}

export interface LibraryWorkspace {
    org: {
        id: string;
        name: string;
        slug: string;
        description: string | null;
        logo_url: string | null;
        cover_url: string | null;
        website: string | null;
        contact_email: string | null;
        phone: string | null;
        address: string | null;
        city: string | null;
        region: string | null;
        country: string | null;
        brand_color: string | null;
        buy_link_template: string | null;
        is_active: boolean;
        verified: boolean;
        admin_notes: string | null;
        created_at: string;
        owner_id: string;
    };
    owner: { id: string; name: string | null; email: string | null } | null;
    subscription: {
        tier: string;
        status: string | null;
        billing_period: string | null;
        current_period_end: string | null;
        provider: string | null;
        provider_subscription_id: string | null;
    } | null;
    clubsCount: number;
}

export interface OrgClub {
    id: string;
    name: string;
    isArchived: boolean;
    isOfficial: boolean;
    coverUrl: string | null;
    currentBookTitle: string | null;
    membersCount: number;
}

/** Clubs alojados por la librería (activos y archivados) con lectura actual y nº de miembros. */
export async function fetchOrgClubs(orgId: string): Promise<OrgClub[]> {
    const admin = db();

    const { data: clubs } = await admin
        .from("clubs")
        .select("id, name, is_archived, is_official, cover_url, club_books(status, book:books(title))")
        .eq("organization_id", orgId)
        .order("created_at", { ascending: false });

    const list = (clubs ?? []) as any[];
    if (list.length === 0) return [];

    const ids = list.map((c) => c.id);
    const { data: members } = await admin
        .from("club_members")
        .select("club_id, role")
        .in("club_id", ids)
        .neq("role", "pending");

    const countByClub = new Map<string, number>();
    for (const m of (members ?? []) as any[]) countByClub.set(m.club_id, (countByClub.get(m.club_id) ?? 0) + 1);

    return list.map((c) => {
        const cb = Array.isArray(c.club_books) ? c.club_books.find((b: any) => b.status === "current") : null;
        const book = Array.isArray(cb?.book) ? cb.book[0] : cb?.book;
        return {
            id: c.id,
            name: c.name,
            isArchived: Boolean(c.is_archived),
            isOfficial: Boolean(c.is_official),
            coverUrl: c.cover_url ?? null,
            currentBookTitle: book?.title ?? null,
            membersCount: countByClub.get(c.id) ?? 0,
        };
    });
}

export interface OrgTeamMember {
    userId: string;
    name: string | null;
    username: string | null;
    email: string | null;
    avatarUrl: string | null;
    role: string;
    isOwner: boolean;
}

/** Equipo de la librería (organization_members) + el propietario legal (owner_id). */
export async function fetchOrgTeam(orgId: string): Promise<OrgTeamMember[]> {
    const admin = db();

    const [{ data: org }, { data: members }] = await Promise.all([
        admin.from("organizations").select("owner_id").eq("id", orgId).maybeSingle(),
        admin.from("organization_members").select("user_id, role").eq("organization_id", orgId),
    ]);

    const ownerId: string | null = org?.owner_id ?? null;
    const roleByUser = new Map<string, string>((members ?? []).map((m: any) => [m.user_id, m.role]));

    // El propietario siempre aparece aunque no tenga fila en members.
    const userIds = new Set<string>(roleByUser.keys());
    if (ownerId) userIds.add(ownerId);
    if (userIds.size === 0) return [];

    const { data: profiles } = await admin
        .from("profiles")
        .select("id, full_name, username, email, avatar_url")
        .in("id", [...userIds]);
    const profileById = new Map<string, any>((profiles ?? []).map((p: any) => [p.id, p]));

    const rows: OrgTeamMember[] = [...userIds].map((uid) => {
        const p = profileById.get(uid);
        return {
            userId: uid,
            name: p?.full_name ?? null,
            username: p?.username ?? null,
            email: p?.email ?? null,
            avatarUrl: p?.avatar_url ?? null,
            role: uid === ownerId ? "owner" : roleByUser.get(uid) ?? "staff",
            isOwner: uid === ownerId,
        };
    });

    // Owner primero, luego managers, luego staff.
    const order: Record<string, number> = { owner: 0, manager: 1, staff: 2 };
    return rows.sort((a, b) => (order[a.role] ?? 3) - (order[b.role] ?? 3));
}

export interface OrgPayment {
    id: string;
    amount_cents: number;
    currency: string;
    status: string;
    provider: string;
    created_at: string;
}

/** Pagos de la suscripción de la librería (product_type org_subscription). */
export async function fetchOrgPayments(orgId: string): Promise<OrgPayment[]> {
    const { data } = await db()
        .from("subscription_payments")
        .select("id, amount_cents, currency, status, provider, created_at")
        .eq("product_type", "org_subscription")
        .eq("reference_id", orgId)
        .order("created_at", { ascending: false })
        .limit(50);
    return (data ?? []) as OrgPayment[];
}

export async function fetchLibraryWorkspace(id: string): Promise<LibraryWorkspace | null> {
    const admin = db();

    const { data: org } = await admin
        .from("organizations")
        .select("id, name, slug, description, logo_url, cover_url, website, contact_email, phone, address, city, region, country, brand_color, buy_link_template, is_active, verified, admin_notes, created_at, owner_id")
        .eq("id", id)
        .maybeSingle();
    if (!org) return null;

    const [{ data: owner }, { data: sub }, { data: clubs }] = await Promise.all([
        admin.from("profiles").select("id, full_name, email").eq("id", org.owner_id).maybeSingle(),
        admin
            .from("organization_subscriptions")
            .select("tier, status, billing_period, current_period_end, provider, provider_subscription_id")
            .eq("organization_id", id)
            .maybeSingle(),
        admin.from("clubs").select("id, is_archived").eq("organization_id", id),
    ]);

    return {
        org,
        owner: owner ? { id: owner.id, name: owner.full_name ?? null, email: owner.email ?? null } : null,
        subscription: sub ?? null,
        clubsCount: (clubs ?? []).filter((c: any) => !c.is_archived).length,
    };
}
