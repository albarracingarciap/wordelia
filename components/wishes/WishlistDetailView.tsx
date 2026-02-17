'use client';

import { useState } from "react";
import { WishlistItemCard } from "@/components/wishes/WishlistItemCard";
import { MOCK_WISHLISTS, MOCK_ITEMS } from "@/lib/mock-data";
import Link from "next/link";
import { Wishlist } from "@/lib/mock-data";

import { WishlistItem } from "@/lib/mock-data";

interface WishlistDetailViewProps {
    initialWishlist: Wishlist;
    initialItems: WishlistItem[];
    id: string;
}

export function WishlistDetailView({ initialWishlist, initialItems, id }: WishlistDetailViewProps) {
    // Find list details - passed from server or fallback
    const wishlist = initialWishlist;
    const items = initialItems;

    // View State
    const [isGuestView, setIsGuestView] = useState(false);

    // Mock reserve function
    const handleReserve = (itemId: string) => {
        alert("¡En la app real, esto reservaría el libro para que nadie más lo compre! 🤫");
    };

    return (
        <div className="max-w-4xl mx-auto">

            {/* Breadcrumb */}
            <Link href="/app/wishes" className="text-sm text-grey/60 hover:text-teal mb-6 inline-block">
                ← Volver a mis listas
            </Link>

            {/* Header with Toggle */}
            <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-teal/5 mb-8 relative overflow-hidden">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="font-serif text-3xl md:text-3xl text-teal mb-2">{wishlist.name}</h1>
                        <div className="flex items-center gap-3 text-sm text-grey/60">
                            <span>{wishlist.bookCount} libros</span>
                            <span>•</span>
                            <span className="capitalize">{wishlist.privacy}</span>
                        </div>
                        {isGuestView && (
                            <div className="mt-2">
                                <Link
                                    href={`/app/wishes/${id}/store-mode`}
                                    className="inline-flex items-center gap-1 text-xs font-bold text-teal border border-teal/20 px-3 py-1 rounded-full hover:bg-teal hover:text-white transition-all"
                                >
                                    <span>🛍️</span> Modo Tienda
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* View Toggle */}
                    <div className="flex items-center gap-3 bg-grey/5 p-1 rounded-full">
                        <button
                            onClick={() => setIsGuestView(false)}
                            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${!isGuestView ? 'bg-white shadow-sm text-teal' : 'text-grey/60 hover:text-grey'}`}
                        >
                            👀 Mi Vista
                        </button>
                        <button
                            onClick={() => setIsGuestView(true)}
                            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${isGuestView ? 'bg-teal text-white shadow-sm' : 'text-grey/60 hover:text-grey'}`}
                        >
                            👤 Vista Amigo
                        </button>
                    </div>
                </div>

                {/* Share Button (Only for owner view effectively, but visible always here for demo) */}
                <div className="mt-6 pt-6 border-t border-grey/10 flex justify-between items-center">
                    <div className="text-xs text-grey/60 italic">
                        {isGuestView ? "Así es como ven la lista tus amigos." : "Tú ves todos los libros disponibles. Tus amigos ven los comprados bloqueados."}
                    </div>
                    <button className="text-teal text-sm font-bold hover:underline flex items-center gap-1">
                        🔗 Compartir enlace
                    </button>
                </div>
            </div>

            {/* List Items */}
            <div className="grid gap-4">
                {/* If empty/fallback */}
                {items.length === 0 && (
                    <div className="text-center py-12 text-grey/40 italic">
                        Esta lista está vacía... por ahora.
                        {/* Mock items for id=1 always just for visual demo if empty */}
                        {id !== '1' && <p className="text-xs mt-2">(Prueba con la lista 'Cumpleaños 2024' para ver datos de ejemplo)</p>}
                    </div>
                )}

                {items.map(item => (
                    <WishlistItemCard
                        key={item.id}
                        item={item}
                        isGuestView={isGuestView}
                        onReserve={() => handleReserve(item.id)}
                    />
                ))}
            </div>

            {/* Example of "Gift Idea" implementation from Plan - Phase 2 teaser */}
            <div className="mt-12 p-6 rounded-xl border-2 border-dashed border-teal/10 bg-teal/5 text-center">
                <p className="text-teal font-medium mb-3">¿Buscas algo más?</p>
                <button className="bg-white text-teal border border-teal/20 px-6 py-2 rounded-full hover:shadow-md transition-all text-sm font-bold">
                    🔍 Buscar libros para añadir
                </button>
            </div>

        </div>
    );
}
