"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { WishlistItemCard } from "@/components/wishes/WishlistItemCard";
import { WishlistDetailData, WishlistItemData } from "@/app/app/wishes/item-actions";
import { BookSearchModal } from "@/components/gifts/BookSearchModal";
import { addItemToWishlist } from "@/app/app/wishes/item-actions";
import { Link2, Plus, BookOpen } from "lucide-react";

interface WishlistDetailViewProps {
    wishlist: WishlistDetailData;
    items: WishlistItemData[];
    isOwner: boolean;
}

export function WishlistDetailView({ wishlist, items, isOwner }: WishlistDetailViewProps) {
    const router = useRouter();
    const [isGuestView, setIsGuestView] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [isPending, startTransition] = useTransition();
    const [copied, setCopied] = useState(false);

    const privacyLabel = { public: "Pública", private: "Privada", shared: "Compartida" };

    function handleCopyLink() {
        navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }

    function handleAddBook(book: any) {
        startTransition(async () => {
            await addItemToWishlist(wishlist.id, {
                title: book.title,
                author: book.author,
                coverUrl: book.coverUrl,
                price: book.price,
                bookId: book.id,
            });
            setIsSearchOpen(false);
            router.refresh();
        });
    }

    return (
        <>
            <BookSearchModal
                isOpen={isSearchOpen}
                onClose={() => setIsSearchOpen(false)}
                onAdd={handleAddBook}
            />

            <div className="max-w-4xl mx-auto">
                {/* Breadcrumb */}
                <Link href="/app/wishes" className="text-sm text-grey/60 hover:text-teal mb-6 inline-flex items-center gap-1 group">
                    <span className="group-hover:-translate-x-0.5 transition-transform">←</span> Volver a mis listas
                </Link>

                {/* Header */}
                <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-teal/5 mb-8">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <h1 className="font-serif text-3xl text-teal mb-2">
                                {wishlist.emoji} {wishlist.name}
                            </h1>
                            <div className="flex items-center gap-3 text-sm text-grey/60">
                                <span>{wishlist.bookCount} {wishlist.bookCount === 1 ? "libro" : "libros"}</span>
                                <span>•</span>
                                <span>{privacyLabel[wishlist.privacy]}</span>
                            </div>
                            {wishlist.description && (
                                <p className="text-sm text-grey/70 mt-2 italic">{wishlist.description}</p>
                            )}
                        </div>

                        {/* View Toggle (only for owner) + Guest toggle */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                            {isOwner && (
                                <button
                                    onClick={() => setIsSearchOpen(true)}
                                    disabled={isPending}
                                    className="inline-flex items-center gap-2 bg-coral text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-opacity-90 transition-all shadow-sm"
                                >
                                    <Plus className="w-4 h-4" />
                                    Añadir libro
                                </button>
                            )}
                            <div className="flex items-center gap-2 bg-grey/5 p-1 rounded-full">
                                <button
                                    onClick={() => setIsGuestView(false)}
                                    className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${!isGuestView ? "bg-white shadow-sm text-teal" : "text-grey/60 hover:text-grey"}`}
                                >
                                    👀 Mi Vista
                                </button>
                                <button
                                    onClick={() => setIsGuestView(true)}
                                    className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${isGuestView ? "bg-teal text-white shadow-sm" : "text-grey/60 hover:text-grey"}`}
                                >
                                    👤 Vista Amigo
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Share row */}
                    <div className="mt-6 pt-5 border-t border-grey/10 flex justify-between items-center">
                        <p className="text-xs text-grey/50 italic">
                            {isGuestView
                                ? "Así es como ven la lista tus amigos. Los regalados aparecen bloqueados."
                                : "Tú ves todos los libros. Tus amigos ven los ya comprados bloqueados."}
                        </p>
                        {wishlist.privacy !== "private" && (
                            <button
                                onClick={handleCopyLink}
                                className="inline-flex items-center gap-1.5 text-teal text-sm font-bold hover:underline"
                            >
                                <Link2 className="w-4 h-4" />
                                {copied ? "¡Enlace copiado!" : "Compartir enlace"}
                            </button>
                        )}
                    </div>
                </div>

                {/* Items */}
                {items.length === 0 ? (
                    <div className="text-center py-20 border-2 border-dashed border-teal/10 rounded-2xl">
                        <BookOpen className="w-12 h-12 text-teal/20 mx-auto mb-4" />
                        <p className="text-grey/50 text-lg font-medium mb-2">Esta lista está vacía</p>
                        <p className="text-grey/40 text-sm mb-6">Añade libros que quieres leer o que te gustaría recibir</p>
                        {isOwner && (
                            <button
                                onClick={() => setIsSearchOpen(true)}
                                className="inline-flex items-center gap-2 bg-teal text-white px-6 py-2.5 rounded-full font-medium hover:bg-opacity-90 transition-all"
                            >
                                <Plus className="w-4 h-4" />
                                Buscar libros para añadir
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {items.map((item) => (
                            <WishlistItemCard
                                key={item.id}
                                item={item}
                                isGuestView={isGuestView}
                                onReserve={() => alert("En la app real, esto reservaría el libro para que nadie más lo compre 🤫")}
                            />
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}
