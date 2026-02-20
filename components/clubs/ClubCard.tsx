"use client";

import * as React from "react";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Users } from "lucide-react";

export interface ClubCardProps {
    id: string;
    name: string;
    description?: string;
    currentBook?: {
        title: string;
        author: string;
        coverUrl: string;
    } | null;
    members?: { src?: string; fallback?: string }[];
    memberCount?: number;
    badges?: { label: string; variant?: "neutral" | "brand" | "outline" }[];
    pace?: string;
    nextMilestone?: string;
    isMember?: boolean;
    isAdmin?: boolean;
    featured?: boolean;
    price?: number;
    currency?: string;
    preview?: boolean;
    ownerAvatar?: string | null;
    ownerName?: string | null;
    membershipRole?: string | null;
}

export function ClubCard({
    id,
    name,
    description,
    currentBook,
    memberCount = 0,
    badges = [],
    pace,
    isMember = false,
    featured = false,
    preview = false,
    isAdmin = false,
    price = 0,
    currency = 'EUR',
    ownerAvatar,
    ownerName,
    membershipRole,
}: ClubCardProps) {
    const router = useRouter();
    const formattedPrice = price > 0
        ? new Intl.NumberFormat('es-ES', { style: 'currency', currency }).format(price)
        : null;

    const coverUrl = currentBook?.coverUrl;

    const navigate = () => {
        if (!preview) router.push(`/app/clubs/${id}`);
    };

    return (
        <div
            onClick={navigate}
            className={`flex flex-col h-full rounded-2xl overflow-hidden border transition-all duration-200 group
                ${featured ? 'border-teal/30 shadow-md' : 'border-black/8 hover:border-teal/20 hover:shadow-md'}
                ${preview ? '' : 'cursor-pointer'}
                bg-white`}
        >
            {/* ── Visual Header ── */}
            <div className="relative h-36 overflow-hidden bg-grey/10 shrink-0">
                {/* Blurred book cover background */}
                {coverUrl ? (
                    <Image
                        src={coverUrl}
                        alt=""
                        fill
                        className="object-cover scale-110 blur-sm opacity-60 group-hover:opacity-75 transition-opacity"
                    />
                ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-teal/20 via-teal/5 to-cream" />
                )}

                {/* Bottom gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

                {/* Book thumbnail — bottom right */}
                {coverUrl && (
                    <div className="absolute bottom-3 right-3 w-12 h-[72px] rounded-md shadow-lg overflow-hidden border-2 border-white/80">
                        <Image src={coverUrl} alt={currentBook!.title} fill className="object-cover" />
                    </div>
                )}

                {/* Moderator avatar — bottom left */}
                <div className="absolute bottom-3 left-3 flex items-center gap-2">
                    <div className="relative w-14 h-14 rounded-full border-2 border-white shadow-md overflow-hidden bg-teal/20 shrink-0">
                        {ownerAvatar ? (
                            <Image src={ownerAvatar} alt={ownerName || "Moderador"} fill className="object-cover" />
                        ) : (
                            <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-teal">
                                {(ownerName || "M")[0].toUpperCase()}
                            </div>
                        )}
                    </div>
                    {ownerName && (
                        <span className="text-[10px] font-semibold text-white drop-shadow-sm">
                            {ownerName.split(' ')[0]} modera
                        </span>
                    )}
                </div>

                {/* Featured badge — top left */}
                {featured && (
                    <div className="absolute top-2 left-2">
                        <span className="text-[10px] font-bold bg-teal text-white px-2 py-0.5 rounded-full shadow">
                            Destacado
                        </span>
                    </div>
                )}
            </div>

            {/* ── Card Body ── */}
            <div className="flex flex-col flex-1 p-4">
                {/* Title row with optional price */}
                <div className="flex items-start justify-between gap-2 mb-1">
                    <h3 className="font-serif text-base text-teal-dark font-bold leading-tight line-clamp-2 group-hover:text-teal transition-colors">
                        {name}
                    </h3>
                    {formattedPrice && (
                        <span className="shrink-0 text-[10px] font-bold bg-coral/10 text-coral border border-coral/20 px-2 py-0.5 rounded-full">
                            {formattedPrice}
                        </span>
                    )}
                </div>

                {/* Currently reading */}
                {currentBook ? (
                    <p className="text-[11px] text-grey/60 mb-2 truncate">
                        <span className="font-bold text-grey/40 uppercase tracking-wide text-[9px]">Leyendo </span>
                        {currentBook.title}
                        {currentBook.author && <span className="text-grey/40"> · {currentBook.author}</span>}
                    </p>
                ) : (
                    <p className="text-[11px] text-grey/40 italic mb-2">Decidiendo próxima lectura…</p>
                )}

                {/* Description */}
                {description && (
                    <p className="text-xs text-grey/60 line-clamp-2 mb-3">{description}</p>
                )}

                {/* Tags */}
                {(pace || badges.length > 0) && (
                    <div className="flex flex-wrap gap-1 mb-3">
                        {pace && (
                            <span className="text-[10px] font-bold text-teal bg-teal/5 px-2 py-0.5 rounded-full border border-teal/10">
                                {pace}
                            </span>
                        )}
                        {badges.map((b, i) => (
                            <span key={i} className="text-[10px] text-grey/60 bg-grey/5 px-2 py-0.5 rounded-full border border-black/5">
                                {b.label}
                            </span>
                        ))}
                    </div>
                )}

                {/* Footer */}
                {!preview && (
                    <div className="mt-auto flex items-center justify-between pt-3 border-t border-black/5">
                        <div className="flex items-center gap-1.5 text-[11px] text-grey/50">
                            <Users size={12} />
                            <span>{memberCount > 0 ? `${memberCount} lectores` : "Nuevo"}</span>
                        </div>

                        <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                            {isAdmin ? (
                                <button
                                    className="text-xs font-bold text-teal hover:underline"
                                    onClick={() => router.push(`/app/clubs/${id}?tab=manage`)}
                                >
                                    Gestionar →
                                </button>
                            ) : membershipRole === 'pending' ? (
                                <span className="text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                                    Pendiente de aprobación
                                </span>
                            ) : (
                                isMember ? (
                                    <span className="text-xs font-bold text-teal">
                                        Ir al club →
                                    </span>
                                ) : (
                                    <Button
                                        variant={featured ? "primary" : "outline"}
                                        size="sm"
                                        className="text-xs h-7 px-3"
                                        onClick={() => router.push(`/app/clubs/${id}`)}
                                    >
                                        {price > 0 ? 'Suscribirse' : 'Unirme'}
                                    </Button>
                                )
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
