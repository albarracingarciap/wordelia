import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { capturePayPalOrder } from "@/lib/paypal";
import { fulfillOrder } from "@/lib/fulfillment";

export const dynamic = "force-dynamic";

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

    const paypalOrderId = String(body?.paypalOrderId ?? "");
    if (!paypalOrderId) return NextResponse.json({ error: "missing_order" }, { status: 400 });

    // The order must belong to this user.
    const { data: order } = await supabase
        .from("orders")
        .select("id, user_id")
        .eq("provider_order_id", paypalOrderId)
        .maybeSingle();
    if (!order || order.user_id !== user.id) {
        return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }

    try {
        const result = await capturePayPalOrder(paypalOrderId);
        if (!result.ok) {
            return NextResponse.json({ status: result.status, ok: false }, { status: 402 });
        }
        // Fulfillment is idempotent; the webhook is a backup for this same call.
        await fulfillOrder(paypalOrderId, result.captureId);
        return NextResponse.json({ status: "COMPLETED", ok: true });
    } catch (e: any) {
        console.error("capture error:", e);
        return NextResponse.json({ error: e.message || "paypal_error" }, { status: 500 });
    }
}
