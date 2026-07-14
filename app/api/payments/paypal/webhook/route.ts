import { NextRequest, NextResponse } from "next/server";
import { verifyWebhookSignature } from "@/lib/paypal";
import { fulfillOrder } from "@/lib/fulfillment";

export const dynamic = "force-dynamic";

// Backup fulfillment path: PayPal calls this even if the client-side capture
// request didn't complete. Signature is verified; fulfillment is idempotent.
export async function POST(request: NextRequest) {
    const rawBody = await request.text();

    const valid = await verifyWebhookSignature(request.headers, rawBody);
    if (!valid) {
        console.error("paypal webhook: invalid signature");
        return NextResponse.json({ error: "invalid_signature" }, { status: 400 });
    }

    let event: any;
    try {
        event = JSON.parse(rawBody);
    } catch {
        return NextResponse.json({ error: "invalid_body" }, { status: 400 });
    }

    if (event?.event_type === "PAYMENT.CAPTURE.COMPLETED") {
        const resource = event.resource;
        const orderId = resource?.supplementary_data?.related_ids?.order_id;
        const captureId = resource?.id ?? null;
        if (orderId) {
            await fulfillOrder(orderId, captureId);
        } else {
            // Don't fail silently: log enough to reconcile the payment manually.
            console.error("paypal webhook: capture event without order_id", JSON.stringify({
                captureId,
                custom_id: resource?.custom_id ?? null,
                event_id: event?.id ?? null,
            }));
        }
    }

    // Always 200 for handled/ignored events so PayPal stops retrying.
    return NextResponse.json({ received: true });
}
