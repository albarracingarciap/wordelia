import { useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ReservedItemData } from "@/app/app/wishes/gift-actions";
import { cancelReservation, markWishlistItemPurchased } from "@/app/app/wishes/item-actions";
import { CheckCircle2, X } from "lucide-react";
import { ConfirmModal } from "@/components/ui/ConfirmModal";

interface ReservedItemCardProps {
    item: ReservedItemData;
}

export function ReservedItemCard({ item }: ReservedItemCardProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [isCancelConfirmOpen, setCancelConfirmOpen] = useState(false);

    function handleConfirmPurchase() {
        startTransition(async () => {
            await markWishlistItemPurchased(item.id, item.wishlistId);
            router.refresh();
        });
    }

    function confirmCancelReservation() {
        startTransition(async () => {
            await cancelReservation(item.id, item.wishlistId);
            setCancelConfirmOpen(false);
            router.refresh();
        });
    }

    const isPurchased = item.status === "PURCHASED";

    return (
        <div className={`bg-white border rounded-2xl p-4 flex gap-4 transition-all shadow-sm ${isPurchased ? "border-teal/20 bg-teal/5" : "border-grey/10 hover:border-teal/30"} ${isPending ? "opacity-50 pointer-events-none" : ""}`}>
            {/* Cover */}
            <div className="relative w-16 h-24 shrink-0 rounded overflow-hidden bg-grey/10">
                {item.coverUrl ? (
                    <Image
                        src={item.coverUrl}
                        alt={item.title}
                        fill
                        sizes="(max-width: 768px) 64px, 64px"
                        className="object-cover"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs text-grey/40">📚</div>
                )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 flex flex-col justify-center">
                <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${isPurchased ? "bg-teal/20 text-teal" : "bg-coral/10 text-coral"}`}>
                        {isPurchased ? "Comprado" : "Reservado"}
                    </span>
                    <span className="text-[10px] font-medium text-grey/50 truncate">
                        Para: <Link href={`/app/wishes/${item.wishlistId}?view=guest`} className="hover:text-teal hover:underline">{item.wishlistName}</Link>
                    </span>
                </div>

                <h4 className="font-serif font-bold text-teal leading-tight truncate mb-0.5">
                    {item.title}
                </h4>
                {item.author && <p className="text-xs text-grey/80 truncate mb-1">{item.author}</p>}

                {item.price != null && (
                    <p className="text-sm font-medium text-teal/80">
                        {item.price.toFixed(2)}€
                    </p>
                )}
            </div>

            {/* Actions */}
            <div className="shrink-0 flex flex-col items-end justify-between border-l border-grey/10 pl-4 py-1 ml-auto">
                <button
                    onClick={() => setCancelConfirmOpen(true)}
                    disabled={isPending}
                    className="p-1.5 text-grey/40 hover:text-coral hover:bg-coral/10 rounded-full transition-colors"
                    title="Cancelar reserva"
                >
                    <X className="w-4 h-4" />
                </button>

                {!isPurchased && (
                    <button
                        onClick={handleConfirmPurchase}
                        disabled={isPending}
                        className="flex items-center gap-1.5 text-xs font-bold text-white bg-coral px-3 py-1.5 rounded-full hover:bg-opacity-90 transition-all shadow-sm"
                    >
                        <CheckCircle2 className="w-4 h-4" />
                        Comprado
                    </button>
                )}

                {isPurchased && (
                    <div className="flex items-center gap-1 text-teal text-xs font-bold px-3 py-1.5">
                        <CheckCircle2 className="w-4 h-4" />
                        Confirmado
                    </div>
                )}
            </div>

            <ConfirmModal
                open={isCancelConfirmOpen}
                title="Cancelar reserva"
                message="El regalo volverá a estar disponible para otras personas. ¿Cancelar la reserva?"
                confirmLabel="Cancelar reserva"
                cancelLabel="Volver"
                tone="danger"
                busy={isPending}
                onConfirm={confirmCancelReservation}
                onCancel={() => setCancelConfirmOpen(false)}
            />
        </div>
    );
}
