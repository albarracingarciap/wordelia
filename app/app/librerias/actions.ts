'use server';

import { createClient } from '@/utils/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';
import { Organization, OrganizationEvent, OrganizationLocation } from '@/types/organizations';
import { isOrgProActive } from '@/lib/subscription-access';
import { FREE_LOCATION_LIMIT, FREE_UPCOMING_EVENT_LIMIT } from '@/lib/org-limits';

async function orgIsPro(supabase: any, orgId: string): Promise<boolean> {
    const { data: sub } = await supabase
        .from('organization_subscriptions')
        .select('tier, status, current_period_end')
        .eq('organization_id', orgId)
        .maybeSingle();
    return isOrgProActive(sub);
}

function getAdminClient() {
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceRoleKey) return null;
    return createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceRoleKey);
}

function generateSlug(name: string) {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
        + '-' + Math.random().toString(36).substring(2, 8);
}

const EDITABLE_FIELDS = [
    'name', 'description', 'logo_url', 'cover_url', 'website',
    'contact_email', 'phone', 'address', 'city', 'region', 'country',
    'buy_link_template', 'brand_color',
] as const;

/**
 * Self-serve creation of a bookstore ("librería"), abierto a cualquier usuario
 * (es un eje B2B independiente del plan de consumidor). El creador es owner y la
 * librería arranca en el tier gratis; Pro se activa con el checkout self-serve.
 */
export async function createOrganization(data: any) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Debes iniciar sesión para registrar una librería.' };

    const name = (data?.name || '').trim();
    if (!name) return { error: 'El nombre de la librería es obligatorio.' };

    const slug = generateSlug(name);

    try {
        const { data: org, error: orgError } = await supabase
            .from('organizations')
            .insert({
                name,
                slug,
                type: 'bookstore',
                description: data.description || null,
                website: data.website || null,
                contact_email: data.contact_email || null,
                phone: data.phone || null,
                address: data.address || null,
                city: data.city || null,
                region: data.region || null,
                owner_id: user.id,
            })
            .select()
            .single();

        if (orgError) {
            console.error('Error creating organization:', orgError);
            // Slug collision (unique) — extremely rare given the random suffix.
            if ((orgError as any).code === '23505') return { error: 'No se pudo crear la librería. Inténtalo de nuevo.' };
            return { error: `Error DB: ${orgError.message}` };
        }

        // The `on_organization_created` trigger provisions the owner membership
        // and the free-tier subscription (security definer), so no manual inserts.

        revalidatePath('/app/librerias');
        revalidatePath('/librerias');
        return { success: true, organizationId: org.id, slug: org.slug };
    } catch (err: any) {
        console.error('Unknown error in createOrganization:', err);
        return { error: err.message || 'Error desconocido' };
    }
}

/** The librería owned by the current user (MVP: single owner). */
export async function getMyOrganization(): Promise<Organization | null> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
        .from('organizations')
        .select('*, subscription:organization_subscriptions(*)')
        .eq('owner_id', user.id)
        .limit(1)
        .maybeSingle();

    if (error) {
        console.error('Error fetching my organization:', error);
        return null;
    }
    if (!data) return null;
    return { ...data, subscription: Array.isArray(data.subscription) ? data.subscription[0] ?? null : data.subscription };
}

/** All librerías owned by the current user (a chain). */
export async function getMyOrganizations(): Promise<Organization[]> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
        .from('organizations')
        .select('*, subscription:organization_subscriptions(*)')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: true });

    if (error) {
        console.error('Error fetching my organizations:', error);
        return [];
    }
    return (data || []).map((o: any) => ({
        ...o,
        subscription: Array.isArray(o.subscription) ? o.subscription[0] ?? null : o.subscription,
    }));
}

export async function updateOrganization(orgId: string, fields: Record<string, any>) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'No autenticado' };

    const updates: Record<string, any> = { updated_at: new Date().toISOString() };
    for (const key of EDITABLE_FIELDS) {
        if (key in fields) updates[key] = fields[key] === '' ? null : fields[key];
    }

    // RLS restricts UPDATE to owner/managers. Use .select() to detect the case
    // where it matched no rows (blocked by RLS or wrong id) and avoid a false
    // "success".
    const { data: updated, error } = await supabase
        .from('organizations')
        .update(updates)
        .eq('id', orgId)
        .select('id');

    if (error) {
        console.error('Error updating organization:', error);
        return { error: error.message };
    }
    if (!updated || updated.length === 0) {
        return { error: 'No tienes permiso para editar esta librería.' };
    }

    revalidatePath('/app/librerias');
    revalidatePath('/librerias');
    return { success: true };
}

