import * as React from "react";
import { Card } from "../ui/Card";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { AvatarStack } from "../ui/AvatarStack";
import Image from "next/image";
import Link from "next/link";

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
    badges?: { label: string; variant?: "neutral" | "brand" | "outline" }[]; // Make optional or ensure transformation
    pace?: string;
    nextMilestone?: string;
    isMember?: boolean;
    isAdmin?: boolean;
    featured?: boolean;
    price?: number;
    currency?: string;
    preview?: boolean;
}

export function ClubCard({
    id,
    name,
    description,
    currentBook,
    members = [],
    memberCount = 0,
    badges = [],
    pace,
    nextMilestone,
    isMember = false,
    featured = false,
    preview = false,
    isAdmin = false,
    price = 0,
    currency = 'EUR'
}: ClubCardProps) {
    const formattedPrice = price > 0
        ? new Intl.NumberFormat('es-ES', { style: 'currency', currency: currency }).format(price)
        : 'Gratis';

    return (
        <Card className={`flex flex-col h-full ${featured ? 'border-teal/20 bg-teal/5' : ''} ${preview ? 'pointer-events-none' : ''}`}>
            <div className="flex justify-between items-start mb-4">
                <div className="flex-1 min-w-0 pr-2">
                    <div className="flex items-center justify-between mb-1">
                        <h3 className="font-serif text-lg text-teal-dark font-bold leading-tight line-clamp-2 hover:text-teal transition-colors">
                            {preview ? name : <Link href={`/app/clubs/${id}`}>{name}</Link>}
                        </h3>
                        {price > 0 && (
                            <Badge variant="neutral" size="sm" className="ml-2 shrink-0 bg-coral/10 text-coral border-coral/20">
                                {formattedPrice}
                            </Badge>
                        )}
                    </div>

                    {description && <p className="text-xs text-grey/60 mt-1 line-clamp-2">{description}</p>}
                </div>
                {nextMilestone && (
                    <Badge variant="coral" size="sm" className="shrink-0 ml-2">
                        {nextMilestone}
                    </Badge>
                )}
            </div>

            {/* Current Book Section */}
            {currentBook ? (
                <div className="flex gap-3 mb-4 bg-white/50 p-2 rounded-lg border border-black/5">
                    <div className="relative w-10 h-14 shrink-0 rounded shadow-sm overflow-hidden bg-grey/10">
                        {currentBook.coverUrl ? (
                            <Image src={currentBook.coverUrl} alt={currentBook.title} fill className="object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-[8px] text-grey/40">No Cover</div>
                        )}
                    </div>
                    <div className="flex flex-col justify-center min-w-0">
                        <span className="text-[10px] uppercase text-grey/50 font-bold tracking-wider">Leyendo</span>
                        <p className="text-xs font-bold text-grey-dark truncate">{currentBook.title}</p>
                        <p className="text-[10px] text-grey/70 truncate">{currentBook.author}</p>
                    </div>
                </div>
            ) : (
                <div className="flex-1 flex items-center justify-center p-4 mb-4 border border-dashed border-grey/20 rounded-lg">
                    <p className="text-xs text-grey/40 italic">Decidiendo próxima lectura...</p>
                </div>
            )}

            <div className="mt-auto space-y-4">
                {/* Meta: Pace & Tags */}
                <div className="flex flex-wrap gap-1.5 min-h-[24px]">
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

                {/* Footer: Members & Action */}
                {!preview && (
                    <div className="flex items-center justify-between pt-3 border-t border-black/5">
                        <div className="flex items-center gap-2">
                            <AvatarStack avatars={members} max={3} size="sm" />
                            <span className="text-[10px] text-grey/50">
                                {memberCount > 0 ? `${memberCount} lectores` : ""}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            {isAdmin && (
                                <div className="flex items-center gap-2">
                                    <button
                                        className="text-[10px] font-bold text-coral hover:underline"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            if (confirm("¿Seguro que quieres eliminar este club?")) {
                                                console.log("Delete club", id);
                                                // TODO: Call server action for delete
                                            }
                                        }}
                                    >
                                        Eliminar
                                    </button>
                                    <span className="text-grey/20">|</span>
                                    <Link
                                        href={`/app/clubs/${id}/editar`}
                                        className="text-[10px] font-bold text-grey-dark hover:text-teal hover:underline"
                                    >
                                        Editar
                                    </Link>
                                </div>
                            )}

                            {/* Logic for Member vs Non-Member */}
                            {!isAdmin && (
                                isMember ? (
                                    <Link href={`/app/clubs/${id}`} className="text-xs font-medium text-teal hover:underline">
                                        Ir al club
                                    </Link>
                                ) : (
                                    <Button variant={featured ? "primary" : "outline"} size="sm" className="text-xs h-7 px-3">
                                        {price > 0 ? 'Suscribirse' : 'Unirme'}
                                    </Button>
                                )
                            )}
                        </div>
                    </div>
                )}
            </div>
        </Card>
    );
}
