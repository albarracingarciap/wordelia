import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createPayPalOrder } from "@/lib/paypal";
import { getPrice, type BillingPeriod, type ProductType } from "@/lib/pricing";

export const dynamic = "force-dynamic";

// Only the products with a real, gated UI flow are accepted for now. 'resource'
// and 'club' are supported by fulfillment but not yet exposed, so we don't let
// clients start those checkouts.
const SUPPORTED_PRODUCT_TYPES: ProductType[] = ["org_subscription", "user_plan"];

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
    const resourceKind = (body?.resourceKind ?? null) as string | null;

    if (!SUPPORTED_PRODUCT_TYPES.includes(productType) || !referenceId) {
        return NextResponse.json({ error: "invalid_product" }, { status: 400 });
    }

    // Authorization per product type.
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

    // Price is ALWAYS computed on the server.
    const price = getPrice({ productType, referenceId, period, resourceKind });
    if (!price) return NextResponse.json({ error: "no_price" }, { status: 400 });

    try {
        const paypalOrderId = await createPayPalOrder(
            price.amount_cents,
            price.currency,
            `${productType}:${referenceId}`,
        );

        const { error: insertError } = await supabase.from("orders").insert({
            user_id: user.id,
            product_type: productType,
            reference_id: referenceId,
            plan_period: period,
            resource_kind: resourceKind,
            amount_cents: price.amount_cents,
            currency: price.currency,
            status: "created",
            provider: "paypal",
            provider_order_id: paypalOrderId,
        });
        if (insertError) {
            // PayPal order exists but we couldn't record it; log the id so the
            // orphan (uncaptured) order is traceable.
            console.error(`create-order insert error (paypalOrderId=${paypalOrderId}):`, insertError);
            return NextResponse.json({ error: "db_error" }, { status: 500 });
        }

        return NextResponse.json({ paypalOrderId });
    } catch (e: any) {
        console.error("create-order error:", e);
        return NextResponse.json({ error: e.message || "paypal_error" }, { status: 500 });
    }
}
