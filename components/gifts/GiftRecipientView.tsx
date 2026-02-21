"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BookSearchModal } from "@/components/gifts/BookSearchModal";
import { GiftRecipientDetailData, GiftIdeaData, addGiftIdea, markGiftIdeaAsPurchased, deleteGiftIdea } from "@/app/app/wishes/gift-idea-actions";
import { Gift, Trash2, Plus } from "lucide-react";

interface GiftRecipientViewProps {
    recipient: GiftRecipientDetailData;
    ideas: GiftIdeaData[];
}

export function GiftRecipientView({ recipient, ideas: initialIdeas }: GiftRecipientViewProps) {
    const router = useRouter();
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [isPending, startTransition] = useTransition();

    function handleAddBook(book: any) {
        startTransition(async () => {
            await addGiftIdea(recipient.id, {
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

    function handleMarkPurchased(ideaId: string) {
        startTransition(async () => {
            await markGiftIdeaAsPurchased(ideaId, recipient.id);
            router.refresh();
        });
    }

    function handleDelete(ideaId: string) {
        startTransition(async () => {
            await deleteGiftIdea(ideaId, recipient.id);
            router.refresh();
        });
    }

    const pendingIdeas = initialIdeas.filter(i => !i.isPurchased);
    const purchasedIdeas = initialIdeas.filter(i => i.isPurchased);

    return (
        <>
            <BookSearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} onAdd={handleAddBook} />

            <div className="max-w-4xl mx-auto">
                <Link href="/app/wishes?tab=gifts" className="text-sm text-grey/60 hover:text-teal mb-6 inline-flex items-center gap-1 group">
                    <span className="group-hover:-translate-x-0.5 transition-transform">←</span> Volver a mis regalos
                </Link>

                {/* Profile Header */}
                <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-teal/5 mb-8">
                    <div className="flex items-start gap-6">
                        {/* Avatar */}
                        <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-cream shadow-md shrink-0 bg-teal/10 flex items-center justify-center">
                            {recipient.avatarUrl ? (
                                <Image src={recipient.avatarUrl} alt={recipient.name} width={80} height={80} className="object-cover h-full w-full" />
                            ) : (
                                <span className="text-3xl font-bold text-teal">{recipient.name.charAt(0).toUpperCase()}</span>
                            )}
                        </div>

                        <div className="flex-1">
                            <h1 className="font-serif text-3xl text-teal font-bold">{recipient.name}</h1>
                            {recipient.relation && <p className="text-grey/70 mt-0.5">{recipient.relation}</p>}
                            {recipient.notes && (
                                <div className="mt-3 bg-yellow-50 text-yellow-800 text-xs px-3 py-2 rounded-lg border border-yellow-200/60 inline-block max-w-sm">
                                    📝 {recipient.notes}
                                </div>
                            )}
                        </div>

                        {/* Upcoming Event */}
                        {recipient.upcomingEvent && (
                            <div className="text-right shrink-0 hidden sm:block">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-coral/70">Próximo evento</p>
                                <p className="font-serif text-2xl text-coral font-bold">{recipient.upcomingEvent.name}</p>
                                <p className={`text-sm font-medium ${recipient.upcomingEvent.daysLeft <= 7 ? "text-coral" : "text-grey/60"}`}>
                                    {recipient.upcomingEvent.daysLeft <= 0 ? "¡Hoy!" : `en ${recipient.upcomingEvent.daysLeft} días`}
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Gift Ideas Section */}
                <div className="flex justify-between items-center mb-6 border-b border-black/5 pb-4">
                    <h2 className="font-serif text-2xl text-teal">
                        Ideas de Regalo
                        <span className="ml-2 text-base font-sans text-grey/40">({initialIdeas.length})</span>
                    </h2>
                    <button
                        onClick={() => setIsSearchOpen(true)}
                        disabled={isPending}
                        className="inline-flex items-center gap-2 bg-teal text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-opacity-90 transition-all shadow-sm"
                    >
                        <Plus className="w-4 h-4" />
                        Añadir Idea
                    </button>
                </div>

                {/* Pending Ideas */}
                {pendingIdeas.length === 0 && purchasedIdeas.length === 0 ? (
                    <div className="text-center py-16 border-2 border-dashed border-teal/10 rounded-2xl">
                        <Gift className="w-12 h-12 text-teal/20 mx-auto mb-4" />
                        <p className="text-grey/50 text-lg font-medium mb-2">Aún no hay ideas guardadas</p>
                        <p className="text-grey/40 text-sm mb-6">Busca el libro perfecto para {recipient.name}</p>
                        <button
                            onClick={() => setIsSearchOpen(true)}
                            className="inline-flex items-center gap-2 bg-teal text-white px-6 py-2.5 rounded-full font-medium hover:bg-opacity-90 transition-all"
                        >
                            <Plus className="w-4 h-4" />
                            Buscar libros
                        </button>
                    </div>
                ) : (
                    <div className="space-y-8">
                        {pendingIdeas.length > 0 && (
                            <div className="grid gap-4">
                                {pendingIdeas.map(idea => (
                                    <GiftIdeaCard
                                        key={idea.id}
                                        idea={idea}
                                        isPending={isPending}
                                        onMarkPurchased={() => handleMarkPurchased(idea.id)}
                                        onDelete={() => handleDelete(idea.id)}
                                    />
                                ))}
                            </div>
                        )}

                        {/* Purchased ideas (collapsed section) */}
                        {purchasedIdeas.length > 0 && (
                            <details className="group">
                                <summary className="cursor-pointer text-sm text-grey/50 font-medium hover:text-grey list-none flex items-center gap-2 mb-3">
                                    <span className="group-open:rotate-90 transition-transform inline-block">▶</span>
                                    Ya comprados ({purchasedIdeas.length})
                                </summary>
                                <div className="grid gap-4 mt-3">
                                    {purchasedIdeas.map(idea => (
                                        <GiftIdeaCard
                                            key={idea.id}
                                            idea={idea}
                                            isPending={isPending}
                                            onMarkPurchased={() => { }}
                                            onDelete={() => handleDelete(idea.id)}
                                        />
                                    ))}
                                </div>
                            </details>
                        )}
                    </div>
                )}
            </div>
        </>
    );
}

// --- Sub-component ---

interface GiftIdeaCardProps {
    idea: GiftIdeaData;
    isPending: boolean;
    onMarkPurchased: () => void;
    onDelete: () => void;
}

function GiftIdeaCard({ idea, isPending, onMarkPurchased, onDelete }: GiftIdeaCardProps) {
    return (
        <div className={`bg-white p-4 rounded-xl border border-teal/10 flex gap-4 hover:shadow-md transition-all group ${idea.isPurchased ? "opacity-60" : ""} ${isPending ? "opacity-50" : ""}`}>
            {/* Cover */}
            <div className="relative w-16 h-24 shrink-0 rounded-md overflow-hidden shadow-sm bg-grey/10">
                {idea.coverUrl ? (
                    <Image src={idea.coverUrl} alt={idea.title} fill className={`object-cover ${idea.isPurchased ? "grayscale" : ""}`} />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-grey/30">📚</div>
                )}
                {idea.isPurchased && (
                    <div className="absolute inset-0 bg-teal/20 flex items-center justify-center">
                        <span className="text-2xl">🎁</span>
                    </div>
                )}
            </div>

            <div className="flex-1 flex flex-col justify-between">
                <div>
                    <h3 className={`font-bold text-lg ${idea.isPurchased ? "text-grey line-through" : "text-teal"}`}>{idea.title}</h3>
                    {idea.author && <p className="text-sm text-grey/70">{idea.author}</p>}
                    {idea.privateNote && (
                        <p className="text-xs text-grey/50 italic mt-1 bg-cream/50 px-2 py-1 rounded">{idea.privateNote}</p>
                    )}
                </div>
                <div className="flex justify-between items-center mt-2">
                    <span className="text-sm font-medium text-teal/80">
                        {idea.price != null ? `${idea.price.toFixed(2)}€` : "—"}
                    </span>
                    {idea.isPurchased ? (
                        <span className="text-xs text-teal font-bold bg-teal/10 px-3 py-1 rounded-full">✓ Comprado</span>
                    ) : (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-grey/10 text-grey font-medium">Pendiente</span>
                    )}
                </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity justify-center">
                {!idea.isPurchased && (
                    <button
                        onClick={onMarkPurchased}
                        disabled={isPending}
                        title="Marcar como comprado"
                        className="p-2 text-grey/40 hover:text-teal hover:bg-teal/10 rounded-full transition-colors"
                    >
                        <Gift className="w-4 h-4" />
                    </button>
                )}
                <button
                    onClick={onDelete}
                    disabled={isPending}
                    title="Eliminar idea"
                    className="p-2 text-grey/40 hover:text-coral hover:bg-coral/10 rounded-full transition-colors"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}
