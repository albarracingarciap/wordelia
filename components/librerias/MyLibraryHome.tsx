"use client";

import * as React from "react";
import Link from "next/link";
import { Store, CalendarClock, Users, Star, ArrowRight, MapPin, Globe, Sparkles } from "lucide-react";
import { getMyLibraryHome, type MyLibraryHomeEntry } from "@/app/librerias/my-library-actions";

function fmtWhen(iso: string) {
    return new Date(iso).toLocaleString("es-ES", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

function LibraryBlock({ entry }: { entry: MyLibraryHomeEntry }) {
    const accent = entry.brandColor || undefined;
    const href = entry.slug ? `/app/librerias/${entry.slug}` : "/app/librerias/descubrir";

    return (
        <div className="rounded-2xl border border-teal/10 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3">
                <Link href={href} className="group flex min-w-0 items-center gap-3">
                    <span
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal/5 text-teal"
                        style={accent ? { color: accent, backgroundColor: `${accent}14` } : undefined}
                    >
                        <Store className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <span className="min-w-0">
                        <span className="flex items-center gap-1.5">
                            <span className="truncate font-serif text-lg text-teal group-hover:text-coral">{entry.name}</span>
                            {entry.isPrimary && <Star className="h-3.5 w-3.5 shrink-0 fill-coral text-coral" aria-hidden="true" />}
                        </span>
                        <span className="text-xs text-grey/50">{entry.isPrimary ? "Tu librería principal" : "Tu librería"}</span>
                    </span>
                </Link>
                <Link href={href} className="shrink-0 text-grey/30 transition-colors hover:text-teal" aria-label={`Ver ${entry.name}`}>
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
            </div>

            {(entry.events.length > 0 || entry.clubs.length > 0) && (
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    {entry.events.length > 0 && (
                        <div>
                            <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-grey/40">
                                <CalendarClock className="h-3.5 w-3.5" aria-hidden="true" /> Próximos eventos
                            </p>
                            <ul className="space-y-1.5">
                                {entry.events.map((ev) => (
                                    <li key={ev.id} className="text-sm">
                                        <span className="font-medium text-teal-dark">{ev.title}</span>
                                        <span className="block text-xs text-grey/55">
                                            {ev.format === "online" ? <Globe className="mr-1 inline h-3 w-3" /> : <MapPin className="mr-1 inline h-3 w-3" />}
                                            {fmtWhen(ev.startsAt)}{ev.venue ? ` · ${ev.venue}` : ""}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                    {entry.clubs.length > 0 && (
                        <div>
                            <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-grey/40">
                                <Users className="h-3.5 w-3.5" aria-hidden="true" /> Sus clubs
                            </p>
                            <ul className="space-y-1.5">
                                {entry.clubs.map((c) => (
                                    <li key={c.id}>
                                        <Link href={`/app/clubs/${c.id}`} className="text-sm font-medium text-teal-dark hover:text-coral">
                                            {c.name}
                                        </Link>
                                        <span className="block text-xs text-grey/55">
                                            {c.currentBookTitle ? `Leyendo: ${c.currentBookTitle}` : `${c.memberCount} ${c.memberCount === 1 ? "miembro" : "miembros"}`}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            )}

            {entry.recommendations.length > 0 && (
                <div className="mt-3 border-t border-teal/5 pt-3">
                    <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-grey/40">
                        <Sparkles className="h-3.5 w-3.5" aria-hidden="true" /> Recomiendan
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                        {entry.recommendations.map((r) => (
                            <Link
                                key={r.id}
                                href={href}
                                className="inline-flex rounded-full border border-teal/15 bg-teal/5 px-2.5 py-1 text-xs font-medium text-teal transition-colors hover:bg-teal/10"
                            >
                                {r.title}
                            </Link>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

export function MyLibraryHome() {
    const [entries, setEntries] = React.useState<MyLibraryHomeEntry[] | null>(null);

    React.useEffect(() => {
        let alive = true;
        getMyLibraryHome().then((e) => { if (alive) setEntries(e); }).catch(() => { if (alive) setEntries([]); });
        return () => { alive = false; };
    }, []);

    // Mientras carga no ocupamos espacio (evita una cabecera vacía).
    if (entries === null) return null;

    return (
        <section>
            <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-grey/40 lg:text-sm">Mi librería</h2>
            {entries.length === 0 ? (
                // Sin librería adoptada: empujón discreto a descubrir (refuerza el wedge indie).
                <Link
                    href="/app/librerias/descubrir"
                    className="flex items-center justify-between gap-3 rounded-2xl border border-dashed border-teal/20 bg-white/50 p-4 transition-colors hover:border-teal/40 hover:bg-white"
                >
                    <span className="flex items-center gap-3">
                        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal/5 text-teal/50">
                            <Store className="h-5 w-5" aria-hidden="true" />
                        </span>
                        <span>
                            <span className="block text-sm font-semibold text-teal-dark">Elige tu librería</span>
                            <span className="block text-xs text-grey/55">Descubre librerías de barrio y compra en indie, no en un gigante.</span>
                        </span>
                    </span>
                    <ArrowRight className="h-4 w-4 shrink-0 text-teal" aria-hidden="true" />
                </Link>
            ) : (
                <div className="space-y-3">
                    {entries.map((entry) => (
                        <LibraryBlock key={entry.id} entry={entry} />
                    ))}
                </div>
            )}
        </section>
    );
}
