'use server';

import { createClient } from '@/utils/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';
import type { Organization, OrganizationTier } from '@/types/organizations';

async function assertAdmin() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No autenticado');
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (!profile || (profile.role !== 'admin' && profile.role !== 'editor')) throw new Error('No autorizado');
    return supabase;
}

function getAdminClient() {
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceRoleKey) return null;
    return createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceRoleKey);
}

export async function adminListOrganizations(): Promise<Organization[]> {
    const supabase = await assertAdmin();
    const { data, error } = await supabase
        .from('organizations')
        .select('*, subscription:organization_subscriptions(*)')
        .order('created_at', { ascending: false });
    if (error) {
        console.error('adminListOrganizations error:', error);
        return [];
    }
    return (data || []).map((o: any) => ({
        ...o,
        subscription: Array.isArray(o.subscription) ? o.subscription[0] ?? null : o.subscription,
    }));
}

export async function setOrganizationTier(orgId: string, tier: OrganizationTier) {
    await assertAdmin();
    const admin = getAdminClient();
    if (!admin) return { error: 'Falta SUPABASE_SERVICE_ROLE_KEY en el servidor.' };

    const { error } = await admin
        .from('organization_subscriptions')
        .upsert({ organization_id: orgId, tier, status: 'active' }, { onConflict: 'organization_id' });

    if (error) {
        console.error('setOrganizationTier error:', error);
        return { error: error.message };
    }

    revalidatePath('/app/admin/librerias');
    return { success: true };
}
