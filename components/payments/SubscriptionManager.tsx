"use client";

import { confirmDialog } from "@/components/ui/confirm";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { PLANS } from "@/lib/plans";
import { formatAmount } from "@/lib/pricing";

interface Subscription {
    plan: string;
    period: "monthly" | "annual" | null;
    status: string;
    current_period_end: string | null;
    provider_subscription_id: string | null;
}

interface Payment {
    id: string;
    amount_cents: number;
    currency: string;
    status: string;
    created_at: string;
}

const PAID_PLANS = PLANS.filter((p) => p.id !== "explorador");

function planName(code: string): string {
    return PLANS.find((p) => p.id === code)?.name ?? code;
}

function formatDate(iso: string | null): string {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" });
}

const STATUS_LABEL: Record<string, string> = {
    active: "Activa",
    cancelled: "Cancelada",
    past_due: "Pago pendiente",
    paused: "Suspendida",
    expired: "Expirada",
};

export default function SubscriptionManager({ subscription, payments = [] }: { subscription: Subscription | null; payments?: Payment[] }) {
    const router = useRouter();
    const [busy, setBusy] = React.useState(false);
    const [message, setMessage] = React.useState<{ kind: "ok" | "error"; text: string } | null>(null);
    const [showChange, setShowChange] = React.useState(false);

    const sub = subscription;
    const hasActiveSub = !!sub?.provider_subscription_id && sub.status !== "expired";

    // Target selection for "cambiar de plan".
    const [targetPlan, setTargetPlan] = React.useState<string>(sub?.plan ?? "voraz");
    const [targetAnnual, setTargetAnnual] = React.useState<boolean>(sub?.period === "annual");
    const targetPeriod: "monthly" | "annual" = targetAnnual ? "annual" : "monthly";
    const isSameAsCurrent = hasActiveSub && targetPlan === sub?.plan && targetPeriod === sub?.period;

    async function handleChangePlan() {
        if (!sub?.provider_subscription_id || isSameAsCurrent) return;
        setBusy(true);
        setMessage(null);
        try {
            const res = await fetch("/api/payments/paypal/revise-subscription", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    subscriptionId: sub.provider_subscription_id,
                    referenceId: targetPlan,
                    period: targetPeriod,
                }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                setMessage({ kind: "error", text: "No se pudo cambiar el plan. Inténtalo de nuevo." });
                return;
            }
            // Upgrades (subida de precio) requieren aprobación del comprador en PayPal.
            if (data.approveUrl) {
                window.location.href = data.approveUrl;
                return;
            }
            setMessage({ kind: "ok", text: "Plan actualizado. El cambio se aplicará en breve." });
            setShowChange(false);
            router.refresh();
        } finally {
            setBusy(false);
        }
    }

    async function handleCancel() {
        if (!sub?.provider_subscription_id) return;
        if (!(await confirmDialog({
            title: "Cancelar suscripción",
            message: `¿Seguro que quieres cancelar tu suscripción? Mantendrás el acceso hasta el ${formatDate(sub.current_period_end)}.`,
            confirmLabel: "Cancelar suscripción",
            cancelLabel: "Volver",
            tone: "danger",
        }))) {
            return;
        }
        setBusy(true);
        setMessage(null);
        try {
            const res = await fetch("/api/payments/paypal/cancel-subscription", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ subscriptionId: sub.provider_subscription_id }),
            });
            if (!res.ok) {
                setMessage({ kind: "error", text: "No se pudo cancelar. Inténtalo de nuevo o contáctanos." });
                return;
            }
            setMessage({ kind: "ok", text: `Suscripción cancelada. Conservas el acceso hasta el ${formatDate(sub.current_period_end)}.` });
            router.refresh();
        } finally {
            setBusy(false);
        }
    }

    return (
        <div className="mx-auto max-w-2xl space-y-6 px-4 py-8">
            <Link href="/app/perfil/editar" className="inline-flex items-center gap-1 text-sm font-medium text-teal hover:underline">
                <ChevronLeft className="h-4 w-4" /> Volver a Cuenta
            </Link>

            <div className="flex items-center gap-3">
                <CreditCard className="h-6 w-6 text-teal" />
                <h1 className="text-2xl font-serif text-teal">Tu suscripción</h1>
            </div>

            {message && (
                <p className={`rounded-xl px-4 py-3 text-sm ${message.kind === "ok" ? "bg-teal/10 text-teal-dark" : "bg-coral/10 text-coral"}`}>
                    {message.text}
                </p>
            )}

            {!hasActiveSub ? (
                <div className="rounded-2xl border border-grey/10 bg-white p-6 text-center">
                    <p className="text-grey-dark">No tienes una suscripción activa.</p>
                    <p className="mt-1 text-sm text-grey/60">Estás en el plan gratuito Lector Explorador.</p>
                    <Link
                        href="/planes"
                        className="mt-4 inline-flex h-10 items-center justify-center rounded-xl bg-teal px-5 text-sm font-semibold text-white transition-colors hover:bg-teal-dark"
                    >
                        Ver planes
                    </Link>
                </div>
            ) : (
                <>
                    <div className="rounded-2xl border border-grey/10 bg-white p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-bold uppercase tracking-wide text-grey/50">Plan actual</p>
                                <p className="mt-1 text-xl font-bold text-teal-dark">{planName(sub!.plan)}</p>
                                <p className="text-sm text-grey/70">{sub!.period === "annual" ? "Facturación anual" : "Facturación mensual"}</p>
                            </div>
                            <span className={`rounded-full px-3 py-1 text-xs font-bold ${sub!.status === "active" ? "bg-teal/10 text-teal-dark" : "bg-coral/10 text-coral"}`}>
                                {STATUS_LABEL[sub!.status] ?? sub!.status}
                            </span>
                        </div>
                        <p className="mt-4 text-sm text-grey/70">
                            {sub!.status === "cancelled"
                                ? `Acceso hasta el ${formatDate(sub!.current_period_end)}.`
                                : `Próxima renovación: ${formatDate(sub!.current_period_end)}.`}
                        </p>
                    </div>

                    {sub!.status !== "cancelled" && (
                        <div className="rounded-2xl border border-grey/10 bg-white p-6">
                            <div className="flex items-center justify-between">
                                <h2 className="font-bold text-teal-dark">Cambiar de plan</h2>
                                <Button variant="ghost" size="sm" className="text-teal hover:bg-teal/5" onClick={() => setShowChange((v) => !v)}>
                                    {showChange ? "Cerrar" : "Cambiar"}
                                </Button>
                            </div>

                            {showChange && (
                                <div className="mt-4 space-y-4">
                                    <div className="grid gap-3 sm:grid-cols-2">
                                        {PAID_PLANS.map((p) => (
                                            <button
                                                key={p.id}
                                                type="button"
                                                onClick={() => setTargetPlan(p.id)}
                                                className={`rounded-xl border p-4 text-left transition-colors ${targetPlan === p.id ? "border-teal bg-teal/5" : "border-grey/10 hover:border-teal/30"}`}
                                            >
                                                <p className="font-bold text-teal-dark">{p.name}</p>
                                                <p className="text-sm text-grey/70">{targetAnnual ? p.annualPrice + "/año" : p.monthlyPrice + "/mes"}</p>
                                            </button>
                                        ))}
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <span className={`text-sm ${!targetAnnual ? "font-semibold text-teal-dark" : "text-grey/60"}`}>Mensual</span>
                                        <button
                                            type="button"
                                            onClick={() => setTargetAnnual((v) => !v)}
                                            className={`relative h-7 w-12 rounded-full transition-colors ${targetAnnual ? "bg-teal" : "bg-grey/30"}`}
                                            aria-label="Cambiar periodicidad"
                                        >
                                            <span className={`absolute left-1 top-1 h-5 w-5 rounded-full bg-white transition-transform ${targetAnnual ? "translate-x-5" : "translate-x-0"}`} />
                                        </button>
                                        <span className={`text-sm ${targetAnnual ? "font-semibold text-teal-dark" : "text-grey/60"}`}>Anual</span>
                                    </div>

                                    <Button
                                        className="w-full"
                                        isLoading={busy}
                                        disabled={isSameAsCurrent}
                                        onClick={handleChangePlan}
                                    >
                                        {isSameAsCurrent ? "Es tu plan actual" : "Confirmar cambio"}
                                    </Button>
                                    <p className="text-xs text-grey/60">
                                        En una mejora de plan, PayPal te pedirá confirmar el nuevo importe. Los ajustes se prorratean automáticamente.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="rounded-2xl border border-coral/20 bg-coral/5 p-6">
                        <h2 className="font-bold text-coral">Cancelar suscripción</h2>
                        <p className="mt-1 text-sm text-grey-dark/70">
                            {sub!.status === "cancelled"
                                ? "Tu suscripción ya está cancelada; no se renovará."
                                : "Dejará de renovarse. Conservas el acceso hasta el final del periodo ya pagado."}
                        </p>
                        {sub!.status !== "cancelled" && (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="mt-4 border border-coral/20 text-coral hover:bg-coral/5"
                                isLoading={busy}
                                onClick={handleCancel}
                            >
                                Cancelar suscripción
                            </Button>
                        )}
                    </div>
                </>
            )}

            {payments.length > 0 && (
                <div className="rounded-2xl border border-grey/10 bg-white p-6">
                    <h2 className="font-bold text-teal-dark">Historial de pagos</h2>
                    <ul className="mt-3 divide-y divide-grey/10">
                        {payments.map((p) => (
                            <li key={p.id} className="flex items-center justify-between py-2 text-sm">
                                <span className="text-grey/70">{formatDate(p.created_at)}</span>
                                <span className="font-semibold text-teal-dark">{formatAmount(p.amount_cents, p.currency)}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}
