import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { reviseSubscription } from "@/lib/paypal";
import { resolvePlanId } from "@/lib/paypal-plans";
import type { BillingPeriod } from "@/lib/pricing";

export const dynamic = "force-dynamic";

function appOrigin() {
    return process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}

// Change the plan of an existing subscription (upgrade/downgrade). Returns an
// approveUrl when PayPal needs the buyer to confirm (typically upgrades). The
// resulting plan/period is applied by the BILLING.SUBSCRIPTION.UPDATED webhook.
export async function POST(request: NextRequest) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

    let body: any;
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: "invalid_body" }, { status: 400 });
    }

    const subscriptionId = String(body?.subscriptionId ?? "");
    // New plan target: referenceId = plan code (user) | org id (org); period = new cycle.
    const referenceId = String(body?.referenceId ?? "");
    const period = (body?.period ?? null) as BillingPeriod | null;
    if (!subscriptionId || !referenceId) return NextResponse.json({ error: "invalid_request" }, { status: 400 });
    if (period !== "monthly" && period !== "annual") {
        return NextResponse.json({ error: "invalid_period" }, { status: 400 });
    }

    const { data: order } = await supabase
        .from("orders")
        .select("id, user_id, product_type, reference_id")
        .eq("provider_order_id", subscriptionId)
        .maybeSingle();
    if (!order) return NextResponse.json({ error: "not_found" }, { status: 404 });

    // Same authorization rules as cancel.
    let allowed = order.product_type === "user_plan" && order.user_id === user.id;
    if (order.product_type === "org_subscription") {
        // The plan target for an org is always its own Pro plan; can't retarget another org.
        if (referenceId !== order.reference_id) return NextResponse.json({ error: "invalid_request" }, { status: 400 });
        const { data: membership } = await supabase
            .from("organization_members")
            .select("role")
            .eq("organization_id", order.reference_id)
            .eq("user_id", user.id)
            .maybeSingle();
        allowed = !!membership && ["owner", "manager"].includes(membership.role);
    }
    if (!allowed) return NextResponse.json({ error: "forbidden" }, { status: 403 });

    const newPlanId = resolvePlanId({ productType: order.product_type, referenceId, period });
    if (!newPlanId) return NextResponse.json({ error: "no_plan" }, { status: 400 });

    try {
        const origin = appOrigin();
        const result = await reviseSubscription(
            subscriptionId,
            newPlanId,
            `${origin}/app`,
            `${origin}/planes`,
        );

        // Keep the tracking row consistent with the new target (fulfillment still
        // treats the subscription's live plan_id as authoritative).
        await supabase
            .from("orders")
            .update({ reference_id: referenceId, plan_period: period, updated_at: new Date().toISOString() })
            .eq("id", order.id);

        return NextResponse.json({ ok: true, approveUrl: result.approveUrl });
    } catch (e: any) {
        console.error("revise-subscription error:", e);
        return NextResponse.json({ error: e.message || "paypal_error" }, { status: 500 });
    }
}
