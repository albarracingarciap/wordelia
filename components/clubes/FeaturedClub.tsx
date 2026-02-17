"use client";

import { OfficialClub } from "@/app/clubes/actions";
import Image from "next/image";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { Calendar, Users, Sparkles, BookOpen } from "lucide-react";

interface FeaturedClubProps {
    club: OfficialClub;
    onViewDetails: () => void;
}

export function FeaturedClub({ club, onViewDetails }: FeaturedClubProps) {
    const bookData = club.book_data;

    if (!bookData) return null;

    return (
        <div className="relative overflow-hidden bg-white rounded-2xl shadow-xl mb-12 border-2 border-coral/20">
            {/* Decorative gradient background - subtle */}
            <div className="absolute inset-0 bg-gradient-to-br from-coral/5 via-transparent to-red-50/30" />

            <div className="relative z-10 p-6 md:p-8">
                {/* Badge */}
                <div className="flex items-center gap-2 mb-6">
                    <Sparkles className="w-5 h-5 text-coral" />
                    <Badge className="bg-coral text-white font-bold border-none text-sm">
                        CLUB DEL MES
                    </Badge>
                </div>

                <div className="grid md:grid-cols-[200px,1fr] gap-6 md:gap-8">
                    {/* Book Cover - More compact */}
                    <div className="shrink-0">
                        <div
                            onClick={onViewDetails}
                            className="relative w-full max-w-[200px] mx-auto aspect-[2/3] bg-grey/10 rounded-lg overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer group"
                        >
                            {bookData.cover_url ? (
                                <Image
                                    src={bookData.cover_url}
                                    alt={bookData.title}
                                    fill
                                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-grey/20 to-grey/5 p-4">
                                    <p className="text-xs text-grey/60 text-center font-serif">
                                        {bookData.title}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Club Info */}
                    <div className="flex flex-col justify-center">
                        <h2 className="text-2xl md:text-3xl font-serif text-grey mb-2">
                            {bookData.title}
                        </h2>
                        <p className="text-lg text-grey/70 mb-4">
                            por {bookData.authors?.join(", ") || "Autor desconocido"}
                        </p>

                        <p className="text-base text-grey/80 mb-6 leading-relaxed">
                            {club.description}
                        </p>

                        <div className="flex flex-wrap gap-3 mb-6">
                            <div className="flex items-center gap-2 bg-coral/10 text-coral rounded-lg px-3 py-2 border border-coral/20">
                                <Calendar className="w-4 h-4" />
                                <span className="text-sm font-semibold">15 marzo 2026</span>
                            </div>
                            <div className="flex items-center gap-2 bg-teal/10 text-teal rounded-lg px-3 py-2 border border-teal/20">
                                <Users className="w-4 h-4" />
                                <span className="text-sm font-semibold">Club Oficial</span>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3">
                            <a
                                href="/guides/guia_el_cuento_de_la_criada.pdf"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full sm:w-auto"
                            >
                                <Button
                                    className="bg-teal hover:bg-teal-dark text-white font-semibold shadow-md hover:shadow-lg transition-all flex items-center gap-2 w-full justify-center"
                                >
                                    <BookOpen className="w-4 h-4" />
                                    Ver Guía Gratuita
                                </Button>
                            </a>
                            <Button
                                onClick={onViewDetails}
                                className="bg-coral hover:bg-coral/90 text-white font-semibold shadow-md hover:shadow-lg transition-all"
                            >
                                Ver detalles del club
                            </Button>
                            <Link href="/register">
                                <Button
                                    variant="outline"
                                    className="border-2 border-coral/30 text-coral hover:bg-coral/5 font-semibold transition-all"
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
