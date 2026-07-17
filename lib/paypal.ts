// Server-only PayPal (Orders API) helpers. Never import from client code.

function getBaseUrl() {
    return process.env.PAYPAL_ENV === 'live'
        ? 'https://api-m.paypal.com'
        : 'https://api-m.sandbox.paypal.com';
}

function creds() {
    const clientId = process.env.PAYPAL_CLIENT_ID;
    const secret = process.env.PAYPAL_CLIENT_SECRET;
    if (!clientId || !secret) throw new Error('PayPal no está configurado (faltan PAYPAL_CLIENT_ID/SECRET).');
    return { clientId, secret };
}

export async function getAccessToken(): Promise<string> {
    const { clientId, secret } = creds();
    const auth = Buffer.from(`${clientId}:${secret}`).toString('base64');
    const res = await fetch(`${getBaseUrl()}/v1/oauth2/token`, {
        method: 'POST',
        headers: {
            Authorization: `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'grant_type=client_credentials',
    });
    if (!res.ok) throw new Error(`PayPal token error: ${res.status}`);
    const data = await res.json();
    return data.access_token as string;
}

/** Create a CAPTURE-intent order. amountCents -> "19.00". Returns the order id. */
export async function createPayPalOrder(amountCents: number, currency: string, customId: string): Promise<string> {
    const token = await getAccessToken();
    const value = (amountCents / 100).toFixed(2);
    const res = await fetch(`${getBaseUrl()}/v2/checkout/orders`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
            intent: 'CAPTURE',
            purchase_units: [{ amount: { currency_code: currency, value }, custom_id: customId }],
        }),
    });
    const data = await res.json();
    if (!res.ok || !data.id) throw new Error(`PayPal create-order error: ${res.status} ${JSON.stringify(data)}`);
    return data.id as string;
}

export interface CaptureResult {
    ok: boolean;
    status: string;
    captureId: string | null;
    raw: any;
}

export async function capturePayPalOrder(orderId: string): Promise<CaptureResult> {
    const token = await getAccessToken();
    const res = await fetch(`${getBaseUrl()}/v2/checkout/orders/${orderId}/capture`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    });
    const data = await res.json();
    const capture = data?.purchase_units?.[0]?.payments?.captures?.[0];
    return {
        ok: res.ok && data?.status === 'COMPLETED',
        status: data?.status || 'UNKNOWN',
        captureId: capture?.id || null,
        raw: data,
    };
}

// --- Subscriptions API (recurring billing) ---------------------------------

export interface SubscriptionResult {
    id: string;
    status: string;
    approveUrl: string | null;    // link de aprobación del comprador (alta y upgrades)
}

function approveLink(links: any[] | undefined): string | null {
    return links?.find((l) => l.rel === 'approve')?.href ?? null;
}

/** Create a subscription to a billing plan. Returns its id + the buyer approval link. */
export async function createSubscription(
    planId: string,
    customId: string,
    returnUrl: string,
    cancelUrl: string,
): Promise<SubscriptionResult> {
    const token = await getAccessToken();
    const res = await fetch(`${getBaseUrl()}/v1/billing/subscriptions`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            Prefer: 'return=representation',
        },
        body: JSON.stringify({
            plan_id: planId,
            custom_id: customId,
            application_context: {
                brand_name: 'Wordelia',
                locale: 'es-ES',
                shipping_preference: 'NO_SHIPPING',
                user_action: 'SUBSCRIBE_NOW',
                return_url: returnUrl,
                cancel_url: cancelUrl,
            },
        }),
    });
    const data = await res.json();
    if (!res.ok || !data.id) throw new Error(`PayPal create-subscription error: ${res.status} ${JSON.stringify(data)}`);
    return { id: data.id, status: data.status, approveUrl: approveLink(data.links) };
}

/** Fetch a subscription (status, plan_id, billing_info.next_billing_time, custom_id…). */
export async function getSubscription(subscriptionId: string): Promise<any> {
    const token = await getAccessToken();
    const res = await fetch(`${getBaseUrl()}/v1/billing/subscriptions/${subscriptionId}`, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(`PayPal get-subscription error: ${res.status} ${JSON.stringify(data)}`);
    return data;
}

/** Cancel a subscription. The real status change arrives via webhook. */
export async function cancelSubscription(subscriptionId: string, reason: string): Promise<void> {
    const token = await getAccessToken();
    const res = await fetch(`${getBaseUrl()}/v1/billing/subscriptions/${subscriptionId}/cancel`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
    });
    // 204 No Content on success.
    if (!res.ok && res.status !== 204) {
        const data = await res.json().catch(() => ({}));
        throw new Error(`PayPal cancel-subscription error: ${res.status} ${JSON.stringify(data)}`);
    }
}

/**
 * Change the plan of an existing subscription (upgrade/downgrade). PayPal handles
 * proration. Upgrades (price increase) return an approval link the buyer must
 * confirm; downgrades usually apply without re-approval.
 */
export async function reviseSubscription(
    subscriptionId: string,
    newPlanId: string,
    returnUrl: string,
    cancelUrl: string,
): Promise<SubscriptionResult> {
    const token = await getAccessToken();
    const res = await fetch(`${getBaseUrl()}/v1/billing/subscriptions/${subscriptionId}/revise`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            Prefer: 'return=representation',
        },
        body: JSON.stringify({
            plan_id: newPlanId,
            application_context: {
                brand_name: 'Wordelia',
                locale: 'es-ES',
                shipping_preference: 'NO_SHIPPING',
                user_action: 'SUBSCRIBE_NOW',
                return_url: returnUrl,
                cancel_url: cancelUrl,
            },
        }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(`PayPal revise-subscription error: ${res.status} ${JSON.stringify(data)}`);
    return { id: subscriptionId, status: data.status ?? 'UNKNOWN', approveUrl: approveLink(data.links) };
}

/** Verify a PayPal webhook signature. Returns true only on SUCCESS. */
export async function verifyWebhookSignature(headers: Headers, rawBody: string): Promise<boolean> {
    const webhookId = process.env.PAYPAL_WEBHOOK_ID;
    if (!webhookId) {
        console.error('verifyWebhookSignature: missing PAYPAL_WEBHOOK_ID');
        return false;
    }
    const token = await getAccessToken();
    const res = await fetch(`${getBaseUrl()}/v1/notifications/verify-webhook-signature`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
            transmission_id: headers.get('paypal-transmission-id'),
            transmission_time: headers.get('paypal-transmission-time'),
            cert_url: headers.get('paypal-cert-url'),
            auth_algo: headers.get('paypal-auth-algo'),
            transmission_sig: headers.get('paypal-transmission-sig'),
            webhook_id: webhookId,
            webhook_event: JSON.parse(rawBody),
        }),
    });
    if (!res.ok) return false;
    const data = await res.json();
    return data.verification_status === 'SUCCESS';
}
