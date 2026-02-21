import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { WishlistItemData, WishlistDetailData } from "@/app/app/wishes/item-actions";
import { StoreModeCard } from "./StoreModeCard";
import { Store, X } from "lucide-react";

interface StoreModeViewProps {
    wishlist: WishlistDetailData;
    items: WishlistItemData[];
    isGuestView: boolean;
    onExit: () => void;
}

export function StoreModeView({ wishlist, items, isGuestView, onExit }: StoreModeViewProps) {
    const [mounted, setMounted] = useState(false);
    const [myItems, setMyItems] = useState<string[]>([]);

    useEffect(() => {
        setMounted(true);
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = "auto";
        };
    }, []);

    useEffect(() => {
        const stored = localStorage.getItem("wordelia_my_items");
        if (stored) {
            try {
                setMyItems(JSON.parse(stored));
            } catch (e) { }
        }
    }, []);

    function handleReservationChange(newMyItems: string[]) {
        setMyItems(newMyItems);
        localStorage.setItem("wordelia_my_items", JSON.stringify(newMyItems));
    }

    if (!mounted) return null;

    return createPortal(
        <div className="fixed inset-0 z-[100] bg-cream flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-300">
            {/* Header */}
            <div className="bg-teal text-white p-4 shadow-md flex items-center justify-between shrink-0 safe-area-top">
                <div className="flex items-center gap-3 min-w-0">
                    <Store className="w-6 h-6 shrink-0" />
                    <div className="min-w-0">
                        <h2 className="font-serif font-bold text-xl leading-tight truncate">Modo Tienda</h2>
                        <p className="text-xs opacity-80 truncate">{wishlist.name}</p>
                    </div>
                </div>
                <button
                    onClick={onExit}
                    className="flex shrink-0 items-center justify-center gap-2 px-4 py-2 bg-coral text-white rounded-full font-bold shadow-md hover:scale-105 transition-all ml-4"
                    title="Salir del Modo Tienda"
                >
                    <X className="w-5 h-5" />
                    <span>Salir</span>
                </button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 pb-safe">
                {items.length === 0 ? (
                    <div className="text-center py-20 text-grey/50">
                        No hay libros en esta lista.
                    </div>
                ) : (
                    items.map(item => (
                        <StoreModeCard
                            key={item.id}
                            item={item}
                            isGuestView={isGuestView}
                            myItems={myItems}
                            onReservationChange={handleReservationChange}
                        />
                    ))
                )}
            </div>

            {/* Footer helper text */}
            {isGuestView && (
                <div className="p-4 bg-white border-t border-grey/10 text-center text-xs text-grey/60 shrink-0 pb-safe">
                    Pulsa el icono de regalo para reservar un libro mientras lo buscas en la tienda.
                </div>
            )}
        </div>,
        document.body
    );
}
