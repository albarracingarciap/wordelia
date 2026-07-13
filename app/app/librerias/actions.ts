'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { Organization } from '@/types/organizations';

function generateSlug(name: string) {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
        + '-' + Math.random().toString(36).substring(2, 8);
}

const EDITABLE_FIELDS = [
    'name', 'description', 'logo_url', 'cover_url', 'website',
    'contact_email', 'phone', 'address', 'city', 'region', 'country',
] as const;

/**
 * Self-serve creation of a bookstore ("librería"). The creator becomes owner
 * and the org starts on the free tier. Pro is activated later by an admin.
 */
export async function createOrganization(data: any) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Debes iniciar sesión para registrar una librería.' };

    const name = (data?.name || '').trim();
    if (!name) return { error: 'El nombre de la librería es obligatorio.' };

    // One librería per owner in the MVP.
    const { data: existing } = await supabase
        .from('organizations')
        .select('id, slug')
        .eq('owner_id', user.id)
        .limit(1)
        .maybeSingle();
    if (existing) return { error: 'Ya tienes una librería registrada.', organizationId: existing.id, slug: existing.slug };

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

export async function updateOrganization(orgId: string, fields: Record<string, any>) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'No autenticado' };

    const updates: Record<string, any> = { updated_at: new Date().toISOString() };
    for (const key of EDITABLE_FIELDS) {
        if (key in fields) updates[key] = fields[key];
    }

    // RLS already restricts UPDATE to owner/managers; the filter is a guard.
    const { error } = await supabase
        .from('organizations')
        .update(updates)
        .eq('id', orgId);

    if (error) {
        console.error('Error updating organization:', error);
        return { error: error.message };
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

    return Promise.all((data || []).map(async (club: any) => {
        const { count } = await supabase
            .from('club_members')
            .select('*', { count: 'exact', head: true })
            .eq('club_id', club.id);

        const currentBook = Array.isArray(club.current_book)
            ? club.current_book.find((b: any) => b.status === 'current')
            : null;

        return {
            ...club,
            memberCount: count || 0,
            currentBook: currentBook && currentBook.book ? {
                title: currentBook.book.title,
                author: currentBook.book.author?.name || 'Autor desconocido',
                coverUrl: currentBook.book.cover_url,
            } : null,
        };
    }));
}
