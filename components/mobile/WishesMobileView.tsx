"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarDays, ChevronRight, Gift, Heart, Monitor, Plus, UserRound } from "lucide-react";
import type { WishlistData } from "@/app/app/wishes/wishlist-actions";
import type { ReservedItemData } from "@/app/app/wishes/gift-actions";
import { CreateWishlistModal } from "@/components/wishes/CreateWishlistModal";
import { formatWhen } from "./format";

const PRIVACY_LABEL: Record<WishlistData["privacy"], string> = {
    public: "Pública",
    shared: "Compartida",
    private: "Privada",
};

interface WishesMobileViewProps {
    wishlists: WishlistData[];
    reservations: ReservedItemData[];
}

export function WishesMobileView({ wishlists, reservations }: WishesMobileViewProps) {
    const router = useRouter();
    const [createOpen, setCreateOpen] = React.useState(false);
    // Lo que aún tengo que comprar primero; lo comprado después.
    const pendingGifts = reservations.filter((r) => r.status === "RESERVED");
    const boughtGifts = reservations.filter((r) => r.status === "PURCHASED");

    return (
        <div className="space-y-7">
            <CreateWishlistModal
                isOpen={createOpen}
                onClose={() => setCreateOpen(false)}
                onSuccess={() => {
                    setCreateOpen(false);
                    router.refresh();
                }}
            />

            <header className="flex items-end justify-between gap-3">
                <h1 className="text-3xl font-bold text-teal">Deseos</h1>
                {wishlists.length > 0 && (
                    <button
                        type="button"
                        onClick={() => setCreateOpen(true)}
                        className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-sm font-semibold text-teal shadow-sm ring-1 ring-teal/10"
                    >
                        <Plus className="h-4 w-4" /> Nueva lista
                    </button>
                )}
            </header>

            <section className="space-y-3">
                <h2 className="text-sm font-bold uppercase tracking-wider text-grey/45">Mis listas</h2>
                {wishlists.length === 0 ? (
                    <div className="rounded-3xl bg-white p-6 text-center shadow-sm ring-1 ring-teal/10">
                        <Heart className="mx-auto mb-3 h-10 w-10 text-coral/50" />
                        <p className="text-lg font-bold text-teal-dark">Aún no tienes listas de deseos</p>
                        <p className="mt-1 text-sm text-grey/60">
                            Crea una para tu cumpleaños, Navidad o simplemente para no olvidar lo que quieres leer, y compártela.
                        </p>
                        <button
                            type="button"
                            onClick={() => setCreateOpen(true)}
                            className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-teal font-bold text-white"
                        >
                            <Plus className="h-5 w-5" /> Crear mi primera lista
                        </button>
                    </div>
                ) : (
                    <ul className="space-y-3">
                        {wishlists.map((w) => (
                            <li key={w.id}>
                                <WishlistRow wishlist={w} />
                            </li>
                        ))}
                    </ul>
                )}
            </section>

            {reservations.length > 0 && (
                <section className="space-y-3">
                    <h2 className="flex items-center gap-1.5 text-sm font-bold uppercase tracking-wider text-grey/45">
                        <Gift className="h-4 w-4" /> Regalos que vas a hacer
                    </h2>
                    <ul className="space-y-2">
                        {[...pendingGifts, ...boughtGifts].map((r) => (
                            <li key={r.id}>
                                <ReservationRow item={r} />
                            </li>
                        ))}
                    </ul>
                </section>
            )}

            <footer className="flex flex-col items-center gap-3 pt-2 text-sm font-medium text-grey/55">
                <Link href="/app/wishes?tab=gifts" className="inline-flex items-center gap-1.5 text-teal">
                    <UserRound className="h-4 w-4" /> Personas e ideas de regalo
                </Link>
                <Link href="/app/wishes" className="inline-flex items-center gap-1.5">
                    <Monitor className="h-4 w-4" /> Ver versión completa
                </Link>
            </footer>
        </div>
    );
}

function WishlistRow({ wishlist: w }: { wishlist: WishlistData }) {
    return (
        <Link
            href={`/m/deseos/${w.id}`}
            className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-sm ring-1 ring-teal/10 active:bg-teal/5"
        >
            <CoverStack covers={w.coverImages} emoji={w.emoji} />
            <div className="min-w-0 flex-1">
                <p className="truncate font-bold text-teal-dark">
                    <span className="mr-1">{w.emoji}</span>
                    {w.name}
                </p>
                <p className="mt-0.5 text-xs text-grey/55">
                    {w.bookCount} {w.bookCount === 1 ? "libro" : "libros"} · {PRIVACY_LABEL[w.privacy]}
                </p>
                {w.targetDate && (
                    <p className="mt-1 inline-flex items-center gap-1 rounded-full bg-coral/10 px-2 py-0.5 text-[11px] font-bold text-coral">
                        <CalendarDays className="h-3 w-3" /> Para el {formatWhen(w.targetDate, false)}
                    </p>
                )}
            </div>
            <ChevronRight className="h-5 w-5 shrink-0 text-grey/30" />
        </Link>
    );
}

function CoverStack({ covers, emoji }: { covers: string[]; emoji: string }) {
    if (covers.length === 0) {
        return (
            <div className="flex h-16 w-12 shrink-0 items-center justify-center rounded-lg bg-teal/5 text-2xl">{emoji}</div>
        );
    }
    return (
        <div className="relative h-16 w-16 shrink-0">
            {covers.slice(0, 3).map((src, i) => (
                <div
                    key={src + i}
                    className="absolute top-0 h-16 w-11 overflow-hidden rounded-md bg-teal/5 shadow ring-1 ring-black/5"
                    style={{ left: i * 6, zIndex: 3 - i, transform: `rotate(${(i - 1) * 4}deg)` }}
                >
                    <Image src={src} alt="" fill sizes="44px" className="object-cover" />
                </div>
            ))}
        </div>
    );
}

function ReservationRow({ item }: { item: ReservedItemData }) {
    const bought = item.status === "PURCHASED";
    return (
        <Link
            href={`/app/wishes/${item.wishlistId}?view=guest`}
            className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-sm ring-1 ring-teal/10 active:bg-teal/5"
        >
            <div className="relative h-14 w-10 shrink-0 overflow-hidden rounded-md bg-teal/5">
                {item.coverUrl && <Image src={item.coverUrl} alt="" fill sizes="40px" className="object-cover" />}
            </div>
            <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-teal-dark">{item.title}</p>
                <p className="truncate text-xs text-grey/55">Lista «{item.wishlistName}»</p>
            </div>
            <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold ${bought ? "bg-teal/10 text-teal" : "bg-coral/10 text-coral"}`}
            >
                {bought ? "Comprado" : "Por comprar"}
            </span>
        </Link>
    );
}
