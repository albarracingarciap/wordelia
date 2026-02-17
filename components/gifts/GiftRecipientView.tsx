'use client';

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { BookSearchModal } from "@/components/gifts/BookSearchModal";
import { MOCK_ITEMS, GiftRecipient } from "@/lib/mock-data";

interface GiftRecipientViewProps {
    recipient: GiftRecipient;
    id: string;
}

export function GiftRecipientView({ recipient, id }: GiftRecipientViewProps) {
    // Mock "Gift Ideas" (reusing wishlist items for demo)
    const [giftIdeas, setGiftIdeas] = useState(MOCK_ITEMS.slice(0, 2));
    const [isSearchOpen, setIsSearchOpen] = useState(false);

    const handleAddBook = (book: any) => {
        // Transform search result to wish item format
        const newItem = {
            id: Date.now().toString(),
            wishlistId: 'temp',
            title: book.title,
            author: book.author,
            coverUrl: book.coverUrl,
            price: 19.99, // default
            priority: 'MEDIUM', // Mock fix: explicitly cast to type if needed, but 'MEDIUM' is valid
            status: 'AVAILABLE'
        } as const; // simple cast for now

        // @ts-ignore - quick mock fix for type mismatch if any
        setGiftIdeas([...giftIdeas, newItem]);
        setIsSearchOpen(false);
    };

    return (
        <div className="max-w-4xl mx-auto">
            <BookSearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} onAdd={handleAddBook} />

            <Link href="/app/wishes" className="text-sm text-grey/60 hover:text-teal mb-6 inline-block">
                ← Volver a mis listas
            </Link>

            {/* Profile Header */}
            <div className="flex items-center gap-6 mb-10">
                <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-lg">
                    <Image src={recipient.avatarUrl} alt={recipient.name} width={96} height={96} className="object-cover h-full w-full" />
                </div>
                <div>
                    <h1 className="font-serif text-3xl md:text-4xl text-teal font-bold">{recipient.name}</h1>
                    <p className="text-grey/80">{recipient.relation}</p>
                    {recipient.notes && (
                        <div className="mt-2 bg-yellow-100/50 text-xs text-yellow-800 px-3 py-1 rounded-md inline-block border border-yellow-200/50">
                            📝 {recipient.notes}
                        </div>
                    )}
                </div>
                <div className="ml-auto text-right hidden sm:block">
                    {recipient.upcomingEvent && (
                        <div className="text-coral">
                            <p className="text-xs font-bold uppercase tracking-wider">Próximo evento</p>
                            <p className="text-2xl font-serif font-bold">{recipient.upcomingEvent.name}</p>
                            <p className="text-sm">{recipient.upcomingEvent.date}</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Gift Ideas Section */}
            <div className="flex justify-between items-center mb-6 border-b border-black/5 pb-4">
                <h2 className="font-serif text-2xl text-teal">Ideas de Regalo ({giftIdeas.length})</h2>
                <button
                    onClick={() => setIsSearchOpen(true)}
                    className="bg-teal text-white px-4 py-2 rounded-full text-sm font-bold hover:bg-teal-dark flex items-center gap-2 shadow-sm"
                >
                    <span>＋</span> Añadir Idea
                </button>
            </div>

            <div className="grid gap-4">
                {giftIdeas.map(item => (
                    <div key={item.id} className="bg-white p-4 rounded-xl border border-teal/10 flex gap-4 hover:shadow-md transition-all group">
                        <div className="relative w-16 h-24 shrink-0 shadow-sm">
                            <Image src={item.coverUrl} alt={item.title} fill className="object-cover rounded" />
                        </div>
                        <div className="flex-1 flex flex-col justify-between">
                            <div>
                                <h3 className="font-bold text-teal text-lg">{item.title}</h3>
                                <p className="text-sm text-grey">{item.author}</p>
                            </div>
                            <div className="flex items-center gap-4 mt-2">
                                <span className="text-sm font-bold text-teal">{item.price.toFixed(2)}€</span>
                                <span className="text-xs px-2 py-0.5 rounded-full bg-grey/10 text-grey font-medium">PENDIENTE</span>
                            </div>
                        </div>
                        <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity justify-center">
                            <button className="p-2 text-grey hover:text-coral rounded-full hover:bg-coral/10" title="Eliminar">🗑️</button>
                            <button className="p-2 text-grey hover:text-teal rounded-full hover:bg-teal/10" title="Marcar comprado">🎁</button>
                        </div>
                    </div>
                ))}

                {giftIdeas.length === 0 && (
                    <div className="text-center py-12 border-2 border-dashed border-grey/10 rounded-xl">
                        <p className="text-grey/40 mb-4">No tienes ideas guardadas para {recipient.name} aún.</p>
                        <button onClick={() => setIsSearchOpen(true)} className="text-teal hover:underline font-bold">¡Busca algo inspirador!</button>
                    </div>
                )}
            </div>
        </div>
    );
}