export async function getOrganizationBySlug(slug: string): Promise<Organization | null> {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('organizations')
        .select('*, subscription:organization_subscriptions(*)')
        .eq('slug', slug)
        .eq('is_active', true)
        .maybeSingle();

    if (error || !data) return null;
    return { ...data, subscription: Array.isArray(data.subscription) ? data.subscription[0] ?? null : data.subscription };
}

/** Public directory: active bookstores. */
export async function getOrganizations(search?: string): Promise<Organization[]> {
    const supabase = await createClient();
    let query = supabase
        .from('organizations')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

    if (search) query = query.ilike('name', `%${search}%`);

    const { data, error } = await query;
    if (error) {
        console.error('Error fetching organizations:', error);
        return [];
    }
    return data || [];
}

/** Clubs hosted by an organization (with member counts + current book). */
export async function getOrganizationClubs(orgId: string, opts: { publicOnly?: boolean } = {}) {
    const supabase = await createClient();

    let query = supabase
        .from('clubs')
        .select(`
            *,
            current_book: club_books(
                *,
                book: books(*, author: authors(name))
            )
        `)
        .eq('organization_id', orgId)
        .eq('is_archived', false)
        .order('created_at', { ascending: false });

    if (opts.publicOnly) query = query.eq('visibility', 'public');

    const { data, error } = await query;
    if (error) {
        console.error('Error fetching organization clubs:', error);
        return [];
    }

    const clubs = data || [];
    const clubIds = clubs.map((c: any) => c.id);

    // Single query for member counts (avoids a per-club N+1).
    const memberCountByClub = new Map<string, number>();
    if (clubIds.length) {
        const { data: memberRows } = await supabase
            .from('club_members')
            .select('club_id')
            .in('club_id', clubIds);
        for (const m of memberRows || []) memberCountByClub.set(m.club_id, (memberCountByClub.get(m.club_id) || 0) + 1);
    }

    // Resolve one ISBN per current book (from editions) for buy links.
    const currentBookByClub = new Map<string, any>();
    const bookIds: string[] = [];
    for (const club of clubs) {
        const cb = Array.isArray(club.current_book) ? club.current_book.find((b: any) => b.status === 'current') : null;
        currentBookByClub.set(club.id, cb || null);
        if (cb?.book_id) bookIds.push(cb.book_id);
    }
    const isbnByBook = new Map<string, string>();
    if (bookIds.length) {
        const { data: editions } = await supabase
            .from('editions')
            .select('book_id, isbn13, isbn')
            .in('book_id', bookIds);
        for (const e of editions || []) {
            if (isbnByBook.has(e.book_id)) continue;
            const isbn = e.isbn13 || e.isbn;
            if (isbn) isbnByBook.set(e.book_id, isbn);
        }
    }

    return clubs.map((club: any) => {
        const cb = currentBookByClub.get(club.id);
        return {
            ...club,
            memberCount: memberCountByClub.get(club.id) || 0,
            currentBook: cb && cb.book ? {
                bookId: cb.book_id,
                title: cb.book.title,
                author: cb.book.author?.name || 'Autor desconocido',
                coverUrl: cb.book.cover_url,
                isbn: isbnByBook.get(cb.book_id) || null,
            } : null,
        };
    });
}

export interface OrganizationAnalytics {
    totals: {
        activeClubs: number;
        readers: number;        // distinct members across the org's clubs (excl. pending)
        memberships: number;    // total memberships (excl. pending)
        posts: number;          // engagement: club posts across the org's clubs
        upcomingEvents: number;
        resourcesDelivered: number | null; // org_club grants (null if not computable)
    };
    perClub: Array<{
        id: string;
        name: string;
        bookTitle: string | null;
        members: number;
        posts: number;
        nextEvent: string | null;
    }>;
}

