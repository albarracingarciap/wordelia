"use client";

import { confirmDialog } from "@/components/ui/confirm";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Avatar } from "@/components/ui/Avatar";
import {
    ArrowLeft,
    ShieldAlert,
    Shield,
    User,
    BadgeCheck,
    Mail,
    CreditCard,
    Gift,
    Trash2,
    Loader2,
    CheckCircle2,
    AlertTriangle,
    Clock,
    Calendar,
    Coins,
} from "lucide-react";
import type { AdminUserDetail } from "../data";
import { isSubscriptionActive } from "@/lib/subscription-access";
import {
    planLabel,
    periodLabel,
    subscriptionStatusLabel,
    subscriptionStatusClasses,
} from "@/lib/subscription-display";
import {
    updateUserRoleAction,
    grantPlanAction,
    revokePlanAction,
    confirmEmailAction,
    setOnboardingAction,
    deleteUserAction,
    giftCoinsAction,
} from "../actions";

function fmtDate(iso: string | null) {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("es-ES", {
        day: "2-digit",
        month: "long",
        year: "numeric",
    });
}

function fmtDateTime(iso: string | null) {
    if (!iso) return "—";
    return new Date(iso).toLocaleString("es-ES", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

function fmtMoney(cents: number, currency: string) {
    return (cents / 100).toLocaleString("es-ES", { style: "currency", currency });
}

function roleBadge(role: string | null) {
    if (role === "admin")
        return (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-coral bg-coral/10 py-1 px-2 rounded-md">
                <ShieldAlert className="w-3 h-3" /> Admin
            </span>
        );
    if (role === "editor")
        return (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-teal-dark bg-teal/20 py-1 px-2 rounded-md">
                <Shield className="w-3 h-3" /> Editor
            </span>
        );
    return (
        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-muted py-1 px-2 rounded-md">
            <User className="w-3 h-3" /> Usuario
        </span>
    );
}

function Card({
    title,
    icon,
    children,
    danger = false,
}: {
    title: string;
    icon: React.ReactNode;
    children: React.ReactNode;
    danger?: boolean;
}) {
    return (
        <div
            className={`bg-card rounded-xl border shadow-sm ${
                danger ? "border-coral/30" : "border-teal/10"
            }`}
        >
            <div
                className={`flex items-center gap-2 px-5 py-3.5 border-b ${
                    danger ? "border-coral/20 text-coral" : "border-teal/10"
                }`}
            >
                {icon}
                <h3 className="font-semibold">{title}</h3>
            </div>
            <div className="p-5">{children}</div>
        </div>
    );
}

export function UserDetailClient({
    detail,
    currentAdminId,
}: {
    detail: AdminUserDetail;
    currentAdminId: string;
}) {
    const router = useRouter();
    const { profile, auth, subscription, payments, wallet } = detail;

    const [pending, startTransition] = useTransition();
    const [busy, setBusy] = useState<string | null>(null);
    const [feedback, setFeedback] = useState<{ ok: boolean; msg: string } | null>(null);

    const [role, setRole] = useState(profile.role ?? "user");
    const [grantPlan, setGrantPlan] = useState<"voraz" | "ai">("voraz");
    const [grantMonths, setGrantMonths] = useState<string>("12");
    const [giftAmount, setGiftAmount] = useState<string>("10");
    const [deleteConfirm, setDeleteConfirm] = useState("");

    const isSelf = profile.id === currentAdminId;
    const emailConfirmed = Boolean(auth?.email_confirmed_at);
    const subActive = subscription
        ? isSubscriptionActive(subscription.status, subscription.current_period_end)
        : false;
    const hasPaypalLink = Boolean(subscription?.provider_subscription_id);

    const run = (key: string, fn: () => Promise<{ success: boolean; error?: string }>, okMsg: string) => {
        setBusy(key);
        setFeedback(null);
        startTransition(async () => {
            const res = await fn();
            setBusy(null);
            if (res.success) {
                setFeedback({ ok: true, msg: okMsg });
                router.refresh();
            } else {
                setFeedback({ ok: false, msg: res.error ?? "No se pudo completar la acción." });
            }
        });
    };

    return (
        <div className="space-y-6">
            <Link
                href="/app/admin/usuarios"
                className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-teal-dark transition-colors"
            >
                <ArrowLeft className="w-4 h-4" /> Volver a Usuarios
            </Link>

            {/* Cabecera */}
            <div className="flex items-center gap-4 pb-4 border-b border-teal/10">
                <Avatar
                    src={profile.avatar_url ?? undefined}
                    fallback={profile.username ? profile.username.substring(0, 2).toUpperCase() : "US"}
                    size="lg"
                    className="bg-teal/10 text-teal-dark border-teal/20"
                />
                <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <h1 className="text-2xl font-bold tracking-tight truncate">
                            {profile.full_name || "Sin nombre"}
                        </h1>
                        {roleBadge(profile.role)}
                    </div>
                    <p className="text-muted-foreground text-sm">
                        {profile.username ? `@${profile.username} · ` : ""}
                        {auth?.email ?? profile.email ?? "sin email"}
                    </p>
                </div>
            </div>

            {feedback && (
                <div
                    className={`flex items-center gap-2 text-sm rounded-lg px-4 py-3 ${
                        feedback.ok
                            ? "bg-teal/10 text-teal-dark border border-teal/20"
                            : "bg-coral/10 text-coral border border-coral/20"
                    }`}
                >
                    {feedback.ok ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                    {feedback.msg}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Cuenta */}
                <Card title="Cuenta" icon={<User className="w-4 h-4 text-teal" />}>
                    <dl className="space-y-3 text-sm">
                        <div className="flex items-center justify-between gap-3">
                            <dt className="text-muted-foreground flex items-center gap-1.5">
                                <Mail className="w-3.5 h-3.5" /> Email
                            </dt>
                            <dd className="font-medium text-right truncate">{auth?.email ?? profile.email ?? "—"}</dd>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                            <dt className="text-muted-foreground">Verificado</dt>
                            <dd>
                                {emailConfirmed ? (
                                    <span className="inline-flex items-center gap-1 text-xs text-teal-dark bg-teal/15 py-1 px-2 rounded-md">
                                        <BadgeCheck className="w-3.5 h-3.5" /> Sí
                                    </span>
                                ) : (
                                    <button
                                        disabled={pending}
                                        onClick={() =>
                                            run(
                                                "confirm-email",
                                                () => confirmEmailAction(profile.id),
                                                "Email confirmado.",
                                            )
                                        }
                                        className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-100 hover:bg-amber-200 py-1 px-2 rounded-md transition-colors disabled:opacity-50"
                                    >
                                        {busy === "confirm-email" ? (
                                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                        ) : (
                                            <BadgeCheck className="w-3.5 h-3.5" />
                                        )}
                                        Confirmar ahora
                                    </button>
                                )}
                            </dd>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                            <dt className="text-muted-foreground flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5" /> Último acceso
                            </dt>
                            <dd className="text-right">{fmtDateTime(auth?.last_sign_in_at ?? null)}</dd>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                            <dt className="text-muted-foreground flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5" /> Alta
                            </dt>
                            <dd className="text-right">{fmtDate(auth?.created_at ?? profile.created_at)}</dd>
                        </div>
                        <div className="flex items-center justify-between gap-3 pt-2 border-t border-teal/5">
                            <dt className="text-muted-foreground">Onboarding</dt>
                            <dd>
                                <button
                                    disabled={pending}
                                    onClick={() =>
                                        run(
                                            "onboarding",
                                            () => setOnboardingAction(profile.id, !profile.onboarding_completed),
                                            profile.onboarding_completed
                                                ? "Onboarding marcado como pendiente."
                                                : "Onboarding marcado como completado.",
                                        )
                                    }
                                    className="inline-flex items-center gap-1 text-xs font-medium py-1 px-2 rounded-md border border-input hover:bg-muted transition-colors disabled:opacity-50"
                                >
                                    {busy === "onboarding" && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                                    {profile.onboarding_completed ? "Completado — marcar pendiente" : "Pendiente — marcar completado"}
                                </button>
                            </dd>
                        </div>
                    </dl>
                </Card>

                {/* Rol */}
                <Card title="Rol y permisos" icon={<Shield className="w-4 h-4 text-teal" />}>
                    <p className="text-sm text-muted-foreground mb-3">
                        <b>Usuario</b>: acceso normal. <b>Editor</b>: gestiona contenido. <b>Admin</b>: acceso total al panel.
                    </p>
                    <div className="flex items-center gap-2">
                        <select
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                            disabled={pending || isSelf}
                            className="bg-background border border-input rounded-md text-sm px-3 py-2 focus:outline-none focus:ring-1 focus:ring-teal disabled:opacity-50"
                        >
                            <option value="user">Usuario</option>
                            <option value="editor">Editor</option>
                            <option value="admin">Admin</option>
                        </select>
                        <button
                            disabled={pending || isSelf || role === (profile.role ?? "user")}
                            onClick={() =>
                                run("role", () => updateUserRoleAction(profile.id, role), "Rol actualizado.")
                            }
                            className="inline-flex items-center gap-1.5 text-sm font-medium bg-teal text-white py-2 px-4 rounded-md hover:bg-teal-dark transition-colors disabled:opacity-40"
                        >
                            {busy === "role" && <Loader2 className="w-4 h-4 animate-spin" />}
                            Guardar rol
                        </button>
                    </div>
                    {isSelf && (
                        <p className="text-xs text-muted-foreground mt-2">No puedes cambiar tu propio rol.</p>
                    )}
                </Card>

                {/* Suscripción */}
                <Card title="Suscripción" icon={<CreditCard className="w-4 h-4 text-teal" />}>
                    {subscription ? (
                        <dl className="space-y-2 text-sm mb-4">
                            <div className="flex justify-between">
                                <dt className="text-muted-foreground">Plan</dt>
                                <dd className="font-medium">{planLabel(subscription.plan)}</dd>
                            </div>
                            <div className="flex justify-between items-center">
                                <dt className="text-muted-foreground">Estado</dt>
                                <dd>
                                    <span
                                        className={`text-xs font-medium py-0.5 px-2 rounded ${subscriptionStatusClasses(
                                            subscription.status,
                                        )}`}
                                    >
                                        {subscriptionStatusLabel(subscription.status)}
                                        {subActive ? "" : " · sin acceso"}
                                    </span>
                                </dd>
                            </div>
                            <div className="flex justify-between">
                                <dt className="text-muted-foreground">Periodo</dt>
                                <dd>{periodLabel(subscription.period)}</dd>
                            </div>
                            <div className="flex justify-between">
                                <dt className="text-muted-foreground">Renueva / vence</dt>
                                <dd>{fmtDate(subscription.current_period_end)}</dd>
                            </div>
                            <div className="flex justify-between">
                                <dt className="text-muted-foreground">Proveedor</dt>
                                <dd className="capitalize">{subscription.provider}</dd>
                            </div>
                        </dl>
                    ) : (
                        <p className="text-sm text-muted-foreground mb-4">
                            Sin suscripción. Plan actual: <b>Gratis</b>.
                        </p>
                    )}

                    {hasPaypalLink && (
                        <div className="flex items-start gap-2 text-xs bg-amber-50 text-amber-800 border border-amber-200 rounded-lg px-3 py-2 mb-4">
                            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                            <span>
                                Suscripción vinculada a PayPal. Conceder o revocar aquí <b>no cancela el cobro en PayPal</b>;
                                hazlo también en el panel de PayPal si procede.
                            </span>
                        </div>
                    )}

                    <div className="rounded-lg border border-teal/10 bg-muted/30 p-4 space-y-3">
                        <p className="text-sm font-medium flex items-center gap-1.5">
                            <Gift className="w-4 h-4 text-teal" /> Conceder plan manual
                        </p>
                        <div className="flex flex-wrap items-center gap-2">
                            <select
                                value={grantPlan}
                                onChange={(e) => setGrantPlan(e.target.value as "voraz" | "ai")}
                                disabled={pending}
                                className="bg-background border border-input rounded-md text-sm px-3 py-2 focus:outline-none focus:ring-1 focus:ring-teal disabled:opacity-50"
                            >
                                <option value="voraz">Lector Voraz</option>
                                <option value="ai">Bibliófilo</option>
                            </select>
                            <select
                                value={grantMonths}
                                onChange={(e) => setGrantMonths(e.target.value)}
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
                                onClick={() =>
                                    run(
                                        "grant",
                                        () =>
                                            grantPlanAction(
                                                profile.id,
                                                grantPlan,
                                                grantMonths === "0" ? null : Number(grantMonths),
                                            ),
                                        "Plan concedido.",
                                    )
                                }
                                className="inline-flex items-center gap-1.5 text-sm font-medium bg-teal text-white py-2 px-4 rounded-md hover:bg-teal-dark transition-colors disabled:opacity-40"
                            >
                                {busy === "grant" && <Loader2 className="w-4 h-4 animate-spin" />}
                                Conceder
                            </button>
                        </div>
                        {subscription && subActive && (
                            <button
                                disabled={pending}
                                onClick={async () => {
                                    if (!(await confirmDialog({ title: "Revocar acceso", message: "¿Revocar el acceso de este usuario? La suscripción quedará expirada.", confirmLabel: "Revocar", tone: "danger" })))
                                        return;
                                    run("revoke", () => revokePlanAction(profile.id), "Acceso revocado.");
                                }}
                                className="inline-flex items-center gap-1.5 text-sm font-medium text-coral hover:underline disabled:opacity-40"
                            >
                                {busy === "revoke" && <Loader2 className="w-4 h-4 animate-spin" />}
                                Revocar acceso
                            </button>
                        )}
                    </div>
                </Card>

                {/* Wordix */}
                <Card title="Wordix" icon={<Coins className="w-4 h-4 text-teal" />}>
                    <div className="mb-4 flex items-end justify-between gap-3">
                        <div>
                            <p className="text-xs text-muted-foreground">Saldo actual</p>
                            <p className="text-3xl font-serif font-medium text-teal-dark">{wallet?.balance ?? 0} <span className="text-base font-sans text-muted-foreground">Wordix</span></p>
                        </div>
                        <p className="text-xs text-muted-foreground">Ganados en total: {wallet?.lifetimeEarned ?? 0}</p>
                    </div>

                    <div className="rounded-lg border border-teal/10 bg-muted/30 p-4 space-y-3">
                        <p className="text-sm font-medium flex items-center gap-1.5">
                            <Gift className="w-4 h-4 text-teal" /> Regalar Wordix
                        </p>
                        <div className="flex flex-wrap items-center gap-2">
                            {[5, 10, 25, 50].map((n) => (
                                <button
                                    key={n}
                                    type="button"
                                    disabled={pending}
                                    onClick={() => setGiftAmount(String(n))}
                                    className={`rounded-md border px-2.5 py-1 text-xs font-medium transition-colors disabled:opacity-50 ${
                                        giftAmount === String(n)
                                            ? "border-teal bg-teal/10 text-teal-dark"
                                            : "border-input hover:bg-muted"
                                    }`}
                                >
                                    +{n}
                                </button>
                            ))}
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            <input
                                type="number"
                                min={1}
                                max={10000}
                                value={giftAmount}
                                onChange={(e) => setGiftAmount(e.target.value)}
                                disabled={pending}
                                className="w-28 bg-background border border-input rounded-md text-sm px-3 py-2 focus:outline-none focus:ring-1 focus:ring-teal disabled:opacity-50"
                            />
                            <button
                                disabled={pending || !(Number(giftAmount) > 0)}
                                onClick={() =>
                                    run(
                                        "gift-coins",
                                        () => giftCoinsAction(profile.id, Number(giftAmount)),
                                        `Se han regalado ${Number(giftAmount)} Wordix.`,
                                    )
                                }
                                className="inline-flex items-center gap-1.5 text-sm font-medium bg-teal text-white py-2 px-4 rounded-md hover:bg-teal-dark transition-colors disabled:opacity-40"
                            >
                                {busy === "gift-coins" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Coins className="w-4 h-4" />}
                                Regalar
                            </button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Se añaden al instante como “Ajuste de Wordelia” en su historial. 1 Wordix = 1&nbsp;€ dentro de la app.
                        </p>
                    </div>
                </Card>

                {/* Pagos */}
                <Card title="Historial de pagos" icon={<CreditCard className="w-4 h-4 text-teal" />}>
                    {payments.length === 0 ? (
                        <p className="text-sm text-muted-foreground">Sin pagos registrados.</p>
                    ) : (
                        <div className="overflow-x-auto -mx-1">
                            <table className="w-full text-sm">
                                <thead className="text-muted-foreground text-left">
                                    <tr className="border-b border-teal/10">
                                        <th className="py-2 pr-3 font-medium">Fecha</th>
                                        <th className="py-2 pr-3 font-medium">Concepto</th>
                                        <th className="py-2 pr-3 font-medium text-right">Importe</th>
                                        <th className="py-2 font-medium">Estado</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-teal/5">
                                    {payments.map((p) => (
                                        <tr key={p.id}>
                                            <td className="py-2 pr-3 whitespace-nowrap text-muted-foreground">
                                                {fmtDate(p.created_at)}
                                            </td>
                                            <td className="py-2 pr-3 capitalize">{p.product_type ?? "—"}</td>
                                            <td className="py-2 pr-3 text-right font-medium whitespace-nowrap">
                                                {fmtMoney(p.amount_cents, p.currency)}
                                            </td>
                                            <td className="py-2 capitalize text-muted-foreground">{p.status}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </Card>
            </div>

            {/* Zona de peligro */}
            <Card title="Zona de peligro" icon={<Trash2 className="w-4 h-4" />} danger>
                <p className="text-sm text-muted-foreground mb-3">
                    Eliminar la cuenta borra el usuario y su perfil de forma permanente. Esta acción no se puede deshacer.
                </p>
                {isSelf ? (
                    <p className="text-sm text-muted-foreground">No puedes eliminar tu propia cuenta.</p>
                ) : profile.role === "admin" ? (
                    <p className="text-sm text-muted-foreground">
                        No se puede eliminar a otro administrador. Baja primero su rol.
                    </p>
                ) : (
                    <div className="flex flex-wrap items-center gap-2">
                        <input
                            type="text"
                            value={deleteConfirm}
                            onChange={(e) => setDeleteConfirm(e.target.value)}
                            placeholder='Escribe "ELIMINAR"'
                            className="bg-background border border-coral/30 rounded-md text-sm px-3 py-2 focus:outline-none focus:ring-1 focus:ring-coral"
                        />
                        <button
                            disabled={pending || deleteConfirm !== "ELIMINAR"}
                            onClick={() =>
                                run("delete", async () => {
                                    const res = await deleteUserAction(profile.id);
                                    if (res.success) router.push("/app/admin/usuarios");
                                    return res;
                                }, "Cuenta eliminada.")
                            }
                            className="inline-flex items-center gap-1.5 text-sm font-medium bg-coral text-white py-2 px-4 rounded-md hover:bg-coral/90 transition-colors disabled:opacity-40"
                        >
                            {busy === "delete" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                            Eliminar cuenta
                        </button>
                    </div>
                )}
            </Card>
        </div>
    );
}
