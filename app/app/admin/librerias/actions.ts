'use server';

import { createClient } from '@/utils/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';
import type { OrganizationTier } from '@/types/organizations';
import { fetchLibrariesList, type LibraryListRow, type LibraryFilter } from './data';

// Gestión de librerías (tenants + plan + verificación) = solo admin.
async function requireAdmin(): Promise<string> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No autenticado');
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (profile?.role !== 'admin') throw new Error('No autorizado');
    return user.id;
}

function adminClient() {
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!key) throw new Error('Falta SUPABASE_SERVICE_ROLE_KEY en el servidor.');
    return createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key) as unknown as {
        from: (t: string) => any;
    };
}

type Result = { success: true } | { error: string };

export async function searchLibrariesAction(
    query: string,
    filter: LibraryFilter,
): Promise<{ libraries?: LibraryListRow[]; error?: string }> {
    try {
        await requireAdmin();
        const libraries = await fetchLibrariesList(query, filter);
        return { libraries };
    } catch (e) {
        console.error('searchLibrariesAction:', e);
        return { error: 'No se pudo cargar el directorio.' };
    }
}

export type LibraryProfileInput = {
    name: string;
    description: string | null;
    website: string | null;
    contact_email: string | null;
    phone: string | null;
    address: string | null;
    city: string | null;
    region: string | null;
    country: string | null;
    brand_color: string | null;
    buy_link_template: string | null;
};

export async function updateLibraryProfileAction(orgId: string, input: LibraryProfileInput): Promise<Result> {
    try {
        await requireAdmin();
        const name = input.name?.trim();
        if (!name) return { error: 'El nombre no puede estar vacío.' };

        const { error } = await adminClient()
            .from('organizations')
            .update({
                name,
                description: input.description?.trim() || null,
                website: input.website?.trim() || null,
                contact_email: input.contact_email?.trim() || null,
                phone: input.phone?.trim() || null,
                address: input.address?.trim() || null,
                city: input.city?.trim() || null,
                region: input.region?.trim() || null,
                country: input.country?.trim() || null,
                brand_color: input.brand_color?.trim() || null,
                buy_link_template: input.buy_link_template?.trim() || null,
                updated_at: new Date().toISOString(),
            })
            .eq('id', orgId);
        if (error) throw error;

        revalidatePath(`/app/admin/librerias/${orgId}`);
        revalidatePath('/app/admin/librerias');
        return { success: true };
    } catch (e: any) {
        console.error('updateLibraryProfileAction:', e);
        return { error: e?.message || 'No se pudo guardar.' };
    }
}

export async function setLibraryActiveAction(orgId: string, active: boolean): Promise<Result> {
    try {
        await requireAdmin();
        const { error } = await adminClient()
            .from('organizations')
            .update({ is_active: active, updated_at: new Date().toISOString() })
            .eq('id', orgId);
        if (error) throw error;
        revalidatePath(`/app/admin/librerias/${orgId}`);
        revalidatePath('/app/admin/librerias');
        return { success: true };
    } catch (e: any) {
        console.error('setLibraryActiveAction:', e);
        return { error: e?.message || 'No se pudo actualizar.' };
    }
}

export async function setLibraryVerifiedAction(orgId: string, verified: boolean): Promise<Result> {
    try {
        await requireAdmin();
        const { error } = await adminClient()
            .from('organizations')
            .update({ verified, updated_at: new Date().toISOString() })
            .eq('id', orgId);
        if (error) throw error;
        revalidatePath(`/app/admin/librerias/${orgId}`);
        revalidatePath('/app/admin/librerias');
        return { success: true };
    } catch (e: any) {
        console.error('setLibraryVerifiedAction:', e);
        return { error: e?.message || 'No se pudo actualizar.' };
    }
}

export async function updateLibraryNotesAction(orgId: string, notes: string): Promise<Result> {
    try {
        await requireAdmin();
        const { error } = await adminClient()
            .from('organizations')
            .update({ admin_notes: notes.trim() || null, updated_at: new Date().toISOString() })
            .eq('id', orgId);
        if (error) throw error;
        revalidatePath(`/app/admin/librerias/${orgId}`);
        return { success: true };
    } catch (e: any) {
        console.error('updateLibraryNotesAction:', e);
        return { error: e?.message || 'No se pudo guardar la nota.' };
    }
}

