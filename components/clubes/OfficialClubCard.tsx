"use client";

import { OfficialClub } from "@/app/clubes/actions";
import Image from "next/image";
import { Badge } from "@/components/ui/Badge";
import { Calendar } from "lucide-react";

interface OfficialClubCardProps {
    club: OfficialClub;
    onClick: () => void;
}

export function OfficialClubCard({ club, onClick }: OfficialClubCardProps) {
    const bookData = club.book_data;

    if (!bookData) return null;

    return (
        <div
            onClick={onClick}
            className="group cursor-pointer bg-white rounded-xl shadow-md hover:shadow-2xl transition-all duration-300 overflow-hidden"
        >
            {/* Book Cover */}
            <div className="relative w-full aspect-[2/3] bg-grey/10 overflow-hidden">
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

                {/* Badge */}
                <div className="absolute top-3 right-3">
                    <Badge className="bg-teal text-white font-semibold border-none shadow-lg">
                        Próximamente
                    </Badge>
                </div>
            </div>

            {/* Club Info */}
            <div className="p-4">
                <h3 className="text-lg font-serif text-grey mb-1 line-clamp-2">
                    {club.name}
                </h3>
                <p className="text-sm text-grey/60 mb-3 line-clamp-2">
                    {club.description}
                </p>

                <div className="flex items-center gap-2 text-xs text-grey/50">
                    <Calendar className="w-4 h-4" />
                    <span>15 marzo 2026</span>
                </div>
            </div>
        </div>
    );
}
