"use client";

import * as React from "react";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";

const PAYPAL_CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;

/**
 * Wrap once per surface that offers recurring subscriptions. Loads the SDK in
 * subscription mode (intent + vault) — distinct from the one-off capture flow in
 * PayPalCheckout. When PayPal isn't configured, children still render (each
 * button shows its own fallback) so surrounding content isn't hidden.
 */
export function PayPalSubscriptionProvider({ children }: { children: React.ReactNode }) {
    if (!PAYPAL_CLIENT_ID) return <>{children}</>;
    return (
        <PayPalScriptProvider
            options={{ clientId: PAYPAL_CLIENT_ID, currency: "EUR", intent: "subscription", vault: true }}
        >
            {children}
        </PayPalScriptProvider>
    );
}

export interface PayPalSubscribeButtonProps {
    productType: "user_plan" | "org_subscription";
    referenceId: string;              // plan code (user) | org id (org)
    period: "monthly" | "annual";
    onSuccess?: () => void;
}

/**
 * Subscribe button. The subscription is created server-side (price + plan_id
 * resolved there); createSubscription just returns that id so PayPal shows the
 * in-context approval popup. onApprove then activates it.
 */
export function PayPalSubscribeButton({ productType, referenceId, period, onSuccess }: PayPalSubscribeButtonProps) {
    const [error, setError] = React.useState("");

    if (!PAYPAL_CLIENT_ID) {
        return <p className="text-center text-xs text-grey/50">Pagos aún no disponibles.</p>;
    }

    return (
        <div>
            {error && <p className="mb-2 text-sm text-coral">{error}</p>}
            <PayPalButtons
                style={{ layout: "vertical", label: "subscribe", height: 40 }}
                forceReRender={[productType, referenceId, period]}
                createSubscription={async () => {
                    setError("");
                    const res = await fetch("/api/payments/paypal/create-subscription", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ productType, referenceId, period }),
                    });
                    const data = await res.json();
                    if (!res.ok || !data.subscriptionId) throw new Error(data.error || "create_subscription_failed");
                    return data.subscriptionId as string;
                }}
                onApprove={async (data) => {
                    const res = await fetch("/api/payments/paypal/activate-subscription", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ subscriptionId: data.subscriptionID }),
                    });
                    const result = await res.json().catch(() => ({}));
                    if (!res.ok || !result.ok) {
                        setError("No se pudo activar la suscripción. Si se te ha cobrado, contáctanos.");
                        return;
                    }
                    onSuccess?.();
                }}
                onError={(err) => {
                    console.error("PayPal subscription error:", err);
                    setError("Error en el pago. Inténtalo de nuevo.");
                }}
            />
        </div>
    );
}