/** Activa/desactiva el plan Pro de una librería (quick toggle del directorio). */
export async function setOrganizationTier(orgId: string, tier: OrganizationTier): Promise<Result> {
    try {
        await requireAdmin();
        const { error } = await adminClient()
            .from('organization_subscriptions')
            .upsert({ organization_id: orgId, tier, status: 'active' }, { onConflict: 'organization_id' });
        if (error) throw error;
        revalidatePath(`/app/admin/librerias/${orgId}`);
        revalidatePath('/app/admin/librerias');
        return { success: true };
    } catch (e: any) {
        console.error('setOrganizationTier:', e);
        return { error: e?.message || 'No se pudo cambiar el plan.' };
    }
}

/**
 * Concede Pro manual (comp/cortesía) a una librería. `months` null = indefinido.
 * Preserva el enlace con PayPal si existe (no lo cancela: hay que hacerlo aparte).
 */
export async function grantOrgProAction(orgId: string, months: number | null): Promise<Result> {
    try {
        const adminId = await requireAdmin();
        const admin = adminClient();
        const now = new Date();

        let currentPeriodEnd: string | null = null;
        let billingPeriod: string | null = null;
        if (months && months > 0) {
            const end = new Date(now);
            end.setMonth(end.getMonth() + months);
            currentPeriodEnd = end.toISOString();
            billingPeriod = months >= 12 ? 'annual' : 'monthly';
        }

        const { data: existing } = await admin
            .from('organization_subscriptions')
            .select('provider_subscription_id')
            .eq('organization_id', orgId)
            .maybeSingle();

        const patch: Record<string, unknown> = {
            tier: 'pro',
            status: 'active',
            billing_period: billingPeriod,
            current_period_end: currentPeriodEnd,
            external_ref: `admin:${adminId}`,
            updated_at: now.toISOString(),
        };

        if (existing) {
            if (!existing.provider_subscription_id) patch.provider = 'manual';
            const { error } = await admin.from('organization_subscriptions').update(patch).eq('organization_id', orgId);
            if (error) throw error;
        } else {
            const { error } = await admin.from('organization_subscriptions').insert({
                organization_id: orgId,
                provider: 'manual',
                started_at: now.toISOString(),
                ...patch,
            });
            if (error) throw error;
        }

        revalidatePath(`/app/admin/librerias/${orgId}`);
        revalidatePath('/app/admin/librerias');
        return { success: true };
    } catch (e: any) {
        console.error('grantOrgProAction:', e);
        return { error: e?.message || 'No se pudo conceder Pro.' };
    }
}

// ---------------------------------------------------------------------------
// Propietario y equipo (organization_members)
// ---------------------------------------------------------------------------

async function setMembership(admin: ReturnType<typeof adminClient>, orgId: string, userId: string, role: string) {
    const { data: existing } = await admin
        .from('organization_members')
        .select('id')
        .eq('organization_id', orgId)
        .eq('user_id', userId)
        .maybeSingle();
    if (existing) {
        const { error } = await admin.from('organization_members').update({ role }).eq('id', existing.id);
        if (error) throw error;
    } else {
        const { error } = await admin.from('organization_members').insert({ organization_id: orgId, user_id: userId, role });
        if (error) throw error;
    }
}

const TEAM_ROLES = ['manager', 'staff'] as const;

export async function addOrgMemberAction(orgId: string, email: string, role: string): Promise<Result> {
    try {
        await requireAdmin();
        if (!(TEAM_ROLES as readonly string[]).includes(role)) return { error: 'Rol no válido.' };
        const clean = email.trim();
        if (!clean) return { error: 'Introduce un email.' };

        const admin = adminClient();
        const { data: profile } = await admin.from('profiles').select('id').ilike('email', clean).maybeSingle();
        if (!profile) return { error: 'No hay ningún usuario registrado con ese email.' };

        await setMembership(admin, orgId, profile.id, role);
        revalidatePath(`/app/admin/librerias/${orgId}`);
        return { success: true };
    } catch (e: any) {
        console.error('addOrgMemberAction:', e);
        return { error: e?.message || 'No se pudo añadir el miembro.' };
    }
}

export async function setOrgMemberRoleAction(orgId: string, userId: string, role: string): Promise<Result> {
    try {
        await requireAdmin();
        if (!(TEAM_ROLES as readonly string[]).includes(role)) return { error: 'Rol no válido.' };

        const admin = adminClient();
        const { data: org } = await admin.from('organizations').select('owner_id').eq('id', orgId).maybeSingle();
        if (org?.owner_id === userId) return { error: 'El propietario se cambia con "Transferir propiedad".' };

        await setMembership(admin, orgId, userId, role);
        revalidatePath(`/app/admin/librerias/${orgId}`);
        return { success: true };
    } catch (e: any) {
        console.error('setOrgMemberRoleAction:', e);
        return { error: e?.message || 'No se pudo cambiar el rol.' };
    }
}

