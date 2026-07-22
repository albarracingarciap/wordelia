"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Coins, Loader2, Check, CalendarClock, MapPin, Users, Ticket } from "lucide-react";
import { claimEventTicket, type PublicEvent } from "./actions";

function formatWhen(iso: string) {
    try {
        return new Date(iso).toLocaleString("es-ES", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" });
    } catch { return ""; }
}

function EventCard({ event, balance, onClaimed }: { event: PublicEvent; balance: number; onClaimed: (newBalance: number) => void }) {
    const router = useRouter();
    const [busy, setBusy] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const [claimed, setClaimed] = React.useState(event.hasTicket);

    const free = event.priceCoins === 0;
    const enough = balance >= event.priceCoins;

    const claim = async () => {
        setBusy(true); setError(null);
        const res = await claimEventTicket(event.id);
        setBusy(false);
        if ("error" in res && res.error) { setError(res.error); return; }
        setClaimed(true);
        if ("newBalance" in res && typeof res.newBalance === "number") onClaimed(res.newBalance);
        router.refresh();
    };

    return (
        <div className="overflow-hidden rounded-2xl border border-teal/10 bg-card shadow-sm">
            {event.coverUrl && (
                <div className="relative h-40 w-full bg-teal/5">
                    <Image src={event.coverUrl} alt="" fill className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" />
                </div>
            )}
            <div className="p-5">
                <h3 className="font-serif text-lg font-medium text-teal">{event.title}</h3>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1 capitalize"><CalendarClock className="h-3.5 w-3.5" /> {formatWhen(event.startsAt)}</span>
                    {event.location && <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {event.location}</span>}
                    {event.capacity != null && (
                        <span className="inline-flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {event.taken}/{event.capacity}</span>
                    )}
                </div>
                {event.description && <p className="mt-3 text-sm text-muted-foreground line-clamp-3">{event.description}</p>}

                <div className="mt-4 flex items-center justify-between gap-3">
                    <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-teal">
                        <Coins className="h-4 w-4" /> {free ? "Gratis" : `${event.priceCoins} monedas`}
                    </span>

                    {claimed ? (
                        <span className="inline-flex items-center gap-1.5 rounded-xl bg-teal/10 px-4 py-2 text-sm font-medium text-teal">
                            <Check className="h-4 w-4" /> Tienes entrada
                        </span>
                    ) : event.soldOut ? (
                        <span className="rounded-xl bg-grey/10 px-4 py-2 text-sm font-medium text-grey/50">Aforo completo</span>
                    ) : free || enough ? (
                        <button onClick={claim} disabled={busy}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-teal px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-teal-dark disabled:opacity-50">
                            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Ticket className="h-4 w-4" />}
                            {free ? "Conseguir entrada" : `Canjear ${event.priceCoins}`}
                        </button>
                    ) : (
                        <Link href="/app/monedas"
                            className="inline-flex items-center gap-1.5 rounded-xl border border-teal/20 bg-teal/5 px-4 py-2 text-sm font-medium text-teal transition-colors hover:bg-teal/10">
                            Te faltan {event.priceCoins - balance}
                        </Link>
                    )}
                </div>
                {error && <p className="mt-2 text-sm font-medium text-coral">{error}</p>}
            </div>
        </div>
    );
}

export default function EventosClient({ events, balance: initialBalance }: { events: PublicEvent[]; balance: number }) {
    const [balance, setBalance] = React.useState(initialBalance);

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-2 rounded-xl border border-teal/10 bg-cream/40 px-4 py-3 text-sm">
                <Coins className="h-4 w-4 text-teal" />
                <span className="text-foreground">Tu saldo: <span className="font-semibold text-teal">{balance} monedas</span></span>
                <Link href="/app/monedas" className="ml-auto text-teal underline-offset-2 hover:underline">Ganar más</Link>
            </div>

            {events.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-teal/20 bg-cream/30 p-10 text-center">
                    <p className="text-sm text-muted-foreground">
                        Todavía no hay eventos programados. Vuelve pronto: iremos anunciando encuentros para la comunidad.
                    </p>
                </div>
            ) : (
                <div className="grid gap-5 sm:grid-cols-2">
                    {events.map((e) => (
                        <EventCard key={e.id} event={e} balance={balance} onClaimed={setBalance} />
                    ))}
                </div>
            )}
        </div>
    );
}
