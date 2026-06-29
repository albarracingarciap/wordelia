"use client";

import { OfficialClub } from "@/app/clubes/actions";
import Image from "next/image";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { Calendar, Users, Sparkles, MessageCircle } from "lucide-react";

interface FeaturedClubProps {
    club: OfficialClub;
    onViewDetails: () => void;
}

const openingQuestion = "Lo más aterrador de Gilead es que no se construyó de la noche a la mañana, sino mediante la pérdida gradual de pequeños derechos que la gente normal justificó \"por seguridad\". ¿Qué derechos o libertades creen que damos por sentados hoy y que podrían desaparecer si la sociedad entrara en pánico?";

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

export function FeaturedClub({ club, onViewDetails }: FeaturedClubProps) {
    const bookData = club.book_data;

    if (!bookData) return null;

    return (
        <div className="relative mb-12 overflow-hidden rounded-2xl border-2 border-coral/20 bg-white shadow-xl">
            <div className="absolute inset-0 bg-gradient-to-br from-coral/5 via-transparent to-red-50/30" />

            <div className="relative z-10 p-6 md:p-8">
                <div className="mb-6 flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-coral" />
                    <Badge className="border-none bg-coral text-sm font-bold text-white">
                        CLUB DEL MES
                    </Badge>
                </div>

                <div className="grid gap-8 lg:grid-cols-[260px_1fr] lg:items-start">
                    <div
                        onClick={onViewDetails}
                        className="relative mx-auto aspect-[2/3] w-full max-w-[220px] cursor-pointer overflow-hidden rounded-xl bg-grey/10 shadow-lg transition-all duration-300 hover:shadow-2xl lg:mx-0"
                    >
                        {bookData.cover_url ? (
                            <Image
                                src={bookData.cover_url}
                                alt={bookData.title}
                                fill
                                className="object-cover transition-transform duration-300 hover:scale-105"
                            />
                        ) : (
                            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-grey/20 to-grey/5 p-4">
                                <p className="text-center font-serif text-xs text-grey/60">
                                    {bookData.title}
                                </p>
                            </div>
                        )}
                    </div>

                    <div className="space-y-6">
                        <div>
                            <h2 className="mb-2 text-2xl text-teal md:text-3xl">
                                {bookData.title}
                            </h2>
                            <p className="text-lg text-grey/70">
                                por {bookData.authors?.join(", ") || "Autor desconocido"}
                            </p>
                        </div>

                        <div className="rounded-2xl border border-teal/10 bg-white p-5 shadow-sm">
                            <div className="mb-3 flex items-center gap-2 text-sm font-bold text-teal-dark">
                                <MessageCircle className="h-4 w-4 text-coral" />
                                Pregunta de apertura
                            </div>
                            <p className="font-serif text-lg leading-relaxed text-teal-dark">
                                “{openingQuestion}”
                            </p>
                        </div>

                        <p className="text-base leading-relaxed text-grey/80">
                            {club.description}
                        </p>

                        <div className="flex flex-wrap gap-3">
                            <div className="flex items-center gap-2 rounded-lg border border-coral/20 bg-coral/10 px-3 py-2 text-coral">
                                <Calendar className="h-4 w-4" />
                                <span className="text-sm font-semibold">{formatStartDate(club.start_date)}</span>
                            </div>
                            <div className="flex items-center gap-2 rounded-lg border border-teal/20 bg-teal/10 px-3 py-2 text-teal">
                                <Users className="h-4 w-4" />
                                <span className="text-sm font-semibold">Club Oficial</span>
                            </div>
                            <div className="flex items-center gap-2 rounded-lg border border-coral/20 bg-coral/10 px-3 py-2 text-coral">
                                <Sparkles className="h-4 w-4" />
                                <span className="text-sm font-semibold">Valor {formatPrice(club.price_cents, club.currency || "EUR")}</span>
                            </div>
                        </div>

                        <div className="flex flex-col gap-3 sm:flex-row">
                            <Button
                                onClick={onViewDetails}
                                className="bg-coral font-semibold text-white shadow-md transition-all hover:bg-coral/90 hover:shadow-lg"
                            >
                                Ver detalles del club
                            </Button>
                            <Link href="/register">
                                <Button
                                    variant="outline"
                                    className="border-2 border-coral/30 font-semibold text-coral transition-all hover:bg-coral/5"
                                >
                                    Únete gratis
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