export async function removeOrgMemberAction(orgId: string, userId: string): Promise<Result> {
    try {
        await requireAdmin();
        const admin = adminClient();
        const { data: org } = await admin.from('organizations').select('owner_id').eq('id', orgId).maybeSingle();
        if (org?.owner_id === userId) return { error: 'No puedes quitar al propietario. Transfiere la propiedad primero.' };

        const { error } = await admin
            .from('organization_members')
            .delete()
            .eq('organization_id', orgId)
            .eq('user_id', userId);
        if (error) throw error;
        revalidatePath(`/app/admin/librerias/${orgId}`);
        return { success: true };
    } catch (e: any) {
        console.error('removeOrgMemberAction:', e);
        return { error: e?.message || 'No se pudo quitar el miembro.' };
    }
}

/** Transfiere la propiedad: nuevo owner_id + rol owner; el anterior baja a manager. */
export async function transferOwnershipAction(orgId: string, newUserId: string): Promise<Result> {
    try {
        await requireAdmin();
        const admin = adminClient();

        const { data: profile } = await admin.from('profiles').select('id').eq('id', newUserId).maybeSingle();
        if (!profile) return { error: 'El usuario no existe.' };

        const { data: org } = await admin.from('organizations').select('owner_id').eq('id', orgId).maybeSingle();
        const oldOwner: string | null = org?.owner_id ?? null;

        const { error } = await admin
            .from('organizations')
            .update({ owner_id: newUserId, updated_at: new Date().toISOString() })
            .eq('id', orgId);
        if (error) throw error;

        await setMembership(admin, orgId, newUserId, 'owner');
        if (oldOwner && oldOwner !== newUserId) await setMembership(admin, orgId, oldOwner, 'manager');

        revalidatePath(`/app/admin/librerias/${orgId}`);
        revalidatePath('/app/admin/librerias');
        return { success: true };
    } catch (e: any) {
        console.error('transferOwnershipAction:', e);
        return { error: e?.message || 'No se pudo transferir la propiedad.' };
    }
}

// ---------------------------------------------------------------------------
// Clubs alojados
// ---------------------------------------------------------------------------

export async function setClubArchivedAction(orgId: string, clubId: string, archived: boolean): Promise<Result> {
    try {
        await requireAdmin();
        const { error } = await adminClient()
            .from('clubs')
            .update({ is_archived: archived })
            .eq('id', clubId)
            .eq('organization_id', orgId);
        if (error) throw error;
        revalidatePath(`/app/admin/librerias/${orgId}`);
        return { success: true };
    } catch (e: any) {
        console.error('setClubArchivedAction:', e);
        return { error: e?.message || 'No se pudo actualizar el club.' };
    }
}

/** Desvincula un club de la librería (organization_id = null). El club sigue existiendo. */
export async function unlinkClubAction(orgId: string, clubId: string): Promise<Result> {
    try {
        await requireAdmin();
        const { error } = await adminClient()
            .from('clubs')
            .update({ organization_id: null })
            .eq('id', clubId)
            .eq('organization_id', orgId);
        if (error) throw error;
        revalidatePath(`/app/admin/librerias/${orgId}`);
        revalidatePath('/app/admin/librerias');
        return { success: true };
    } catch (e: any) {
        console.error('unlinkClubAction:', e);
        return { error: e?.message || 'No se pudo desvincular el club.' };
    }
}

/** Baja la librería a Free de inmediato (status expired). No cancela PayPal. */
export async function revokeOrgProAction(orgId: string): Promise<Result> {
    try {
        await requireAdmin();
        const { error } = await adminClient()
            .from('organization_subscriptions')
            .update({ tier: 'free', status: 'expired', updated_at: new Date().toISOString() })
            .eq('organization_id', orgId);
        if (error) throw error;
        revalidatePath(`/app/admin/librerias/${orgId}`);
        revalidatePath('/app/admin/librerias');
        return { success: true };
    } catch (e: any) {
        console.error('revokeOrgProAction:', e);
        return { error: e?.message || 'No se pudo bajar a Free.' };
    }
}
