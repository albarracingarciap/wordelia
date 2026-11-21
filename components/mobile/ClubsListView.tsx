"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarClock, ChevronRight, Compass, KeyRound, Loader2, Monitor, Radio, Store, Users } from "lucide-react";
import type { MobileClubSummary } from "@/app/m/clubs/actions";
import { joinClubByCode } from "@/app/app/clubs/actions";
import { toast } from "@/components/ui/toast";
import { formatWhen } from "./format";

export function ClubsListView({ clubs }: { clubs: MobileClubSummary[] }) {
    const [joinOpen, setJoinOpen] = React.useState(false);

    return (
        <div className="space-y-6">
            <header className="flex items-end justify-between gap-3">
                <h1 className="text-3xl font-bold text-teal">Clubs</h1>
                <button
                    type="button"
                    onClick={() => setJoinOpen((v) => !v)}
                    className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-sm font-semibold text-teal shadow-sm ring-1 ring-teal/10"
                    aria-expanded={joinOpen}
                >
                    <KeyRound className="h-4 w-4" /> Tengo un código
                </button>
            </header>

            {joinOpen && <JoinByCode onDone={() => setJoinOpen(false)} />}

            {clubs.length === 0 ? (
                <section className="rounded-3xl bg-white p-6 text-center shadow-sm ring-1 ring-teal/10">
                    <Users className="mx-auto mb-3 h-10 w-10 text-teal/40" />
                    <p className="text-lg font-bold text-teal-dark">Aún no estás en ningún club</p>
                    <p className="mt-1 text-sm text-grey/60">Únete con el código que te haya dado tu librería o grupo, o explora clubs abiertos.</p>
                    <div className="mt-5 grid grid-cols-1 gap-2">
                        <button
                            type="button"
                            onClick={() => setJoinOpen(true)}
                            className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-teal font-bold text-white"
                        >
                            <KeyRound className="h-5 w-5" /> Unirme con código
                        </button>
                        <Link href="/app/clubs" className="flex h-12 items-center justify-center gap-2 rounded-2xl border border-teal/15 font-semibold text-teal">
                            <Compass className="h-5 w-5" /> Explorar clubs
                        </Link>
                    </div>
                </section>
            ) : (
                <ul className="space-y-3">
                    {clubs.map((club) => (
                        <li key={club.id}>
                            <ClubRow club={club} />
                        </li>
                    ))}
                </ul>
            )}

            <footer className="flex flex-col items-center gap-3 pt-2 text-sm font-medium text-grey/55">
                {clubs.length > 0 && (
                    <Link href="/app/clubs" className="inline-flex items-center gap-1.5">
                        <Compass className="h-4 w-4" /> Explorar más clubs
                    </Link>
                )}
                <Link href="/app/clubs" className="inline-flex items-center gap-1.5">
                    <Monitor className="h-4 w-4" /> Ver versión completa
                </Link>
            </footer>
        </div>
    );
}

function ClubRow({ club }: { club: MobileClubSummary }) {
    const cover = club.currentBook?.coverUrl || club.coverUrl;

    return (
        <Link
            href={`/m/clubs/${club.id}`}
            className="flex items-center gap-3 rounded-3xl bg-white p-3 shadow-sm ring-1 ring-teal/10 active:bg-teal/5"
        >
            <div className="relative h-20 w-14 shrink-0 overflow-hidden rounded-xl bg-cream">
                {cover ? (
                    <Image src={cover} alt="" fill className="object-cover" sizes="56px" />
                ) : (
                    <div className="flex h-full items-center justify-center text-teal/30">
                        <Users className="h-6 w-6" />
                    </div>
                )}
            </div>
            <div className="min-w-0 flex-1">
                <p className="flex items-center gap-1.5 truncate font-bold text-teal-dark">
                    {club.isLibraryClub && <Store className="h-3.5 w-3.5 shrink-0 text-coral" aria-label="Club de librería" />}
                    <span className="truncate">{club.name}</span>
                </p>
                <p className="truncate text-sm text-grey/60">
                    {club.currentBook
                        ? `${club.currentBook.status === "planned" ? "Próxima lectura: " : ""}${club.currentBook.title}`
                        : "Sin lectura activa"}
                </p>
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs">
                    {club.isPending ? (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 font-semibold text-amber-800">Solicitud pendiente</span>
                    ) : club.live ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-coral px-2 py-0.5 font-bold text-white">
                            <Radio className="h-3 w-3" /> En vivo ahora
                        </span>
                    ) : club.next ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-teal/10 px-2 py-0.5 font-semibold text-teal">
                            <CalendarClock className="h-3 w-3" /> {formatWhen(club.next.scheduledAt)}
                        </span>
                    ) : null}
                    <span className="text-grey/45">{club.memberCount} {club.memberCount === 1 ? "miembro" : "miembros"}</span>
                </div>
            </div>
            <ChevronRight className="h-5 w-5 shrink-0 text-grey/30" />
        </Link>
    );
}

function JoinByCode({ onDone }: { onDone: () => void }) {
    const router = useRouter();
    const [code, setCode] = React.useState("");
    const [busy, setBusy] = React.useState(false);
    const [error, setError] = React.useState("");

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (busy) return;
        setBusy(true);
        setError("");
        try {
            const res = await joinClubByCode(code);
            if ("error" in res && res.error) {
                setError(res.error);
                return;
            }
            if ("message" in res && res.message) toast.success(res.message);
            onDone();
            if ("status" in res && res.status !== "pending" && "clubId" in res && res.clubId) {
                router.push(`/m/clubs/${res.clubId}`);
            } else {
                router.refresh();
            }
        } finally {
            setBusy(false);
        }
    };

    return (
        <form onSubmit={submit} className="space-y-3 rounded-3xl bg-white p-4 shadow-sm ring-1 ring-teal/10">
            <label className="block text-sm font-semibold text-teal-dark" htmlFor="club-code">Código del club</label>
            <div className="flex gap-2">
                <input
                    id="club-code"
                    value={code}
                    onChange={(e) => { setError(""); setCode(e.target.value.toUpperCase()); }}
                    autoFocus
                    autoCapitalize="characters"
                    autoComplete="off"
                    placeholder="Ej. LIBRO24"
                    className="h-12 min-w-0 flex-1 rounded-2xl border border-teal/15 bg-cream/40 px-4 font-mono text-lg tracking-widest text-teal-dark outline-none focus:border-teal/40 focus:ring-2 focus:ring-teal/10"
                />
                <button
                    type="submit"
                    disabled={!code.trim() || busy}
                    className="flex h-12 items-center gap-2 rounded-2xl bg-teal px-5 font-bold text-white disabled:opacity-50"
                >
                    {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                    Unirme
                </button>
            </div>
            {error && <p className="text-sm font-medium text-coral">{error}</p>}
        </form>
    );
}
