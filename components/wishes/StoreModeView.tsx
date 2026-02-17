'use client';

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Wishlist, WishlistItem } from "@/lib/mock-data";

interface StoreModeViewProps {
    wishlist: Wishlist;
    items: WishlistItem[];
}

export function StoreModeView({ wishlist, items }: StoreModeViewProps) {
    // Filter out purchased items automatically for store mode, or keep them dims?
    // Store mode focus: What do I need to buy?
    // Let's show available and reserved (if I am the one who reserved it? No, simplistic for now).
    // Let's show ALL but grouped.

    // Mock "In Basket" state for this session
    const [basket, setBasket] = useState<string[]>([]);

    const availableItems = items.filter(i => i.status === 'AVAILABLE' || (i.status === 'RESERVED' && i.crowdfunding)); // Crowdfunding is "available" to contribute
    const completedItems = items.filter(i => i.status === 'PURCHASED' || (i.status === 'RESERVED' && !i.crowdfunding));

    const toggleBasket = (id: string) => {
        setBasket(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    return (
        <div className="min-h-screen bg-cream text-black font-sans pb-20">
            {/* Minimal Header */}
            <div className="bg-teal text-white p-4 sticky top-0 z-10 shadow-md flex justify-between items-center">
                <div>
                    <Link href={`/app/wishes/${wishlist.id}`} className="text-white/60 text-xs font-bold uppercase tracking-wider mb-1 block">
                        ← Volver a la lista
                    </Link>
                    <h1 className="font-serif font-bold text-xl leading-none">{wishlist.name}</h1>
                </div>
                <div className="bg-white/10 p-2 rounded-lg">
                    <span className="text-2xl">🛍️</span>
                </div>
            </div>

            <div className="p-4 max-w-md mx-auto">
                {/* Intro Card */}
                <div className="bg-white rounded-xl p-4 shadow-sm border border-black/5 mb-6 text-sm text-center">
                    <p className="text-grey/80">
                        Estás en el <strong>Modo Tienda</strong>. Esta vista simplificada te ayuda a encontrar los libros en la librería física.
                    </p>
                </div>

                {/* Shopping List */}
                <div className="space-y-4">
                    <h2 className="text-sm font-bold text-grey/60 uppercase tracking-widest mb-2">Por Comprar ({availableItems.length})</h2>

                    {availableItems.length === 0 && (
                        <p className="text-center py-8 text-grey/40 italic">¡No queda nada por comprar en esta lista!</p>
                    )}

                    {availableItems.map(item => {
                        const isInBasket = basket.includes(item.id);
                        return (
                            <div
                                key={item.id}
                                onClick={() => toggleBasket(item.id)}
                                className={`flex gap-3 p-3 rounded-xl border transition-all cursor-pointer select-none ${isInBasket ? 'bg-teal/5 border-teal shadow-inner' : 'bg-white border-black/5 shadow-sm'}`}
                            >
                                {/* Checkbox */}
                                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors shrink-0 mt-1 ${isInBasket ? 'bg-teal border-teal' : 'border-grey/30'}`}>
                                    {isInBasket && <span className="text-white text-xs font-bold">✓</span>}
                                </div>

                                {/* Book Info */}
                                <div className="flex-1 min-w-0">
                                    <h3 className={`font-serif font-bold text-lg leading-tight ${isInBasket ? 'text-teal line-through opacity-70' : 'text-black'}`}>
                                        {item.title}
                                    </h3>
                                    <p className="text-sm text-grey">{item.author}</p>

                                    {item.crowdfunding ? (
                                        <div className="text-xs font-bold text-coral mt-1 bg-coral/10 inline-block px-1.5 py-0.5 rounded">
                                            🎁 Crowdfunding activo
                                        </div>
                                    ) : (
                                        <div className="text-sm font-bold text-teal mt-1">
                                            {item.price.toFixed(2)}€
                                        </div>
                                    )}
                                </div>

                                {/* Mini Cover */}
                                <div className="w-12 h-16 relative overflow-hidden rounded shrink-0 opacity-80 decoration-slate-50">
                                    <Image src={item.coverUrl} alt={item.title} fill className="object-cover" />
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Already Purchased (Collapsed/Dimmed) */}
                {completedItems.length > 0 && (
                    <div className="mt-8 pt-6 border-t border-black/5 opacity-60 grayscale">
                        <h2 className="text-xs font-bold text-grey/60 uppercase tracking-widest mb-3">Ya conseguidos ({completedItems.length})</h2>
                        <div className="space-y-2">
                            {completedItems.map(item => (
                                <div key={item.id} className="flex justify-between items-center text-sm p-2 bg-grey/5 rounded">
                                    <span className="truncate flex-1 font-medium">{item.title}</span>
                                    <span className="text-xs bg-grey/20 px-2 py-1 rounded ml-2 whitespace-nowrap">
                                        {item.status === 'PURCHASED' ? 'Comprado' : 'Reservado'}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Float Action Button or Total */}
            {basket.length > 0 && (
                <div className="fixed bottom-4 left-4 right-4 max-w-md mx-auto bg-black text-white p-4 rounded-xl shadow-2xl flex justify-between items-center">
                    <div>
                        <span className="text-xs text-grey/60 uppercase font-bold block">En tu cesta</span>
                        <span className="font-serif font-bold text-lg">{basket.length} libros</span>
                    </div>
                    <button className="bg-teal text-white px-6 py-2 rounded-full font-bold hover:bg-teal-light transition-colors">
                        Finalizar Compra
                    </button>
                </div>
            )}
        </div>
    );
}
