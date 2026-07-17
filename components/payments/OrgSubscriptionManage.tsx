"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

interface Props {
    organizationId: string;
    subscriptionId: string;
    status: string;
    billingPeriod: "monthly" | "annual" | null;
    currentPeriodEnd: string | null;
}

function formatDate(iso: string | null): string {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" });
}

// Compact management for a Pro library: switch billing period or cancel. Change
// of plan target isn't offered (a library has a single Pro plan; only the cycle
// changes). Auth is enforced server-side by the endpoints (owner/manager).
export default function OrgSubscriptionManage({ organizationId, subscriptionId, status, billingPeriod, currentPeriodEnd }: Props) {
    const router = useRouter();
    const [busy, setBusy] = React.useState(false);
    const [message, setMessage] = React.useState<{ kind: "ok" | "error"; text: string } | null>(null);

    const isCancelled = status === "cancelled";
    const targetPeriod: "monthly" | "annual" = billingPeriod === "annual" ? "monthly" : "annual";

    async function switchPeriod() {
        setBusy(true);
        setMessage(null);
        try {
            const res = await fetch("/api/payments/paypal/revise-subscription", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ subscriptionId, referenceId: organizationId, period: targetPeriod }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                setMessage({ kind: "error", text: "No se pudo cambiar la facturación. Inténtalo de nuevo." });
                return;
            }
            if (data.approveUrl) {
                window.location.href = data.approveUrl;
                return;
            }
            setMessage({ kind: "ok", text: "Facturación actualizada. El cambio se aplicará en breve." });
            router.refresh();
        } finally {
            setBusy(false);
        }
    }

    async function cancel() {
        if (!confirm(`¿Cancelar la suscripción Pro? La librería mantendrá Pro hasta el ${formatDate(currentPeriodEnd)}.`)) return;
        setBusy(true);
        setMessage(null);
        try {
            const res = await fetch("/api/payments/paypal/cancel-subscription", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ subscriptionId }),
            });
            if (!res.ok) {
                setMessage({ kind: "error", text: "No se pudo cancelar. Inténtalo de nuevo o contáctanos." });
                return;
            }
            setMessage({ kind: "ok", text: `Suscripción cancelada. Pro activo hasta el ${formatDate(currentPeriodEnd)}.` });
            router.refresh();
        } finally {
            setBusy(false);
        }
    }

    return (
        <div className="space-y-3">
            <p className="text-sm text-grey/70">
                {isCancelled
                    ? `Suscripción cancelada. Pro activo hasta el ${formatDate(currentPeriodEnd)}.`
                    : `Facturación ${billingPeriod === "annual" ? "anual" : "mensual"} · próxima renovación el ${formatDate(currentPeriodEnd)}.`}
            </p>

            {message && (
                <p className={`rounded-lg px-3 py-2 text-sm ${message.kind === "ok" ? "bg-teal/10 text-teal-dark" : "bg-coral/10 text-coral"}`}>
                    {message.text}
                </p>
            )}

            {!isCancelled && (
                <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" isLoading={busy} onClick={switchPeriod}>
                        Cambiar a facturación {targetPeriod === "annual" ? "anual" : "mensual"}
                    </Button>
                    <Button variant="ghost" size="sm" className="border border-coral/20 text-coral hover:bg-coral/5" isLoading={busy} onClick={cancel}>
                        Cancelar Pro
                    </Button>
                </div>
            )}
        </div>
    );
}
