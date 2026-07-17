import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createSubscription } from "@/lib/paypal";
import { resolvePlanId } from "@/lib/paypal-plans";
import { getPrice, type BillingPeriod, type ProductType } from "@/lib/pricing";

export const dynamic = "force-dynamic";

// Recurring products only. resource/club stay on the one-off Orders API.
const SUPPORTED_PRODUCT_TYPES: ProductType[] = ["org_subscription", "user_plan"];

function appOrigin() {
    return process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}

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

    const productType = body?.productType as ProductType;
    const referenceId = String(body?.referenceId ?? "");
    const period = (body?.period ?? null) as BillingPeriod | null;

    if (!SUPPORTED_PRODUCT_TYPES.includes(productType) || !referenceId) {
        return NextResponse.json({ error: "invalid_product" }, { status: 400 });
    }
    if (period !== "monthly" && period !== "annual") {
        return NextResponse.json({ error: "invalid_period" }, { status: 400 });
    }

    // Authorization: only an org owner/manager can subscribe the library.
    if (productType === "org_subscription") {
        const { data: membership } = await supabase
            .from("organization_members")
            .select("role")
            .eq("organization_id", referenceId)
            .eq("user_id", user.id)
            .maybeSingle();
        if (!membership || !["owner", "manager"].includes(membership.role)) {
            return NextResponse.json({ error: "forbidden" }, { status: 403 });
        }
    }

    // plan_id and price are ALWAYS resolved on the server.
    const planId = resolvePlanId({ productType, referenceId, period });
    if (!planId) return NextResponse.json({ error: "no_plan" }, { status: 400 });
    const price = getPrice({ productType, referenceId, period });
    if (!price) return NextResponse.json({ error: "no_price" }, { status: 400 });

    try {
        const origin = appOrigin();
        const sub = await createSubscription(
            planId,
            `${productType}:${referenceId}`,
            `${origin}/app`,
            `${origin}/planes`,
        );

        // Track the pending subscription so activate/cancel/revise/webhook can map
        // it back to this user + product. provider_order_id holds the subscription id.
        const { error: insertError } = await supabase.from("orders").insert({
            user_id: user.id,
            product_type: productType,
            reference_id: referenceId,
            plan_period: period,
            amount_cents: price.amount_cents,
            currency: price.currency,
            status: "created",
            provider: "paypal",
            provider_order_id: sub.id,
        });
        if (insertError) {
            console.error(`create-subscription insert error (subscriptionId=${sub.id}):`, insertError);
            return NextResponse.json({ error: "db_error" }, { status: 500 });
        }

        return NextResponse.json({ subscriptionId: sub.id, approveUrl: sub.approveUrl });
    } catch (e: any) {
        console.error("create-subscription error:", e);
        return NextResponse.json({ error: e.message || "paypal_error" }, { status: 500 });
    }
}
