"use client";

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
    currency = "EUR",
    ownerAvatar,
    ownerName,
    membershipRole,
}: ClubCardProps) {
    const router = useRouter();
    const formattedPrice = price > 0
        ? new Intl.NumberFormat("es-ES", { style: "currency", currency }).format(price)
        : null;
    const membersLabel = memberCount === 1 ? "1 lector" : memberCount > 1 ? `${memberCount} lectores` : "Nuevo";
    const coverUrl = currentBook?.coverUrl;

    const navigate = () => {
        if (!preview) router.push(`/app/clubs/${id}`);
    };

    return (
        <div
            onClick={navigate}
            className={`group flex h-full flex-col overflow-hidden rounded-2xl border bg-white transition-all duration-200
                ${featured ? "border-teal/30 shadow-md" : "border-black/8 hover:border-teal/20 hover:shadow-md"}
                ${preview ? "" : "cursor-pointer"}`}
        >
            <div className="relative h-32 shrink-0 overflow-hidden bg-grey/10 md:h-36">
                {coverUrl ? (
                    <Image
                        src={coverUrl}
                        alt=""
                        fill
                        className="scale-110 object-cover opacity-55 blur-sm transition-opacity group-hover:opacity-70"
                    />
                ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-teal/20 via-teal/5 to-cream" />
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

                {coverUrl && (
                    <div className="absolute bottom-3 right-3 h-[66px] w-11 overflow-hidden rounded-md border-2 border-white/80 shadow-lg md:h-[72px] md:w-12">
                        <Image src={coverUrl} alt={currentBook!.title} fill className="object-cover" />
                    </div>
                )}

                <div className="absolute bottom-3 left-3 flex items-center gap-2">
                    <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full border-2 border-white bg-teal/20 shadow-md md:h-14 md:w-14">
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
                            {ownerName.split(" ")[0]} modera
                        </span>
                    )}
                </div>

                {featured && (
                    <div className="absolute left-2 top-2">
                        <span className="rounded-full bg-teal px-2 py-0.5 text-[10px] font-bold text-white shadow">
                            Destacado
                        </span>
                    </div>
                )}
            </div>

            <div className="flex flex-1 flex-col p-4 md:p-5">
                <div className="mb-1 flex items-start justify-between gap-2">
                    <h3 className="line-clamp-2 text-lg font-bold leading-tight text-teal-dark transition-colors group-hover:text-teal">
                        {name}
                    </h3>
                    {formattedPrice && (
                        <span className="shrink-0 rounded-full border border-coral/20 bg-coral/10 px-2 py-0.5 text-[10px] font-bold text-coral">
                            {formattedPrice}
                        </span>
                    )}
                </div>

                {currentBook ? (
                    <p className="mb-3 text-xs leading-snug text-grey/60">
                        <span className="mb-0.5 block text-[10px] font-bold uppercase tracking-widest text-grey/40">Leyendo</span>
                        <span className="line-clamp-1">
                            {currentBook.title}
                            {currentBook.author && <span className="text-grey/45"> · {currentBook.author}</span>}
                        </span>
                    </p>
                ) : (
                    <p className="mb-3 text-xs italic text-grey/40">Decidiendo próxima lectura...</p>
                )}

                {description && (
                    <p className="mb-3 line-clamp-3 text-sm leading-6 text-grey/65 md:line-clamp-2 md:text-xs md:leading-5">
                        {description}
                    </p>
                )}

                {(pace || badges.length > 0) && (
                    <div className="mb-3 flex flex-wrap gap-1">
                        {pace && (
                            <span className="rounded-full border border-teal/10 bg-teal/5 px-2 py-0.5 text-[10px] font-bold text-teal">
                                {pace}
                            </span>
                        )}
                        {badges.map((badge, index) => (
                            <span key={index} className="rounded-full border border-black/5 bg-grey/5 px-2 py-0.5 text-[10px] text-grey/60">
                                {badge.label}
                            </span>
                        ))}
                    </div>
                )}

                {!preview && (
                    <div className="mt-auto flex items-center justify-between border-t border-black/5 pt-3">
                        <div className="flex items-center gap-1.5 text-[11px] text-grey/50">
                            <Users size={12} />
                            <span>{membersLabel}</span>
                        </div>

                        <div className="flex items-center gap-2" onClick={event => event.stopPropagation()}>
                            {isAdmin ? (
                                <button
                                    className="text-xs font-bold text-teal hover:underline"
                                    onClick={() => router.push(`/app/clubs/${id}?tab=manage`)}
                                >
                                    Gestionar →
                                </button>
                            ) : membershipRole === "pending" ? (
                                <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-600">
                                    Pendiente de aprobación
                                </span>
                            ) : isMember ? (
                                <button
                                    className="text-xs font-bold text-teal hover:underline"
                                    onClick={() => router.push(`/app/clubs/${id}`)}
                                >
                                    Ir al club →
                                </button>
                            ) : (
                                <Button
                                    variant={featured ? "primary" : "outline"}
                                    size="sm"
                                    className="h-8 px-4 text-xs font-bold"
                                    onClick={() => router.push(`/app/clubs/${id}`)}
                                >
                                    {price > 0 ? "Suscribirse" : "Unirme"}
                                </Button>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
