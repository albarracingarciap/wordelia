"use client";

import { OfficialClub } from "@/app/clubes/actions";
import Image from "next/image";
import { Badge } from "@/components/ui/Badge";
import { Calendar, Sparkles } from "lucide-react";

interface OfficialClubCardProps {
    club: OfficialClub;
    onClick: () => void;
}

function formatStartDate(value?: string | null) {
    if (!value) return "Próximamente";

    const [datePart] = value.split("T");
    const [year, month, day] = datePart.split("-").map(Number);
    if (!year || !month || !day) return "Próximamente";

    return new Intl.DateTimeFormat("es-ES", {
        day: "numeric",
        month: "short",
    }).format(new Date(year, month - 1, day));
}

function formatPrice(value?: number | null, currency = "EUR") {
    const cents = typeof value === "number" ? value : 990;

    return new Intl.NumberFormat("es-ES", {
        style: "currency",
        currency,
    }).format(cents / 100);
}

export function OfficialClubCard({ club, onClick }: OfficialClubCardProps) {
    const bookData = club.book_data;

    if (!bookData) return null;

    return (
        <button
            type="button"
            onClick={onClick}
            className="group h-full overflow-hidden rounded-xl bg-white text-left shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
        >
            <div className="relative aspect-[2/3] w-full overflow-hidden bg-grey/10">
                {bookData.cover_url ? (
                    <Image
                        src={bookData.cover_url}
                        alt={bookData.title}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-grey/20 to-grey/5 p-4">
                        <p className="text-center font-serif text-xs text-grey/60">{bookData.title}</p>
                    </div>
                )}

                <div className="absolute right-3 top-3">
                    <Badge className="border-none bg-teal font-semibold text-white shadow-lg">
                        {formatStartDate(club.start_date)}
                    </Badge>
                </div>
            </div>

            <div className="p-4">
                <h3 className="mb-1 line-clamp-2 font-serif text-lg text-grey">{club.name}</h3>
                <p className="mb-3 line-clamp-2 text-sm text-grey/60">{club.description}</p>

                <div className="flex flex-wrap items-center gap-2 text-xs text-grey/55">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-cream px-2.5 py-1">
                        <Calendar className="h-3.5 w-3.5" />
                        Valor {formatPrice(club.price_cents, club.currency || "EUR")}
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-teal/10 px-2.5 py-1 font-semibold text-teal">
                        <Sparkles className="h-3.5 w-3.5" />
                        Fundadores
                    </span>
                </div>
            </div>
        </button>
    );
}