/** Aggregated analytics for a bookstore's hosted clubs. */
export async function getOrganizationAnalytics(orgId: string): Promise<OrganizationAnalytics | null> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    // Only owner/managers may see analytics.
    const { data: membership } = await supabase
        .from('organization_members')
        .select('role')
        .eq('organization_id', orgId)
        .eq('user_id', user.id)
        .maybeSingle();
    if (!membership || !['owner', 'manager'].includes(membership.role)) return null;

    const empty: OrganizationAnalytics = {
        totals: { activeClubs: 0, readers: 0, memberships: 0, posts: 0, upcomingEvents: 0, resourcesDelivered: null },
        perClub: [],
    };

    const { data: clubs } = await supabase
        .from('clubs')
        .select('id, name, is_archived, club_books(book_id, status, book:books(title))')
        .eq('organization_id', orgId);

    // Only active (non-archived) clubs feed the metrics, so every tile and the
    // per-club table stay consistent.
    const activeClubs = (clubs || []).filter((c: any) => !c.is_archived);
    const clubIds = activeClubs.map((c: any) => c.id);
    if (clubIds.length === 0) return empty;

    const currentBookByClub = new Map<string, { bookId: string | null; title: string | null }>();
    for (const c of activeClubs as any[]) {
        const cb = Array.isArray(c.club_books) ? c.club_books.find((b: any) => b.status === 'current') : null;
        const book = Array.isArray(cb?.book) ? cb.book[0] : cb?.book;
        currentBookByClub.set(c.id, { bookId: cb?.book_id ?? null, title: book?.title ?? null });
    }

    const [membersRes, postsRes, eventsRes] = await Promise.all([
        supabase.from('club_members').select('user_id, club_id, role').in('club_id', clubIds),
        supabase.from('club_posts').select('club_id').in('club_id', clubIds),
        supabase.from('club_calendar_events').select('club_id, starts_at').in('club_id', clubIds)
            .gte('starts_at', new Date().toISOString()).order('starts_at', { ascending: true }),
    ]);

    const realMembers = (membersRes.data || []).filter((m: any) => m.role !== 'pending');
    const readers = new Set(realMembers.map((m: any) => m.user_id)).size;

    const membersByClub = new Map<string, number>();
    for (const m of realMembers) membersByClub.set(m.club_id, (membersByClub.get(m.club_id) || 0) + 1);

    const postsByClub = new Map<string, number>();
    for (const p of postsRes.data || []) postsByClub.set(p.club_id, (postsByClub.get(p.club_id) || 0) + 1);

    const nextEventByClub = new Map<string, string>();
    for (const e of eventsRes.data || []) {
        if (!nextEventByClub.has(e.club_id)) nextEventByClub.set(e.club_id, e.starts_at);
    }

    // Resources delivered (org_club grants) — counted precisely by the org id
    // stored in each grant's metadata, so grants from other orgs' clubs for the
    // same book aren't attributed here. Needs the service role (cross-user read);
    // null if the key is unavailable.
    let resourcesDelivered: number | null = null;
    const admin = getAdminClient();
    if (admin) {
        const { count } = await admin
            .from('user_book_resource_access')
            .select('*', { count: 'exact', head: true })
            .eq('access_source', 'org_club')
            .eq('metadata->>organization_id', orgId);
        resourcesDelivered = count || 0;
    }

    return {
        totals: {
            activeClubs: activeClubs.length,
            readers,
            memberships: realMembers.length,
            posts: (postsRes.data || []).length,
            upcomingEvents: (eventsRes.data || []).length,
            resourcesDelivered,
        },
        perClub: activeClubs.map((c: any) => ({
            id: c.id,
            name: c.name,
            bookTitle: currentBookByClub.get(c.id)?.title ?? null,
            members: membersByClub.get(c.id) || 0,
            posts: postsByClub.get(c.id) || 0,
            nextEvent: nextEventByClub.get(c.id) ?? null,
        })),
    };
}

// --- Members across the organization's clubs --------------------------------

export interface OrganizationMember {
    userId: string;
    name: string;
    username: string | null;
    avatarUrl: string | null;
    clubs: { id: string; name: string }[];
}

