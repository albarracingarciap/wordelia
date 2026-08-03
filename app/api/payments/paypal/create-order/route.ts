import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createPayPalOrder } from "@/lib/paypal";
import { getPrice, type BillingPeriod, type ProductType } from "@/lib/pricing";

export const dynamic = "force-dynamic";

// Products with a real, gated UI flow. 'club' = unirse a un club oficial de pago
// (one-off). 'resource' = compra individual de una guía/genoma para un libro.
const SUPPORTED_PRODUCT_TYPES: ProductType[] = ["org_subscription", "user_plan", "club", "resource"];

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
    // Monedas aplicadas como descuento (solo 'club'; 0 = pago íntegro por PayPal).
    const appliedCoins = Math.max(0, Math.floor(Number(body?.appliedCoins) || 0));

    if (!SUPPORTED_PRODUCT_TYPES.includes(productType) || !referenceId) {
        return NextResponse.json({ error: "invalid_product" }, { status: 400 });
    }

    // Price is ALWAYS computed on the server.
    let price: { amount_cents: number; currency: string } | null = null;
    // Metadata extra de la orden (p.ej. monedas aplicadas en un club).
    let orderMetadata: Record<string, unknown> = {};

    // Authorization + price per product type.
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
        price = getPrice({ productType, referenceId, period, resourceKind });
    } else if (productType === "club") {
        // Solo clubs oficiales de pago; el precio (euros) vive en clubs.price.
        const { data: club } = await supabase
            .from("clubs")
            .select("is_official, is_archived, price, currency")
            .eq("id", referenceId)
            .maybeSingle();
        if (!club || !club.is_official || club.is_archived) {
            return NextResponse.json({ error: "invalid_club" }, { status: 400 });
        }
        if (typeof club.price !== "number" || club.price <= 0) {
            return NextResponse.json({ error: "club_not_paid" }, { status: 400 });
        }
        const { data: existing } = await supabase
            .from("club_members")
            .select("role")
            .eq("club_id", referenceId)
            .eq("user_id", user.id)
            .maybeSingle();
        if (existing && existing.role !== "pending") {
            return NextResponse.json({ error: "already_member" }, { status: 409 });
        }
        const currency = club.currency ?? "EUR";
        const fullCents = Math.round(club.price * 100);
        if (appliedCoins > 0) {
            // Descuento parcial: 1 moneda = 1 €, y debe quedar ≥ 1 € para PayPal.
            const maxApplicable = Math.floor(club.price - 1);
            if (appliedCoins > maxApplicable) {
                return NextResponse.json({ error: "coins_too_high" }, { status: 400 });
            }
            const remainderCents = fullCents - appliedCoins * 100;
            if (remainderCents < 100) {
                return NextResponse.json({ error: "remainder_too_low" }, { status: 400 });
            }
            price = { amount_cents: remainderCents, currency };
            orderMetadata = { applied_coins: appliedCoins, total_price_cents: fullCents };
        } else {
            price = { amount_cents: fullCents, currency };
        }
    } else if (productType === "resource") {
        // Compra individual de un recurso (guía/genoma) para un libro.
        if (resourceKind !== "guide" && resourceKind !== "genome") {
            return NextResponse.json({ error: "invalid_resource_kind" }, { status: 400 });
        }
        // Evita el doble cobro: si ya tiene concesión para este recurso, no cobra.
        const { data: owned } = await supabase
            .from("user_book_resource_access")
            .select("book_id")
            .eq("user_id", user.id)
            .eq("book_id", referenceId)
            .eq("resource_kind", resourceKind)
            .maybeSingle();
        if (owned) return NextResponse.json({ error: "already_owned" }, { status: 409 });
        price = getPrice({ productType, referenceId, period, resourceKind });
    } else {
        price = getPrice({ productType, referenceId, period, resourceKind });
    }

    if (!price) return NextResponse.json({ error: "no_price" }, { status: 400 });

    try {
        const paypalOrderId = await createPayPalOrder(
            price.amount_cents,
            price.currency,
            `${productType}:${referenceId}`,
        );

        // Reserva (escrow) de las monedas del descuento parcial. Se debitan ya;
        // fulfillOrder las da por gastadas al capturar, y el job de limpieza las
        // devuelve si la orden se abandona.
        if (productType === "club" && appliedCoins > 0) {
            const { error: reserveError } = await supabase.rpc("reserve_coins_for_order", {
                p_amount: appliedCoins,
                p_reference: paypalOrderId,
            });
            if (reserveError) {
                console.error(`create-order reserve error (paypalOrderId=${paypalOrderId}):`, reserveError);
                return NextResponse.json({ error: "coins_reserve_failed" }, { status: 400 });
            }
        }

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
            metadata: orderMetadata,
        });
        if (insertError) {
            // PayPal order exists but we couldn't record it; log the id so the
            // orphan (uncaptured) order is traceable. Si además reservamos monedas,
            // no hay fila de orden para que el job de limpieza las devuelva: se
            // registran aquí para reparación manual (ventana de ms, muy improbable).
            console.error(`create-order insert error (paypalOrderId=${paypalOrderId}):`, insertError);
            if (productType === "club" && appliedCoins > 0) {
                console.error(`create-order: ${appliedCoins} monedas reservadas SIN orden (user=${user.id}, ref=${paypalOrderId}); requiere reembolso manual.`);
            }
            return NextResponse.json({ error: "db_error" }, { status: 500 });
        }

        return NextResponse.json({ paypalOrderId });
    } catch (e: any) {
        console.error("create-order error:", e);
        return NextResponse.json({ error: e.message || "paypal_error" }, { status: 500 });
    }
}
