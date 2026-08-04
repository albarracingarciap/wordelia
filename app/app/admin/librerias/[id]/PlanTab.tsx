"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Crown, CreditCard, Gift, Loader2, CheckCircle2, AlertTriangle } from "lucide-react";
import type { LibraryWorkspace, OrgPayment } from "../data";
import { grantOrgProAction, revokeOrgProAction } from "../actions";
import { ConfirmModal } from "@/components/ui/ConfirmModal";

function fmtDate(iso: string | null) {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("es-ES", { day: "2-digit", month: "long", year: "numeric" });
}
function fmtMoney(cents: number, currency: string) {
    return (cents / 100).toLocaleString("es-ES", { style: "currency", currency: currency || "EUR" });
}

const STATUS_LABELS: Record<string, string> = {
    active: "Activa",
    trialing: "Prueba",
    past_due: "Pago pendiente",
    cancelled: "Cancelada",
    expired: "Expirada",
    paused: "Pausada",
};

export function PlanTab({
    orgId,
    subscription,
    payments,
}: {
    orgId: string;
    subscription: LibraryWorkspace["subscription"];
    payments: OrgPayment[];
}) {
    const router = useRouter();
    const [pending, startTransition] = useTransition();
    const [feedback, setFeedback] = useState<{ ok: boolean; msg: string } | null>(null);
    const [months, setMonths] = useState("12");
    const [confirmDowngrade, setConfirmDowngrade] = useState(false);

    const isPro = subscription?.tier === "pro" && subscription?.status !== "expired";
    const hasPaypal = Boolean(subscription?.provider_subscription_id);

    const run = (fn: () => Promise<{ success: true } | { error: string }>, okMsg: string) => {
        setFeedback(null);
        startTransition(async () => {
            const res = await fn();
            if ("error" in res) setFeedback({ ok: false, msg: res.error });
            else {
                setFeedback({ ok: true, msg: okMsg });
                router.refresh();
            }
        });
    };

    return (
        <div className="space-y-5 max-w-2xl">
            {/* Estado de la suscripción */}
            <div className="bg-card rounded-xl border border-teal/10 shadow-sm p-5">
                <div className="flex items-center gap-2 mb-3">
                    <Crown className="w-4 h-4 text-teal" />
                    <h3 className="font-semibold">Suscripción</h3>
                </div>
                {subscription ? (
                    <dl className="space-y-2 text-sm">
                        <div className="flex justify-between"><dt className="text-muted-foreground">Plan</dt><dd className="font-medium">{subscription.tier === "pro" ? "Pro" : "Free"}</dd></div>
                        <div className="flex justify-between"><dt className="text-muted-foreground">Estado</dt><dd>{subscription.status ? STATUS_LABELS[subscription.status] ?? subscription.status : "—"}</dd></div>
                        <div className="flex justify-between"><dt className="text-muted-foreground">Periodo</dt><dd>{subscription.billing_period === "annual" ? "Anual" : subscription.billing_period === "monthly" ? "Mensual" : "—"}</dd></div>
                        <div className="flex justify-between"><dt className="text-muted-foreground">Renueva / vence</dt><dd>{fmtDate(subscription.current_period_end)}</dd></div>
                        <div className="flex justify-between"><dt className="text-muted-foreground">Proveedor</dt><dd className="capitalize">{subscription.provider ?? "—"}</dd></div>
                    </dl>
                ) : (
                    <p className="text-sm text-muted-foreground">Sin suscripción. Plan actual: <b>Free</b>.</p>
                )}

                {hasPaypal && (
                    <div className="flex items-start gap-2 text-xs bg-amber-50 text-amber-800 border border-amber-200 rounded-lg px-3 py-2 mt-4">
                        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                        <span>Suscripción vinculada a PayPal. Conceder o bajar aquí <b>no cancela el cobro en PayPal</b>; hazlo también en PayPal si procede.</span>
                    </div>
                )}
            </div>

            {/* Conceder / bajar */}
            <div className="bg-card rounded-xl border border-teal/10 shadow-sm p-5 space-y-3">
                <p className="text-sm font-medium flex items-center gap-1.5"><Gift className="w-4 h-4 text-teal" /> Conceder Pro manual</p>
                <div className="flex flex-wrap items-center gap-2">
                    <select
                        value={months}
                        onChange={(e) => setMonths(e.target.value)}
                        disabled={pending}
                        className="bg-background border border-input rounded-md text-sm px-3 py-2 focus:outline-none focus:ring-1 focus:ring-teal disabled:opacity-50"
                    >
                        <option value="1">1 mes</option>
                        <option value="3">3 meses</option>
                        <option value="6">6 meses</option>
                        <option value="12">12 meses</option>
                        <option value="0">Indefinido</option>
                    </select>
                    <button
                        disabled={pending}
                        onClick={() => run(() => grantOrgProAction(orgId, months === "0" ? null : Number(months)), "Pro concedido.")}
                        className="inline-flex items-center gap-1.5 text-sm font-medium bg-teal text-white py-2 px-4 rounded-md hover:bg-teal-dark transition-colors disabled:opacity-40"
                    >
                        {pending && <Loader2 className="w-4 h-4 animate-spin" />}
                        Conceder Pro
                    </button>
                </div>
                {isPro && (
                    <button
                        disabled={pending}
                        onClick={() => setConfirmDowngrade(true)}
                        className="inline-flex items-center gap-1.5 text-sm font-medium text-coral hover:underline disabled:opacity-40"
                    >
                        Bajar a Free
                    </button>
                )}
                {feedback && (
                    <div className={`flex items-center gap-2 text-sm rounded-lg px-3 py-2 ${feedback.ok ? "bg-teal/10 text-teal-dark border border-teal/20" : "bg-coral/10 text-coral border border-coral/20"}`}>
                        {feedback.ok ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                        {feedback.msg}
                    </div>
                )}
            </div>

            {/* Pagos */}
            <div className="bg-card rounded-xl border border-teal/10 shadow-sm p-5">
                <div className="flex items-center gap-2 mb-3">
                    <CreditCard className="w-4 h-4 text-teal" />
                    <h3 className="font-semibold">Historial de pagos</h3>
                </div>
                {payments.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Sin pagos registrados.</p>
                ) : (
                    <div className="overflow-x-auto -mx-1">
                        <table className="w-full text-sm">
                            <thead className="text-muted-foreground text-left">
                                <tr className="border-b border-teal/10">
                                    <th className="py-2 pr-3 font-medium">Fecha</th>
                                    <th className="py-2 pr-3 font-medium text-right">Importe</th>
                                    <th className="py-2 pr-3 font-medium">Proveedor</th>
                                    <th className="py-2 font-medium">Estado</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-teal/5">
                                {payments.map((p) => (
                                    <tr key={p.id}>
                                        <td className="py-2 pr-3 whitespace-nowrap text-muted-foreground">{fmtDate(p.created_at)}</td>
                                        <td className="py-2 pr-3 text-right font-medium whitespace-nowrap">{fmtMoney(p.amount_cents, p.currency)}</td>
                                        <td className="py-2 pr-3 capitalize text-muted-foreground">{p.provider}</td>
                                        <td className="py-2 capitalize text-muted-foreground">{p.status}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <ConfirmModal
                open={confirmDowngrade}
                title="Bajar a Free"
                message="La librería perderá el acceso Pro de inmediato. Si tiene una suscripción de PayPal, recuerda cancelarla también en PayPal."
                confirmLabel="Bajar a Free"
                tone="danger"
                busy={pending}
                onConfirm={() => { setConfirmDowngrade(false); run(() => revokeOrgProAction(orgId), "Bajada a Free."); }}
                onCancel={() => setConfirmDowngrade(false)}
            />
        </div>
    );
}
