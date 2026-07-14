// Server-only. Applies the effect of a captured order (activate Pro, set the
// user's plan, grant a resource…). Idempotent: safe to call from both the
// capture endpoint and the webhook, and safe to retry.
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

function admin() {
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!key) throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY');
    return createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key);
}

// Extend from the later of (now, existing end) so re-paying while still active
// adds time instead of resetting it.
function extendPeriod(existingEndIso: string | null, period: 'monthly' | 'annual' | null): string | null {
    if (!period) return null;
    const now = new Date();
    const existing = existingEndIso ? new Date(existingEndIso) : null;
    const base = existing && existing > now ? existing : now;
    if (period === 'annual') base.setFullYear(base.getFullYear() + 1);
    else base.setMonth(base.getMonth() + 1);
    return base.toISOString();
}

export async function fulfillOrder(providerOrderId: string, captureId?: string | null): Promise<void> {
    const supabase = admin();

    const { data: order } = await supabase
        .from('orders')
        .select('*')
        .eq('provider_order_id', providerOrderId)
        .maybeSingle();

    if (!order) {
        console.error('fulfillOrder: order not found for', providerOrderId);
        return;
    }
    if (order.fulfilled_at) return; // fast path

    // Atomic claim: only the first caller (capture endpoint OR webhook) proceeds.
    // Guarantees fulfillment (incl. the non-idempotent period extension) runs once.
    const claimTime = new Date().toISOString();
    const { data: claimed } = await supabase
        .from('orders')
        .update({
            fulfilled_at: claimTime,
            status: 'captured',
            provider_capture_id: captureId ?? order.provider_capture_id,
            updated_at: claimTime,
        })
        .eq('id', order.id)
        .is('fulfilled_at', null)
        .select('id');
    if (!claimed || claimed.length === 0) return; // lost the race, already fulfilled

    try {
        switch (order.product_type) {
            case 'org_subscription': {
                const { data: existing } = await supabase
                    .from('organization_subscriptions')
                    .select('current_period_end')
                    .eq('organization_id', order.reference_id)
                    .maybeSingle();
                await supabase.from('organization_subscriptions').upsert({
                    organization_id: order.reference_id,
                    tier: 'pro',
                    status: 'active',
                    billing_period: order.plan_period,
                    current_period_end: extendPeriod(existing?.current_period_end ?? null, order.plan_period),
                    external_ref: order.id,
                    updated_at: new Date().toISOString(),
                }, { onConflict: 'organization_id' });
                break;
            }

            case 'user_plan': {
                const { data: existing } = await supabase
                    .from('user_subscriptions')
                    .select('current_period_end')
                    .eq('user_id', order.user_id)
                    .maybeSingle();
                await supabase.from('user_subscriptions').upsert({
                    user_id: order.user_id,
                    plan: order.reference_id,
                    status: 'active',
                    period: order.plan_period,
                    current_period_end: extendPeriod(existing?.current_period_end ?? null, order.plan_period),
                    external_ref: order.id,
                    updated_at: new Date().toISOString(),
                }, { onConflict: 'user_id' });
                break;
            }

            case 'resource': {
                if (!order.resource_kind) {
                    console.error('fulfillOrder: resource order without resource_kind', order.id);
                    return;
                }
                await supabase.from('user_book_resource_access').upsert({
                    user_id: order.user_id,
                    book_id: order.reference_id,
                    resource_kind: order.resource_kind,
                    access_source: 'purchase',
                    purchased_at: new Date().toISOString(),
                }, { onConflict: 'user_id,book_id,resource_kind', ignoreDuplicates: true });
                break;
            }

            default:
                console.error('fulfillOrder: unsupported product_type', order.product_type);
        }
    } catch (e) {
        // The order is already marked fulfilled to keep idempotency; log so a
        // failed dispatch can be repaired manually.
        console.error('fulfillOrder: dispatch failed for order', order.id, e);
    }
}
