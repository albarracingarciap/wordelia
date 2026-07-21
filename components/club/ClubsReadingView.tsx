import Link from "next/link";
import Image from "next/image";
import { Users, BookOpen, Sparkles } from "lucide-react";
import type { BookClub } from "@/app/app/clubs/book-clubs-actions";

/**
 * Vista "Clubs leyendo este libro" (presentacional). La usan la ficha pública
 * (server) y la in-app (vía BookClubsReading, client).
 */
export function ClubsReadingView({ clubs }: { clubs: BookClub[] }) {
    if (clubs.length === 0) return null;

    return (
        <section className="rounded-2xl border border-teal/10 bg-white p-5 shadow-sm">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-grey/50">
                <Users className="h-4 w-4 text-teal" aria-hidden="true" /> Clubs leyendo este libro
            </h2>
            <div className="space-y-2">
                {clubs.map((c) => {
                    // Oficial → página pública /clubes/[slug]; comunitario → /app/clubs/[id].
                    const href = c.isOfficial && c.slug ? `/clubes/${c.slug}` : `/app/clubs/${c.id}`;
                    return (
                        <Link
                            key={c.id}
                            href={href}
                            className="flex items-center gap-3 rounded-xl border border-teal/5 bg-cream/40 p-3 transition-colors hover:border-teal/20 hover:bg-cream/70"
                        >
                            <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-teal/5">
                                {c.coverUrl ? (
                                    <Image src={c.coverUrl} alt="" fill className="object-cover" sizes="48px" />
                                ) : (
                                    <div className="flex h-full w-full items-center justify-center text-teal/40"><BookOpen className="h-5 w-5" aria-hidden="true" /></div>
                                )}
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-1.5">
                                    <span className="truncate text-sm font-semibold text-teal-dark">{c.name}</span>
                                    {c.isOfficial && (
                                        <span className="inline-flex items-center gap-0.5 rounded-full bg-coral/10 px-1.5 py-0.5 text-[10px] font-bold text-coral">
                                            <Sparkles className="h-2.5 w-2.5" aria-hidden="true" /> Oficial
                                        </span>
                                    )}
                                    <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${c.status === "current" ? "bg-teal/10 text-teal" : "bg-grey/10 text-grey/60"}`}>
                                        {c.status === "current" ? "Leyendo ahora" : "Programado"}
                                    </span>
                                </div>
                                <p className="mt-0.5 truncate text-xs text-grey/55">
                                    {c.organizationName ? `${c.organizationName} · ` : ""}
                                    {c.memberCount} {c.memberCount === 1 ? "miembro" : "miembros"}
                                </p>
                            </div>
                        </Link>
                    );
                })}
            </div>
        </section>
    );
}
