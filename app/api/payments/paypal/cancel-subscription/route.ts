import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { cancelSubscription } from "@/lib/paypal";

export const dynamic = "force-dynamic";

// Cancel a subscription. The real status change is applied by the
// BILLING.SUBSCRIPTION.CANCELLED webhook, not here.
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
    const reason = String(body?.reason ?? "Cancelada por el usuario").slice(0, 127);
    if (!subscriptionId) return NextResponse.json({ error: "missing_subscription" }, { status: 400 });

    const { data: order } = await supabase
        .from("orders")
        .select("user_id, product_type, reference_id")
        .eq("provider_order_id", subscriptionId)
        .maybeSingle();
    if (!order) return NextResponse.json({ error: "not_found" }, { status: 404 });

    // A user cancels their own plan; an org sub can be cancelled by any owner/manager.
    let allowed = order.product_type === "user_plan" && order.user_id === user.id;
    if (order.product_type === "org_subscription") {
        const { data: membership } = await supabase
            .from("organization_members")
            .select("role")
            .eq("organization_id", order.reference_id)
            .eq("user_id", user.id)
            .maybeSingle();
        allowed = !!membership && ["owner", "manager"].includes(membership.role);
    }
    if (!allowed) return NextResponse.json({ error: "forbidden" }, { status: 403 });

    try {
        await cancelSubscription(subscriptionId, reason);
        return NextResponse.json({ ok: true });
    } catch (e: any) {
        console.error("cancel-subscription error:", e);
        return NextResponse.json({ error: e.message || "paypal_error" }, { status: 500 });
    }
}
