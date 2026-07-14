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
