"use client";

import * as React from "react";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";

const PAYPAL_CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;

/**
 * Wrap once per page/surface; PayPalCheckout buttons go inside. When PayPal
 * isn't configured, children still render (each PayPalCheckout shows its own
 * fallback) so surrounding content — e.g. the whole /planes grid — is not hidden.
 */
export function PayPalProvider({ children }: { children: React.ReactNode }) {
    if (!PAYPAL_CLIENT_ID) return <>{children}</>;
    return (
        <PayPalScriptProvider options={{ clientId: PAYPAL_CLIENT_ID, currency: "EUR", intent: "capture" }}>
            {children}
        </PayPalScriptProvider>
    );
}

export interface PayPalCheckoutProps {
    productType: "org_subscription" | "user_plan" | "resource" | "club";
    referenceId: string;
    period?: "monthly" | "annual" | null;
    resourceKind?: "guide" | "genome" | null;
    onSuccess?: () => void;
}

export function PayPalCheckout({ productType, referenceId, period, resourceKind, onSuccess }: PayPalCheckoutProps) {
    const [error, setError] = React.useState("");

    if (!PAYPAL_CLIENT_ID) {
        return <p className="text-center text-xs text-grey/50">Pagos aún no disponibles.</p>;
    }

    return (
        <div>
            {error && <p className="mb-2 text-sm text-coral">{error}</p>}
            <PayPalButtons
                style={{ layout: "vertical", label: "pay", height: 40 }}
                forceReRender={[productType, referenceId, period]}
                createOrder={async () => {
                    setError("");
                    const res = await fetch("/api/payments/paypal/create-order", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ productType, referenceId, period, resourceKind }),
                    });
                    const data = await res.json();
                    if (!res.ok || !data.paypalOrderId) throw new Error(data.error || "create_order_failed");
                    return data.paypalOrderId as string;
                }}
                onApprove={async (data) => {
                    const res = await fetch("/api/payments/paypal/capture", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ paypalOrderId: data.orderID }),
                    });
                    const result = await res.json().catch(() => ({}));
                    if (!res.ok || !result.ok) {
                        setError("No se pudo completar el pago. Si se te ha cobrado, contáctanos.");
                        return;
                    }
                    onSuccess?.();
                }}
                onError={(err) => {
                    console.error("PayPal error:", err);
                    setError("Error en el pago. Inténtalo de nuevo.");
                }}
            />
        </div>
    );
}
