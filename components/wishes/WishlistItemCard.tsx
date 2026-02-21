"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { WishlistItemData, removeItemFromWishlist, updateItemPriority } from "@/app/app/wishes/item-actions";
import { Trash2, Star } from "lucide-react";
import { useRouter } from "next/navigation";

interface WishlistItemCardProps {
    item: WishlistItemData;
    isGuestView: boolean;
    onReserve?: () => void;
}

export function WishlistItemCard({ item, isGuestView, onReserve }: WishlistItemCardProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const isReservedOrPurchased = item.status === "RESERVED" || item.status === "PURCHASED";
    const showAsBlocked = isGuestView && isReservedOrPurchased && !item.crowdfunding;

    const isCrowdfunding = !!item.crowdfunding;
    const progress = isCrowdfunding
        ? Math.min((item.crowdfunding!.collected / item.crowdfunding!.target) * 100, 100)
        : 0;

    const hasDedication = !!item.dedication;

    function handleDelete() {
        startTransition(async () => {
            await removeItemFromWishlist(item.id, item.wishlistId);
            router.refresh();
        });
    }

    function handleTogglePriority() {
        const next = item.priority === "HIGH" ? "MEDIUM" : "HIGH";
        startTransition(async () => {
            await updateItemPriority(item.id, next, item.wishlistId);
            router.refresh();
        });
    }

    return (
        <div className={`flex gap-4 p-4 rounded-xl border transition-all ${showAsBlocked ? "bg-grey/5 border-transparent opacity-70" : "bg-white border-teal/10 hover:shadow-md"} ${isPending ? "opacity-60" : ""}`}>
            {/* Cover */}
            <div className="relative w-20 h-28 shrink-0 rounded-md overflow-hidden shadow-sm bg-grey/10">
                {item.coverUrl ? (
                    <Image
                        src={item.coverUrl}
                        alt={item.title}
                        fill
                        className={`object-cover ${showAsBlocked ? "grayscale" : ""}`}
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-grey/30 text-sm">📚</div>
                )}

                {/* Priority Badge */}
                {!showAsBlocked && item.priority === "HIGH" && (
                    <div className="absolute top-0 right-0 bg-coral text-white text-[10px] font-bold px-1.5 py-0.5 rounded-bl-md">
                        TOP
                    </div>
                )}

                {/* Dedication Badge */}
                {hasDedication && (
                    <div className="absolute bottom-0 right-0 bg-white/90 p-1 rounded-tl-md shadow-sm border-t border-l border-grey/10" title="Mensaje secreto adjunto">
                        <span className="text-xl leading-none">💌</span>
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="flex-1 flex flex-col justify-between py-1 min-w-0">
                <div>
                    <h4 className={`font-serif font-bold text-lg leading-tight ${showAsBlocked ? "text-grey line-through" : "text-teal"}`}>
                        {item.title}
                    </h4>
                    {item.author && <p className="text-sm text-grey/80">{item.author}</p>}

                    {/* Reserved By (owner view only) */}
                    {!isGuestView && item.reservedBy && (
                        <p className="text-xs text-coral mt-1 font-medium">
                            Reservado por: {item.reservedBy}
                        </p>
                    )}
                </div>

                {isCrowdfunding ? (
                    <div className="w-full mt-2">
                        <div className="flex justify-between text-xs mb-1">
                            <span className="text-teal font-bold">{progress.toFixed(0)}% <span className="font-normal text-grey/60">recaudado</span></span>
                            <span className="text-grey/60">{item.crowdfunding!.collected}€ / {item.crowdfunding!.target}€</span>
                        </div>
                        <div className="h-2 w-full bg-grey/10 rounded-full overflow-hidden mb-3">
                            <div className="h-full bg-teal rounded-full transition-all" style={{ width: `${progress}%` }} />
                        </div>
                        {isGuestView && (
                            <button className="bg-coral text-white text-xs font-bold px-4 py-1.5 rounded-full hover:bg-opacity-90 transition-colors flex items-center gap-1">
                                🎁 Contribuir
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="flex justify-between items-end mt-2">
                        <div className="text-sm font-medium text-teal/80">
                            {item.price != null ? `${item.price.toFixed(2)}€` : "—"}
                        </div>

                        {isGuestView ? (
                            <div className="flex items-center gap-2">
                                {isReservedOrPurchased ? (
                                    <span className="text-xs font-bold text-coral bg-coral/10 px-2 py-1 rounded-full">
                                        {item.status === "PURCHASED" ? "🎁 YA COMPRADO" : "🔒 RESERVADO"}
                                    </span>
                                ) : (
                                    <button
                                        onClick={onReserve}
                                        className="bg-teal text-white text-xs font-bold px-4 py-2 rounded-full hover:bg-opacity-90 transition-colors"
                                    >
                                        RESERVAR
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div className="flex gap-2 items-center">
                                <button
                                    onClick={handleTogglePriority}
                                    disabled={isPending}
                                    title={item.priority === "HIGH" ? "Quitar prioridad alta" : "Marcar como prioritario"}
                                    className={`p-1.5 rounded-full transition-colors ${item.priority === "HIGH" ? "text-coral bg-coral/10" : "text-grey/30 hover:text-coral hover:bg-coral/10"}`}
                                >
                                    <Star className="w-4 h-4" fill={item.priority === "HIGH" ? "currentColor" : "none"} />
                                </button>
                                <button
                                    onClick={handleDelete}
                                    disabled={isPending}
                                    className="p-1.5 text-grey/30 hover:text-coral hover:bg-coral/10 rounded-full transition-colors"
                                    title="Eliminar"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
