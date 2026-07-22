"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Coins, Loader2, CreditCard, Minus, Plus } from "lucide-react";
import { joinOfficialClubWithCoins } from "@/app/app/clubs/[id]/actions";
import { getMyWallet } from "@/app/app/monedas/actions";
import { PayPalProvider, PayPalCheckout } from "@/components/payments/PayPalCheckout";
import { formatClubPrice } from "@/components/clubes/format";

// Opciones de alta para un club oficial de pago (no-miembros):
//  1. cubrir el total con monedas (si hay saldo),
//  2. pagar con tarjeta/PayPal, aplicando opcionalmente monedas como descuento
//     (queda siempre ≥ 1 € para PayPal).
// El beneficio fundador (gratis) se aplica en otro flujo.
export function JoinOfficialClubPayment({
    clubId,
    price,
    currency,
}: {
    clubId: string;
    price: number;
    currency?: string | null;
}) {
    const router = useRouter();
    const [balance, setBalance] = React.useState<number | null>(null);
    const [applied, setApplied] = React.useState(0);
    const [coinsBusy, setCoinsBusy] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);

    React.useEffect(() => {
        let active = true;
        getMyWallet().then((w) => { if (active) setBalance(w.balance); });
        return () => { active = false; };
    }, []);

    const ceilPrice = Math.ceil(price);
    // Máximo de monedas aplicables como descuento: saldo, y dejando ≥ 1 € a PayPal.
    const maxApplicable = balance == null ? 0 : Math.max(0, Math.min(balance, Math.floor(price - 1)));
    const canFullCoins = balance != null && balance >= ceilPrice;
    const remainder = Math.max(0, price - applied);

    // Reajusta si el máximo baja (p.ej. tras cargar el saldo).
    React.useEffect(() => {
        setApplied((a) => Math.min(a, maxApplicable));
    }, [maxApplicable]);

    const payFullCoins = async () => {
        setCoinsBusy(true); setError(null);
        const res = await joinOfficialClubWithCoins(clubId);
        setCoinsBusy(false);
        if ("error" in res && res.error) { setError(res.error); return; }
        router.refresh();
    };

    const cur = currency ?? "EUR";

    return (
        <div className="space-y-3">
            <p className="text-sm font-bold uppercase tracking-wide text-grey/40">Únete a este club</p>

            {/* Opción 1: cubrir todo con monedas */}
            {canFullCoins && (
                <div className="rounded-2xl border border-teal/15 bg-gradient-to-br from-cream/60 to-white p-5 shadow-sm">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <div className="flex items-center gap-2 font-medium text-foreground">
                                <Coins className="h-5 w-5 text-teal" /> Cubrir con monedas
                            </div>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Usa {ceilPrice} monedas y entra sin pagar. Tu saldo: {balance}.
                            </p>
                        </div>
                        <button
                            onClick={payFullCoins}
                            disabled={coinsBusy}
                            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl bg-teal px-6 py-3 font-semibold text-white transition-colors hover:bg-teal-dark disabled:opacity-50"
                        >
                            {coinsBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Coins className="h-4 w-4" />}
                            Unirme por {ceilPrice}
                        </button>
                    </div>
                </div>
            )}

            {/* Opción 2: pagar (con descuento opcional en monedas) */}
            <div className="rounded-2xl border border-teal/15 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-2 font-medium text-foreground">
                    <CreditCard className="h-5 w-5 text-teal" /> Pagar {formatClubPrice(remainder, cur)}
                </div>
                <p className="mt-1 text-sm text-muted-foreground">Con tarjeta o tu cuenta de PayPal.</p>

                {maxApplicable > 0 && (
                    <div className="mt-3 rounded-xl border border-teal/10 bg-cream/40 p-3">
                        <div className="flex items-center justify-between gap-3">
                            <span className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground">
                                <Coins className="h-4 w-4 text-teal" /> Aplicar monedas de descuento
                            </span>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setApplied((a) => Math.max(0, a - 1))}
                                    disabled={applied <= 0}
                                    className="rounded-lg border border-teal/20 p-1.5 text-teal transition-colors hover:bg-teal/5 disabled:opacity-40"
                                    aria-label="Menos monedas"
                                >
                                    <Minus className="h-4 w-4" />
                                </button>
                                <span className="w-8 text-center text-sm font-semibold text-teal">{applied}</span>
                                <button
                                    onClick={() => setApplied((a) => Math.min(maxApplicable, a + 1))}
                                    disabled={applied >= maxApplicable}
                                    className="rounded-lg border border-teal/20 p-1.5 text-teal transition-colors hover:bg-teal/5 disabled:opacity-40"
                                    aria-label="Más monedas"
                                >
                                    <Plus className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                        <p className="mt-1.5 text-xs text-muted-foreground">
                            {applied > 0
                                ? <>Aplicas {applied} {applied === 1 ? "moneda" : "monedas"} · pagas {formatClubPrice(remainder, cur)} por PayPal.</>
                                : <>Puedes aplicar hasta {maxApplicable} {maxApplicable === 1 ? "moneda" : "monedas"} (siempre queda ≥ 1&nbsp;€ para PayPal).</>}
                        </p>
                    </div>
                )}

                <div className="mt-3">
                    <PayPalProvider>
                        <PayPalCheckout
                            productType="club"
                            referenceId={clubId}
                            appliedCoins={applied}
                            onSuccess={() => router.refresh()}
                        />
                    </PayPalProvider>
                </div>
            </div>

            {balance !== null && !canFullCoins && maxApplicable === 0 && (
                <p className="text-xs text-muted-foreground">
                    Invita a amigos para ganar monedas y aplicarlas como descuento.{" "}
                    <Link href="/app/monedas" className="text-teal underline-offset-2 hover:underline">Ver monedas</Link>.
                </p>
            )}
            {error && <p className="text-sm font-medium text-coral">{error}</p>}
        </div>
    );
}
