import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { getSubscription } from "@/lib/paypal";
import { fulfillSubscription } from "@/lib/fulfillment";

export const dynamic = "force-dynamic";

// Called after the buyer approves the subscription in the popup. Reads the
// subscription from PayPal and applies it. Fulfillment is idempotent; the
// BILLING.SUBSCRIPTION.ACTIVATED webhook is a backup for this same call.
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
    if (!subscriptionId) return NextResponse.json({ error: "missing_subscription" }, { status: 400 });

    // The pending order must belong to this user.
    const { data: order } = await supabase
        .from("orders")
        .select("id, user_id")
        .eq("provider_order_id", subscriptionId)
        .maybeSingle();
    if (!order || order.user_id !== user.id) {
        return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }

    try {
        const sub = await getSubscription(subscriptionId);
        await fulfillSubscription(subscriptionId, sub);
        const ok = sub?.status === "ACTIVE" || sub?.status === "APPROVED";
        return NextResponse.json({ status: sub?.status ?? "UNKNOWN", ok });
    } catch (e: any) {
        console.error("activate-subscription error:", e);
        return NextResponse.json({ error: e.message || "paypal_error" }, { status: 500 });
    }
}
