// Server-only. Applies the effect of a captured order (activate Pro, set the
// user's plan, grant a resource…). Idempotent: safe to call from both the
// capture endpoint and the webhook, and safe to retry.
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { getSubscription } from './paypal';
import { planMetaFromId } from './paypal-plans';
import { PLANS } from './plans';
import { grantOfficialClubResourcesToUser } from './club-resource-grants';

export function admin() {
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

            case 'club': {
                // Descuento parcial: las monedas ya se reservaron (debitaron) al crear
                // la orden; aquí solo damos por gastadas y damos membresía.
                const meta = (order.metadata ?? {}) as { applied_coins?: number; total_price_cents?: number };
                const appliedCoins = Number(meta.applied_coins ?? 0);
                const totalCents = Number(meta.total_price_cents ?? order.amount_cents);
                const joinSource = appliedCoins > 0 ? 'paypal_coins' : 'paypal';

                // Alta como miembro. Idempotente: club_members no tiene unique
                // garantizado, así que comprobamos primero.
                const { data: existing } = await supabase
                    .from('club_members')
                    .select('id, role')
                    .eq('club_id', order.reference_id)
                    .eq('user_id', order.user_id)
                    .maybeSingle();
                if (!existing) {
                    await supabase.from('club_members').insert({
                        club_id: order.reference_id,
                        user_id: order.user_id,
                        role: 'member',
                        join_source: joinSource,
                        price_paid_cents: totalCents,
                    });
                } else if (existing.role === 'pending') {
                    await supabase.from('club_members').update({
                        role: 'member',
                        join_source: joinSource,
                        price_paid_cents: totalCents,
                    }).eq('id', existing.id);
                }
                // Recursos del club oficial (guía + genoma perpetuos).
                await grantOfficialClubResourcesToUser(order.reference_id, order.user_id);
                // Monedas Wordelia: cualifica un referido pendiente (1er club).
                // Variante _for porque aquí auth.uid() es null (service role).
                await supabase.rpc('qualify_referral_for', { p_user: order.user_id });
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

// --- Subscriptions (recurring) ---------------------------------------------

// PayPal subscription status → local status. APPROVAL_PENDING has no local
// equivalent (nothing granted yet) and is intentionally absent.
const SUB_STATUS_MAP: Record<string, string> = {
    ACTIVE: 'active',
    APPROVED: 'active',
    SUSPENDED: 'paused',
    CANCELLED: 'cancelled',
    EXPIRED: 'expired',
};

/**
 * Sync a subscription's state into the right target table. Idempotent (upsert),
 * so it's safe from both the activate endpoint and every webhook event. `resource`
 * is the subscription object when the event already carries it (BILLING.SUBSCRIPTION.*);
 * for renewal payments (PAYMENT.SALE.COMPLETED) it's omitted and re-fetched so we
 * read the fresh next_billing_time.
 */
export async function fulfillSubscription(subscriptionId: string, resource?: any): Promise<void> {
    const supabase = admin();

    // The pre-activation order row (written by create-subscription) maps the
    // subscription to its owner + product.
    const { data: order } = await supabase
        .from('orders')
        .select('*')
        .eq('provider_order_id', subscriptionId)
        .maybeSingle();
    if (!order) {
        console.error('fulfillSubscription: no order for subscription', subscriptionId);
        return;
    }

    const sub = resource ?? (await getSubscription(subscriptionId));
    const paypalStatus = sub?.status as string | undefined;
    const localStatus = paypalStatus ? SUB_STATUS_MAP[paypalStatus] : undefined;
    if (!localStatus) {
        console.error('fulfillSubscription: unmapped/pending status', paypalStatus, subscriptionId);
        return;
    }

    // plan_id is authoritative for plan/period (survives upgrades/downgrades);
    // fall back to the order's original values if the id isn't recognised.
    const planId = sub?.plan_id as string | undefined;
    const meta = planId ? planMetaFromId(planId) : null;
    const nextBilling = sub?.billing_info?.next_billing_time as string | undefined;
    const now = new Date().toISOString();

    // Keep the tracking order row reflecting reality (it only ever held 'created').
    const orderStatus = localStatus === 'active' ? 'captured'
        : (localStatus === 'cancelled' || localStatus === 'expired') ? 'cancelled'
        : null;
    if (orderStatus) {
        await supabase.from('orders').update({
            status: orderStatus,
            fulfilled_at: order.fulfilled_at ?? now,
            updated_at: now,
        }).eq('id', order.id);
    }

    if (order.product_type === 'user_plan') {
        const { data: existing } = await supabase
            .from('user_subscriptions')
            .select('current_period_end')
            .eq('user_id', order.user_id)
            .maybeSingle();
        await supabase.from('user_subscriptions').upsert({
            user_id: order.user_id,
            plan: meta?.planCode ?? order.reference_id,
            status: localStatus,
            period: meta?.period ?? order.plan_period,
            // Keep the paid-through date on cancel/suspend (PayPal drops next_billing_time).
            current_period_end: nextBilling ?? existing?.current_period_end ?? null,
            provider: 'paypal',
            provider_subscription_id: subscriptionId,
            provider_plan_id: planId ?? null,
            external_ref: order.id,
            updated_at: now,
        }, { onConflict: 'user_id' });
    } else if (order.product_type === 'org_subscription') {
        const { data: existing } = await supabase
            .from('organization_subscriptions')
            .select('current_period_end')
            .eq('organization_id', order.reference_id)
            .maybeSingle();
        await supabase.from('organization_subscriptions').upsert({
            organization_id: order.reference_id,
            // Drop to free only once fully expired; a cancelled sub keeps Pro
            // until its paid period ends (the access gate checks the date).
            tier: localStatus === 'expired' ? 'free' : 'pro',
            status: localStatus,
            billing_period: meta?.period ?? order.plan_period,
            current_period_end: nextBilling ?? existing?.current_period_end ?? null,
            provider: 'paypal',
            provider_subscription_id: subscriptionId,
            provider_plan_id: planId ?? null,
            external_ref: order.id,
            updated_at: now,
        }, { onConflict: 'organization_id' });
    } else {
        console.error('fulfillSubscription: unexpected product_type', order.product_type);
    }
}

/**
 * Set only the status of the subscription's local row (used for
 * PAYMENT.FAILED → past_due, where PayPal keeps the subscription ACTIVE while
 * it retries so fulfillSubscription alone wouldn't flag it).
 */
export async function markSubscriptionStatus(subscriptionId: string, status: string): Promise<void> {
    const supabase = admin();
    const patch = { status, updated_at: new Date().toISOString() };
    const { data: u } = await supabase
        .from('user_subscriptions')
        .update(patch)
        .eq('provider_subscription_id', subscriptionId)
        .select('id');
    if (u && u.length) return;
    await supabase
        .from('organization_subscriptions')
        .update(patch)
        .eq('provider_subscription_id', subscriptionId)
        .select('id');
}

function userPlanLabel(code: string): string {
    return PLANS.find((p) => p.id === code)?.name ?? code;
}

export interface SubscriptionContext {
    email: string | null;
    productType: string;
    planLabel: string;
    currentPeriodEnd: string | null;
}

/**
 * Resolve who/what a subscription belongs to, for emails. `sub` is the PayPal
 * subscription object when available (to read the live plan for the label).
 */
export async function getSubscriptionContext(subscriptionId: string, sub?: any): Promise<SubscriptionContext | null> {
    const supabase = admin();
    const { data: order } = await supabase
        .from('orders')
        .select('user_id, product_type, reference_id')
        .eq('provider_order_id', subscriptionId)
        .maybeSingle();
    if (!order) return null;

    let email: string | null = null;
    if (order.user_id) {
        const { data } = await supabase.auth.admin.getUserById(order.user_id);
        email = data?.user?.email ?? null;
    }

    let planLabel = 'tu plan';
    let currentPeriodEnd: string | null = null;
    if (order.product_type === 'org_subscription') {
        planLabel = 'Librería Pro';
        const { data: row } = await supabase
            .from('organization_subscriptions')
            .select('current_period_end')
            .eq('provider_subscription_id', subscriptionId)
            .maybeSingle();
        currentPeriodEnd = row?.current_period_end ?? null;
    } else {
        const meta = sub?.plan_id ? planMetaFromId(sub.plan_id) : null;
        planLabel = userPlanLabel(meta?.planCode ?? order.reference_id);
        const { data: row } = await supabase
            .from('user_subscriptions')
            .select('current_period_end')
            .eq('provider_subscription_id', subscriptionId)
            .maybeSingle();
        currentPeriodEnd = row?.current_period_end ?? null;
    }

    return { email, productType: order.product_type, planLabel, currentPeriodEnd };
}

/**
 * Record a subscription charge (initial or renewal) from a PAYMENT.SALE.COMPLETED
 * sale resource. Idempotent via the unique provider_payment_id (PayPal sale id).
 */
export async function recordSubscriptionPayment(subscriptionId: string, sale: any): Promise<{ amountCents: number; currency: string } | null> {
    const supabase = admin();
    const { data: order } = await supabase
        .from('orders')
        .select('user_id, product_type, reference_id')
        .eq('provider_order_id', subscriptionId)
        .maybeSingle();

    const total = sale?.amount?.total as string | undefined;
    const currency = (sale?.amount?.currency as string | undefined) ?? 'EUR';
    const amountCents = total ? Math.round(parseFloat(total) * 100) : 0;

    await supabase.from('subscription_payments').upsert({
        user_id: order?.user_id ?? null,
        provider: 'paypal',
        provider_subscription_id: subscriptionId,
        provider_payment_id: sale?.id ?? null,
        product_type: order?.product_type ?? null,
        reference_id: order?.reference_id ?? null,
        amount_cents: amountCents,
        currency,
        status: 'completed',
    }, { onConflict: 'provider_payment_id', ignoreDuplicates: true });

    return { amountCents, currency };
}
