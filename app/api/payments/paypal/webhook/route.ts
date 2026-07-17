import { NextRequest, NextResponse } from "next/server";
import { verifyWebhookSignature } from "@/lib/paypal";
import {
    admin,
    fulfillOrder,
    fulfillSubscription,
    markSubscriptionStatus,
    getSubscriptionContext,
    recordSubscriptionPayment,
} from "@/lib/fulfillment";
import { sendEmail } from "@/lib/email";
import {
    emailSubscriptionActivated,
    emailPaymentReceipt,
    emailPaymentFailed,
    emailSubscriptionCancelled,
} from "@/lib/emails";
import { formatAmount } from "@/lib/pricing";

export const dynamic = "force-dynamic";

function formatDate(iso: string | null): string {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" });
}

// PayPal webhook. Verifies the signature, de-duplicates by event id
// (payment_webhook_events) and dispatches. Handles both the one-off Orders flow
// (PAYMENT.CAPTURE.COMPLETED) and the subscription lifecycle.
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

    const eventId = event?.id as string | undefined;
    const type = event?.event_type as string | undefined;
    const resource = event?.resource;
    if (!eventId || !type) return NextResponse.json({ received: true });

    // Idempotency: first writer wins. A duplicate delivery hits the PK and is skipped.
    const supabase = admin();
    const { error: dupError } = await supabase.from("payment_webhook_events").insert({
        id: eventId,
        event_type: type,
        resource_type: event?.resource_type ?? null,
        payload: event,
    });
    if (dupError) {
        if (dupError.code === "23505") return NextResponse.json({ received: true, duplicate: true });
        // Couldn't record it; proceed anyway (dispatch is idempotent) but log.
        console.error("paypal webhook: could not record event", eventId, dupError);
    }

    try {
        switch (type) {
            // --- One-off orders (unchanged) ---
            case "PAYMENT.CAPTURE.COMPLETED": {
                const orderId = resource?.supplementary_data?.related_ids?.order_id;
                if (orderId) await fulfillOrder(orderId, resource?.id ?? null);
                else console.error("paypal webhook: capture event without order_id", eventId);
                break;
            }

            // --- Subscription lifecycle (resource IS the subscription) ---
            case "BILLING.SUBSCRIPTION.ACTIVATED": {
                if (resource?.id) {
                    await fulfillSubscription(resource.id, resource);
                    const ctx = await getSubscriptionContext(resource.id, resource);
                    if (ctx?.email) await sendEmail({ to: ctx.email, ...emailSubscriptionActivated(ctx.planLabel) });
                } else console.error("paypal webhook: subscription event without id", eventId);
                break;
            }

            case "BILLING.SUBSCRIPTION.UPDATED":
            case "BILLING.SUBSCRIPTION.SUSPENDED":
            case "BILLING.SUBSCRIPTION.EXPIRED": {
                if (resource?.id) await fulfillSubscription(resource.id, resource);
                else console.error("paypal webhook: subscription event without id", eventId);
                break;
            }

            case "BILLING.SUBSCRIPTION.CANCELLED": {
                if (resource?.id) {
                    await fulfillSubscription(resource.id, resource);
                    const ctx = await getSubscriptionContext(resource.id, resource);
                    if (ctx?.email) {
                        await sendEmail({ to: ctx.email, ...emailSubscriptionCancelled(ctx.planLabel, formatDate(ctx.currentPeriodEnd)) });
                    }
                } else console.error("paypal webhook: subscription event without id", eventId);
                break;
            }

            // --- Recurring payment (initial + renewals): resource is a sale ---
            case "PAYMENT.SALE.COMPLETED": {
                const subId = resource?.billing_agreement_id;
                if (subId) {
                    await fulfillSubscription(subId);
                    const pay = await recordSubscriptionPayment(subId, resource);
                    const ctx = await getSubscriptionContext(subId);
                    if (ctx?.email && pay) {
                        await sendEmail({ to: ctx.email, ...emailPaymentReceipt(ctx.planLabel, formatAmount(pay.amountCents, pay.currency)) });
                    }
                }
                // A sale without billing_agreement_id is a non-subscription payment; ignore.
                break;
            }

            // --- Failed recurring charge: PayPal keeps it ACTIVE while retrying ---
            case "BILLING.SUBSCRIPTION.PAYMENT.FAILED": {
                if (resource?.id) {
                    await markSubscriptionStatus(resource.id, "past_due");
                    const ctx = await getSubscriptionContext(resource.id);
                    if (ctx?.email) await sendEmail({ to: ctx.email, ...emailPaymentFailed(ctx.planLabel) });
                }
                break;
            }

            default:
                // Unhandled event type; recorded above, no action.
                break;
        }
    } catch (e) {
        console.error("paypal webhook: dispatch failed for event", eventId, type, e);
    }

    // Always 200 so PayPal stops retrying handled/ignored events.
    return NextResponse.json({ received: true });
}
