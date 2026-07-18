import Link from "next/link";
import Image from "next/image";
import { Calendar, Users, Sparkles, MessageCircle } from "lucide-react";
import type { PublicClub } from "@/app/clubes/actions";
import { formatStartDate, formatClubPrice, clubHref } from "./format";

// La pregunta de apertura sale de club_books.pregunta_apertura. Antes había
// una cita de Gilead hardcodeada que se mostraba para cualquier club.
export function FeaturedClub({ club }: { club: PublicClub }) {
    const cover = club.book?.cover_url;
    const title = club.book?.title || club.name;
    const startLabel = formatStartDate(club.start_date);
    const priceLabel = formatClubPrice(club.price, club.currency ?? "EUR");

    return (
        <article className="relative overflow-hidden rounded-3xl border border-coral/20 bg-white shadow-lg">
            <div className="absolute inset-0 bg-gradient-to-br from-coral/5 via-transparent to-cream/40" />

            <div className="relative z-10 p-6 md:p-8">
                <p className="mb-6 inline-flex items-center gap-2 rounded-full bg-coral/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-coral">
                    <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                    Club destacado
                </p>

                <div className="grid gap-8 lg:grid-cols-[260px_1fr] lg:items-start">
                    <Link
                        href={clubHref(club)}
                        className="relative mx-auto aspect-[2/3] w-full max-w-[220px] overflow-hidden rounded-2xl bg-grey/10 shadow-lg transition-shadow duration-300 hover:shadow-2xl lg:mx-0"
                    >
                        {cover ? (
                            <Image
                                src={cover}
                                alt={`Portada de ${title}`}
                                fill
                                sizes="220px"
                                className="object-cover"
                            />
                        ) : (
                            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-grey/20 to-grey/5 p-4">
                                <p className="text-center font-serif text-sm text-grey/60">{title}</p>
                            </div>
                        )}
                    </Link>

                    <div className="space-y-6">
                        <div>
                            <h2 className="mb-1 text-2xl text-teal md:text-3xl">{club.name}</h2>
                            {club.book?.title && (
                                <p className="text-lg text-grey/70">
                                    Leyendo: {club.book.title}
                                    {club.book.author && ` · ${club.book.author}`}
                                </p>
                            )}
                        </div>

                        {club.hook_question && (
                            <div className="rounded-2xl border border-teal/10 bg-white p-5 shadow-sm">
                                <div className="mb-3 flex items-center gap-2 text-sm font-bold text-teal-dark">
                                    <MessageCircle className="h-4 w-4 text-coral" aria-hidden="true" />
                                    Pregunta de apertura
                                </div>
                                <p className="font-serif text-lg leading-relaxed text-teal-dark">
                                    “{club.hook_question}”
                                </p>
                            </div>
                        )}

                        {club.description && (
                            <p className="text-base leading-relaxed text-grey/80">{club.description}</p>
                        )}

                        <div className="flex flex-wrap gap-3">
                            {startLabel && (
                                <span className="flex items-center gap-2 rounded-lg border border-coral/20 bg-coral/10 px-3 py-2 text-sm font-semibold text-coral">
                                    <Calendar className="h-4 w-4" aria-hidden="true" />
                                    Empieza el {startLabel}
                                </span>
                            )}
                            <span className="flex items-center gap-2 rounded-lg border border-teal/20 bg-teal/10 px-3 py-2 text-sm font-semibold text-teal">
                                <Users className="h-4 w-4" aria-hidden="true" />
                                Club oficial
                            </span>
                            {priceLabel && (
                                <span className="flex items-center gap-2 rounded-lg border border-coral/20 bg-coral/10 px-3 py-2 text-sm font-semibold text-coral">
                                    <Sparkles className="h-4 w-4" aria-hidden="true" />
                                    {priceLabel}
                                </span>
                            )}
                        </div>

                        <Link
                            href={clubHref(club)}
                            className="inline-flex h-12 items-center justify-center rounded-2xl bg-coral px-8 font-semibold text-white shadow-sm shadow-coral/20 transition-all hover:bg-[#C25852]"
                        >
                            Ver el club
                        </Link>
                    </div>
                </div>
            </div>
        </article>
    );
}