export async function getOrganizationMembers(orgId: string): Promise<OrganizationMember[]> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data: membership } = await supabase
        .from('organization_members')
        .select('role')
        .eq('organization_id', orgId)
        .eq('user_id', user.id)
        .maybeSingle();
    if (!membership || !['owner', 'manager'].includes(membership.role)) return [];

    const { data: clubs } = await supabase
        .from('clubs')
        .select('id, name')
        .eq('organization_id', orgId);
    const clubIds = (clubs || []).map((c: any) => c.id);
    const clubNameById = new Map<string, string>((clubs || []).map((c: any) => [c.id, c.name]));
    if (clubIds.length === 0) return [];

    const { data: memberships } = await supabase
        .from('club_members')
        .select('user_id, club_id, role')
        .in('club_id', clubIds)
        .neq('role', 'pending');

    const byUser = new Map<string, { id: string; name: string }[]>();
    for (const m of memberships || []) {
        const list = byUser.get(m.user_id) || [];
        list.push({ id: m.club_id, name: clubNameById.get(m.club_id) || 'Club' });
        byUser.set(m.user_id, list);
    }

    const userIds = Array.from(byUser.keys());
    if (userIds.length === 0) return [];

    const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, username, avatar_url')
        .in('id', userIds);
    const profileById = new Map<string, any>((profiles || []).map((p: any) => [p.id, p]));

    return userIds.map((uid) => {
        const p = profileById.get(uid);
        return {
            userId: uid,
            name: p?.full_name || p?.username || 'Lector',
            username: p?.username ?? null,
            avatarUrl: p?.avatar_url ?? null,
            clubs: byUser.get(uid) || [],
        };
    }).sort((a, b) => b.clubs.length - a.clubs.length);
}

// --- Store agenda: organization events -------------------------------------

const EVENT_FIELDS = ['title', 'description', 'event_type', 'starts_at', 'ends_at', 'format', 'location', 'location_id', 'url', 'cover_url'] as const;

export async function getOrganizationEvents(orgId: string, opts: { upcomingOnly?: boolean } = {}): Promise<OrganizationEvent[]> {
    const supabase = await createClient();
    let query = supabase
        .from('organization_events')
        .select('*')
        .eq('organization_id', orgId)
        .order('starts_at', { ascending: true });

    if (opts.upcomingOnly) query = query.gte('starts_at', new Date().toISOString());

    const { data, error } = await query;
    if (error) {
        console.error('Error fetching organization events:', error);
        return [];
    }
    return data || [];
}

async function assertOrgManager(supabase: any, orgId: string, userId: string) {
    const { data: membership } = await supabase
        .from('organization_members')
        .select('role')
        .eq('organization_id', orgId)
        .eq('user_id', userId)
        .maybeSingle();
    if (!membership || !['owner', 'manager'].includes(membership.role)) {
        throw new Error('No tienes permiso para gestionar esta librería.');
    }
}

function pickEventFields(data: Record<string, any>) {
    const fields: Record<string, any> = {};
    for (const key of EVENT_FIELDS) {
        if (key in data) fields[key] = data[key] === '' ? null : data[key];
    }
    // title cannot be null
    if ('title' in fields && !fields.title) fields.title = 'Evento';
    return fields;
}

export async function createOrganizationEvent(orgId: string, data: Record<string, any>) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'No autenticado' };
    if (!data?.title?.trim()) return { error: 'El título es obligatorio.' };
    if (!data?.starts_at) return { error: 'La fecha del evento es obligatoria.' };

    try {
        await assertOrgManager(supabase, orgId, user.id);

        // Eventos ilimitados son Pro: el plan gratis tiene un tope de próximos.
        if (!(await orgIsPro(supabase, orgId))) {
            const { count } = await supabase
                .from('organization_events')
                .select('id', { count: 'exact', head: true })
                .eq('organization_id', orgId)
                .gte('starts_at', new Date().toISOString());
            if ((count || 0) >= FREE_UPCOMING_EVENT_LIMIT) {
                return { error: `El plan gratuito permite ${FREE_UPCOMING_EVENT_LIMIT} eventos próximos. Sube a Librería Pro para eventos ilimitados.` };
            }
        }

        const { error } = await supabase
            .from('organization_events')
            .insert({ ...pickEventFields(data), organization_id: orgId, created_by: user.id });
        if (error) return { error: error.message };
        revalidatePath('/app/librerias');
        revalidatePath('/librerias');
        return { success: true };
    } catch (e: any) {
        return { error: e.message };
    }
}

export async function updateOrganizationEvent(eventId: string, data: Record<string, any>) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'No autenticado' };
    if ('starts_at' in data && !data.starts_at) return { error: 'La fecha del evento es obligatoria.' };

    // RLS restricts UPDATE to owner/managers of the event's org. .select() lets
    // us detect a no-op (blocked/not found) and avoid a false "success".
    const { data: updated, error } = await supabase
        .from('organization_events')
        .update({ ...pickEventFields(data), updated_at: new Date().toISOString() })
        .eq('id', eventId)
        .select('id');
    if (error) return { error: error.message };
    if (!updated || updated.length === 0) return { error: 'No tienes permiso para editar este evento.' };
    revalidatePath('/app/librerias');
    revalidatePath('/librerias');
    return { success: true };
}

