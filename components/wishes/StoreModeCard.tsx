import { useState, useTransition } from "react";
import Image from "next/image";
import { WishlistItemData, reserveWishlistItem, markWishlistItemPurchased } from "@/app/app/wishes/item-actions";
import { CheckCircle2, Gift, Lock } from "lucide-react";

interface StoreModeCardProps {
    item: WishlistItemData;
    isGuestView: boolean;
    myItems: string[];
    onReservationChange: (newMyItems: string[]) => void;
}

export function StoreModeCard({ item, isGuestView, myItems, onReservationChange }: StoreModeCardProps) {
    const [isPending, startTransition] = useTransition();

    const isMyItem = myItems.includes(item.id);
    const isReserved = item.status === "RESERVED";
    const isPurchased = item.status === "PURCHASED";
    const isReservedOrPurchased = isReserved || isPurchased;

    // In guest view, hide details if it is reserved/purchased by someone else
    const showAsBlocked = isGuestView && isReservedOrPurchased && !isMyItem && !item.crowdfunding;

    async function handleBuyAction() {
        if (!isGuestView) return; // Owner cannot buy their own items

        if (item.status === "AVAILABLE") {
            // Need to reserve it quickly.  Since this is store mode and we want minimal friction, 
            // we will use a generic "Anónimo (Modo Tienda)" name, or just "Amigo"
            startTransition(async () => {
                const res = await reserveWishlistItem(item.id, item.wishlistId, "Amigo (Modo Tienda)");
                if (!res.error) {
                    const newMyItems = [...myItems, item.id];
                    onReservationChange(newMyItems);
                }
            });
        } else if (isReserved && isMyItem) {
            // Confirm purchase
            startTransition(async () => {
                await markWishlistItemPurchased(item.id, item.wishlistId);
            });
        }
    }

    return (
        <div className={`flex items-center gap-4 p-3 rounded-xl border ${showAsBlocked ? "bg-grey/5 border-transparent opacity-60" : "bg-white border-grey/10"} ${isPending ? "opacity-50" : ""}`}>
            {/* Book Cover */}
            <div className="relative w-16 h-24 shrink-0 rounded overflow-hidden bg-grey/10">
                {item.coverUrl ? (
                    <Image
                        src={item.coverUrl}
                        alt={item.title}
                        fill
                        className={`object-cover ${showAsBlocked ? "grayscale" : ""}`}
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-grey/30 text-xs">📚</div>
                )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 flex flex-col justify-center">
                <h4 className={`font-serif font-bold text-base leading-tight truncate ${showAsBlocked ? "text-grey line-through" : "text-teal"}`}>
                    {item.title}
                </h4>
                {item.author && <p className="text-sm text-grey/80 truncate">{item.author}</p>}

                {/* Status / Price */}
                <div className="mt-2 text-sm font-medium">
                    {showAsBlocked ? (
                        <span className="text-coral flex items-center gap-1">
                            <Lock className="w-3.5 h-3.5" /> No disponible
                        </span>
                    ) : (
                        <span className="text-teal/80">
                            {item.price != null ? `${item.price.toFixed(2)}€` : "—"}
                        </span>
                    )}
                </div>
            </div>

            {/* Actions (Only in Guest View and if not blocked) */}
            {isGuestView && !showAsBlocked && !item.crowdfunding && (
                <div className="shrink-0 flex items-center justify-center pl-2">
                    {item.status === "AVAILABLE" && (
                        <button
                            onClick={handleBuyAction}
                            disabled={isPending}
                            className="w-10 h-10 rounded-full bg-teal/10 text-teal flex items-center justify-center hover:bg-teal hover:text-white transition-colors"
                            title="Tengo este libro en la mano (Reservar)"
                        >
                            <Gift className="w-5 h-5" />
                        </button>
                    )}

                    {isReserved && isMyItem && (
                        <button
                            onClick={handleBuyAction}
                            disabled={isPending}
                            className="text-xs font-bold text-white bg-coral px-3 py-2 rounded-lg hover:bg-opacity-90 transition-colors shadow-sm text-center"
                        >
                            CONFIRMAR<br />COMPRA
                        </button>
                    )}

                    {isPurchased && isMyItem && (
                        <div className="text-coral flex flex-col items-center">
                            <CheckCircle2 className="w-6 h-6 mb-1" />
                            <span className="text-[10px] font-bold uppercase">Comprado</span>
                        </div>
                    )}
                </div>
            )}

            {/* Crowdfunding indication in store mode */}
            {item.crowdfunding && (
                <div className="shrink-0 pl-2">
                    <span className="text-[10px] font-bold text-coral bg-coral/10 px-2 py-1 rounded-full whitespace-nowrap">
                        💰 BOTE
                    </span>
                </div>
            )}
        </div>
    );
}
