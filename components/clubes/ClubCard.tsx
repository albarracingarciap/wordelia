import Link from "next/link";
import Image from "next/image";
import { Calendar, Sparkles } from "lucide-react";
import type { PublicClub } from "@/app/clubes/actions";
import { formatStartDate, formatClubPrice, clubHref } from "./format";

// Enlace real (no un botón que abre un modal): cada club es una página
// indexable, y el usuario puede abrirla en otra pestaña.
export function ClubCard({ club }: { club: PublicClub }) {
    const cover = club.book?.cover_url;
    const title = club.book?.title || club.name;
    const startLabel = formatStartDate(club.start_date, { short: true });
    const priceLabel = formatClubPrice(club.price, club.currency ?? "EUR");

    return (
        <Link
            href={clubHref(club)}
            className="group flex h-full flex-col overflow-hidden rounded-2xl border border-teal/10 bg-white text-left shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
        >
            {club.headerImage && (
                <div className="relative h-24 w-full overflow-hidden bg-teal/5">
                    <Image
                        src={club.headerImage}
                        alt={`Cabecera de ${club.name}`}
                        fill
                        sizes="(min-width: 1024px) 280px, (min-width: 640px) 45vw, 90vw"
                        className="object-cover"
                    />
                </div>
            )}
            <div className="relative aspect-[2/3] w-full overflow-hidden bg-grey/10">
                {cover ? (
                    <Image
                        src={cover}
                        alt={`Portada de ${title}`}
                        fill
                        sizes="(min-width: 1024px) 280px, (min-width: 640px) 45vw, 90vw"
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-grey/20 to-grey/5 p-4">
                        <p className="text-center font-serif text-sm text-grey/60">{title}</p>
                    </div>
                )}

                {startLabel && (
                    <span className="absolute right-3 top-3 rounded-full bg-teal px-2.5 py-1 text-xs font-semibold text-white shadow-lg">
                        {startLabel}
                    </span>
                )}
            </div>

            <div className="flex flex-1 flex-col p-4">
                <h3 className="mb-1 line-clamp-2 font-serif text-lg text-teal-dark">{club.name}</h3>
                {club.book?.title && (
                    <p className="mb-2 line-clamp-1 text-sm text-grey/70">
                        {club.book.title}
                        {club.book.author && <span className="text-grey/50"> · {club.book.author}</span>}
                    </p>
                )}
                <p className="mb-3 line-clamp-2 text-sm text-grey/60">{club.description}</p>

                <div className="mt-auto flex flex-wrap items-center gap-2 text-xs text-grey/55">
                    {priceLabel && (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-cream px-2.5 py-1">
                            <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
                            {priceLabel}
                        </span>
                    )}
                    {club.destacado && (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-coral/10 px-2.5 py-1 font-semibold text-coral">
                            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                            Destacado
                        </span>
                    )}
                </div>
            </div>
        </Link>
    );
}
