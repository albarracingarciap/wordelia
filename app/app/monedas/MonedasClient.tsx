"use client";

import * as React from "react";
import Link from "next/link";
import { Copy, Check, Gift, Users, Coins, Clock, ArrowUpRight, ArrowDownRight, Share2, Loader2, CalendarHeart } from "lucide-react";
import { COIN_REASON_LABELS, TRANSACTIONS_PAGE_SIZE } from "@/lib/coins";
import { getMyTransactions } from "./actions";
import type { CoinWallet, ReferralInfo, CoinTransaction } from "./actions";

function formatDate(iso: string) {
    try {
        return new Date(iso).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" });
    } catch {
        return "";
    }
}

export default function MonedasClient({
    wallet,
    referral,
    transactions,
}: {
    wallet: CoinWallet;
    referral: ReferralInfo | null;
    transactions: CoinTransaction[];
}) {
    const [copied, setCopied] = React.useState(false);
    const [txs, setTxs] = React.useState<CoinTransaction[]>(transactions);
    const [hasMore, setHasMore] = React.useState(transactions.length >= TRANSACTIONS_PAGE_SIZE);
    const [loadingMore, setLoadingMore] = React.useState(false);

    const loadMore = async () => {
        setLoadingMore(true);
        const next = await getMyTransactions(TRANSACTIONS_PAGE_SIZE, txs.length);
        setLoadingMore(false);
        setTxs((prev) => [...prev, ...next]);
        if (next.length < TRANSACTIONS_PAGE_SIZE) setHasMore(false);
    };

    const copyLink = async () => {
        if (!referral) return;
        try {
            await navigator.clipboard.writeText(referral.url);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            /* noop */
        }
    };

    const share = async () => {
        if (!referral) return;
        const text = "Te invito a Wordelia, mi comunidad de lectura. Únete con mi enlace:";
        if (typeof navigator !== "undefined" && "share" in navigator) {
            try {
                await navigator.share({ title: "Únete a Wordelia", text, url: referral.url });
                return;
            } catch {
                /* usuario canceló → cae a copiar */
            }
        }
        await copyLink();
    };

    return (
        <div className="grid gap-6 lg:grid-cols-3">
            {/* Columna principal */}
            <div className="lg:col-span-2 space-y-6">
                {/* Saldo */}
                <div className="rounded-2xl border border-teal/10 bg-gradient-to-br from-teal to-teal-dark p-6 text-white shadow-sm">
                    <div className="flex items-center gap-2 text-white/70 text-sm font-medium">
                        <Coins className="h-4 w-4" /> Tu saldo
                    </div>
                    <div className="mt-2 flex items-end gap-2">
                        <span className="text-5xl font-serif font-medium leading-none">{wallet.balance}</span>
                        <span className="mb-1 text-lg text-white/80">monedas</span>
                    </div>
                    <p className="mt-3 text-sm text-white/60">
                        Has ganado {wallet.lifetimeEarned} monedas en total. Cada moneda equivale a 1&nbsp;€ dentro de Wordelia.
                    </p>
                </div>

                {/* Invitar */}
                <div className="rounded-2xl border border-teal/10 bg-card p-6 shadow-sm">
                    <div className="flex items-center gap-2 text-foreground font-medium">
                        <Gift className="h-5 w-5 text-coral" /> Invita a tus amigos
                    </div>
                    <p className="mt-1.5 text-sm text-muted-foreground">
                        Comparte tu enlace. Cuando un amigo se registre y se una a su primer club, ganáis
                        <span className="font-semibold text-teal"> 5 monedas cada uno</span>.
                    </p>

                    {referral ? (
                        <>
                            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                                <div className="flex-1 truncate rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-muted-foreground">
                                    {referral.url}
                                </div>
                                <button
                                    onClick={copyLink}
                                    className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-teal/20 bg-teal/5 px-4 py-2.5 text-sm font-medium text-teal transition-colors hover:bg-teal/10"
                                >
                                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                    {copied ? "Copiado" : "Copiar"}
                                </button>
                                <button
                                    onClick={share}
                                    className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-teal px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-teal-dark"
                                >
                                    <Share2 className="h-4 w-4" /> Compartir
                                </button>
                            </div>

                            <div className="mt-5 grid grid-cols-2 gap-3">
                                <div className="rounded-xl border border-teal/10 bg-cream/40 p-3">
                                    <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                                        <Clock className="h-3.5 w-3.5" /> Pendientes
                                    </div>
                                    <p className="mt-1 text-2xl font-serif text-teal">{referral.pending}</p>
                                </div>
                                <div className="rounded-xl border border-teal/10 bg-cream/40 p-3">
                                    <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                                        <Users className="h-3.5 w-3.5" /> Cualificados
                                    </div>
                                    <p className="mt-1 text-2xl font-serif text-teal">{referral.rewarded}</p>
                                </div>
                            </div>

                            {referral.referred.length > 0 && (
                                <div className="mt-4 space-y-1.5">
                                    <p className="text-xs font-bold uppercase tracking-wide text-grey/40">Tus invitados</p>
                                    {referral.referred.map((r, i) => (
                                        <div key={i} className="flex items-center justify-between rounded-lg border border-teal/5 bg-background px-3 py-2 text-sm">
                                            <span className="text-foreground">{r.username ? `@${r.username}` : "Nuevo lector"}</span>
                                            <span className={`text-xs font-medium ${r.status === "rewarded" ? "text-teal" : "text-muted-foreground"}`}>
                                                {r.status === "rewarded" ? "Cualificado · +5" : "Pendiente de su 1er club"}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    ) : (
                        <p className="mt-4 text-sm text-muted-foreground">No se pudo cargar tu enlace de invitación. Recarga la página.</p>
                    )}
                </div>
            </div>

            {/* Histórico */}
            <div className="space-y-6">
                <div className="rounded-2xl border border-teal/10 bg-card p-6 shadow-sm">
                    <div className="flex items-center gap-2 text-foreground font-medium">
                        <Coins className="h-5 w-5 text-teal" /> Movimientos
                    </div>
                    {txs.length === 0 ? (
                        <p className="mt-3 text-sm text-muted-foreground">
                            Aún no tienes movimientos. Invita a un amigo para empezar a ganar monedas.
                        </p>
                    ) : (
                        <>
                            <ul className="mt-4 space-y-2">
                                {txs.map((t) => {
                                    const positive = t.amount >= 0;
                                    return (
                                        <li key={t.id} className="flex items-center gap-3">
                                            <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${positive ? "bg-teal/10 text-teal" : "bg-coral/10 text-coral"}`}>
                                                {positive ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-sm text-foreground">{COIN_REASON_LABELS[t.reason] ?? t.reason}</p>
                                                <p className="text-xs text-muted-foreground">{formatDate(t.createdAt)}</p>
                                            </div>
                                            <span className={`text-sm font-semibold ${positive ? "text-teal" : "text-coral"}`}>
                                                {positive ? "+" : ""}{t.amount}
                                            </span>
                                        </li>
                                    );
                                })}
                            </ul>
                            {hasMore && (
                                <button
                                    onClick={loadMore}
                                    disabled={loadingMore}
                                    className="mt-4 inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-teal/15 bg-teal/5 py-2 text-sm font-medium text-teal transition-colors hover:bg-teal/10 disabled:opacity-50"
                                >
                                    {loadingMore ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Cargar más
                                </button>
                            )}
                        </>
                    )}
                </div>

                <Link
                    href="/app/eventos"
                    className="block rounded-2xl border border-teal/15 bg-gradient-to-br from-cream/60 to-white p-5 shadow-sm transition-colors hover:border-teal/30"
                >
                    <div className="flex items-center gap-2 text-foreground font-medium">
                        <CalendarHeart className="h-5 w-5 text-coral" /> Eventos Wordelia
                    </div>
                    <p className="mt-1.5 text-sm text-muted-foreground">
                        Gasta tus monedas en los clubs oficiales y en los encuentros que organizamos para la comunidad.
                    </p>
                    <span className="mt-2 inline-block text-sm font-medium text-teal">Ver eventos →</span>
                </Link>
            </div>
        </div>
    );
}