export async function deleteOrganizationEvent(eventId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'No autenticado' };

    const { data: deleted, error } = await supabase
        .from('organization_events')
        .delete()
        .eq('id', eventId)
        .select('id');
    if (error) return { error: error.message };
    if (!deleted || deleted.length === 0) return { error: 'No tienes permiso para eliminar este evento.' };
    revalidatePath('/app/librerias');
    revalidatePath('/librerias');
    return { success: true };
}

// --- Sedes (branches) -------------------------------------------------------

const LOCATION_FIELDS = ['name', 'address', 'city', 'region', 'country', 'phone', 'is_primary'] as const;

export async function getOrganizationLocations(orgId: string): Promise<OrganizationLocation[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('organization_locations')
        .select('*')
        .eq('organization_id', orgId)
        .order('is_primary', { ascending: false })
        .order('created_at', { ascending: true });
    if (error) {
        console.error('Error fetching organization locations:', error);
        return [];
    }
    return data || [];
}

function pickLocationFields(data: Record<string, any>) {
    const fields: Record<string, any> = {};
    for (const key of LOCATION_FIELDS) {
        if (key in data) fields[key] = key === 'is_primary' ? !!data[key] : (data[key] === '' ? null : data[key]);
    }
    return fields;
}

// Ensure a single primary sede per organization.
async function demoteOtherPrimaries(supabase: any, orgId: string, exceptId: string) {
    await supabase
        .from('organization_locations')
        .update({ is_primary: false })
        .eq('organization_id', orgId)
        .eq('is_primary', true)
        .neq('id', exceptId);
}

export async function createLocation(orgId: string, data: Record<string, any>) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'No autenticado' };
    if (!data?.name?.trim()) return { error: 'El nombre de la sede es obligatorio.' };
    try {
        await assertOrgManager(supabase, orgId, user.id);

        // The first sede is primary by default; otherwise honor the checkbox.
        const { count } = await supabase
            .from('organization_locations')
            .select('id', { count: 'exact', head: true })
            .eq('organization_id', orgId);
        const isPrimary = !!data.is_primary || (count || 0) === 0;

        // Multisede es Pro: el plan gratis permite 1 sede.
        if ((count || 0) >= FREE_LOCATION_LIMIT && !(await orgIsPro(supabase, orgId))) {
            return { error: `El plan gratuito permite ${FREE_LOCATION_LIMIT} sede. Sube a Librería Pro para añadir más.` };
        }

        const { data: created, error } = await supabase
            .from('organization_locations')
            .insert({ ...pickLocationFields(data), name: data.name, is_primary: isPrimary, organization_id: orgId })
            .select('id')
            .single();
        if (error) return { error: error.message };

        if (isPrimary && created?.id) await demoteOtherPrimaries(supabase, orgId, created.id);

        revalidatePath('/app/librerias');
        revalidatePath('/librerias');
        return { success: true };
    } catch (e: any) {
        return { error: e.message };
    }
}

export async function updateLocation(locationId: string, data: Record<string, any>) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'No autenticado' };

    // RLS restricts UPDATE to owner/managers of the location's org.
    const { data: updated, error } = await supabase
        .from('organization_locations')
        .update({ ...pickLocationFields(data), updated_at: new Date().toISOString() })
        .eq('id', locationId)
        .select('id, organization_id');
    if (error) return { error: error.message };
    if (!updated || updated.length === 0) return { error: 'No tienes permiso para editar esta sede.' };

    // Keep a single primary sede.
    if (data.is_primary) await demoteOtherPrimaries(supabase, updated[0].organization_id, locationId);

    revalidatePath('/app/librerias');
    revalidatePath('/librerias');
    return { success: true };
}

export async function deleteLocation(locationId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'No autenticado' };

    const { data: deleted, error } = await supabase
        .from('organization_locations')
        .delete()
        .eq('id', locationId)
        .select('id');
    if (error) return { error: error.message };
    if (!deleted || deleted.length === 0) return { error: 'No tienes permiso para eliminar esta sede.' };
    revalidatePath('/app/librerias');
    revalidatePath('/librerias');
    return { success: true };
}
