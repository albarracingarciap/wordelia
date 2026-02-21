"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { WishlistCard } from "@/components/wishes/WishlistCard";
import { PersonCard } from "@/components/gifts/PersonCard";
import { EmptyWishlists } from "@/components/wishes/EmptyWishlists";
import { EmptyGiftRecipients } from "@/components/gifts/EmptyGiftRecipients";
import { CreateWishlistModal } from "@/components/wishes/CreateWishlistModal";
import { AddGiftRecipientModal } from "@/components/gifts/AddGiftRecipientModal";
import { ReservedItemCard } from "@/components/gifts/ReservedItemCard";
import { WishlistData } from "@/app/app/wishes/wishlist-actions";
import { GiftRecipientData, ReservedItemData } from "@/app/app/wishes/gift-actions";

interface WishesDashboardClientProps {
    initialWishlists: WishlistData[];
    initialRecipients: GiftRecipientData[];
    initialReservations: ReservedItemData[];
}

export function WishesDashboardClient({ initialWishlists, initialRecipients, initialReservations }: WishesDashboardClientProps) {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<"wishes" | "gifts">("wishes");
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showAddRecipientModal, setShowAddRecipientModal] = useState(false);

    const handleSuccess = useCallback(() => {
        setShowCreateModal(false);
        setShowAddRecipientModal(false);
        router.refresh(); // Re-run Server Component to reload data
    }, [router]);

    return (
        <>
            <div className="space-y-8">
                {/* Header */}
                <div className="flex flex-col gap-6">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div>
                            <h1 className="font-serif text-3xl md:text-4xl text-teal mb-2">Lista de Deseos ✨</h1>
                            <p className="text-grey text-lg max-w-xl">
                                Gestiona tus sueños y los regalos para tus seres queridos.
                            </p>
                        </div>

                        {/* Primary Action Button (changes by tab) */}
                        {activeTab === "wishes" ? (
                            <button
                                onClick={() => setShowCreateModal(true)}
                                className="bg-coral text-white px-6 py-2.5 rounded-full font-medium hover:bg-opacity-90 transition-all shadow-sm flex items-center gap-2 whitespace-nowrap"
                            >
                                <span>＋</span> Crear Nueva Lista
                            </button>
                        ) : (
                            <button
                                onClick={() => setShowAddRecipientModal(true)}
                                className="bg-teal text-white px-6 py-2.5 rounded-full font-medium hover:bg-opacity-90 transition-all shadow-sm flex items-center gap-2 whitespace-nowrap"
                            >
                                <span>👤</span> Añadir Persona
                            </button>
                        )}
                    </div>

                    {/* Tabs */}
                    <div className="flex border-b border-grey/10">
                        <button
                            onClick={() => setActiveTab("wishes")}
                            className={`px-6 py-3 font-medium text-sm transition-all relative ${activeTab === "wishes" ? "text-teal" : "text-grey/60 hover:text-grey"}`}
                        >
                            Mis Deseos
                            {activeTab === "wishes" && initialWishlists.length > 0 && (
                                <span className="ml-2 text-xs bg-teal/10 text-teal rounded-full px-1.5 py-0.5">
                                    {initialWishlists.length}
                                </span>
                            )}
                            {activeTab === "wishes" && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-teal rounded-t-full" />}
                        </button>
                        <button
                            onClick={() => setActiveTab("gifts")}
                            className={`px-6 py-3 font-medium text-sm transition-all relative ${activeTab === "gifts" ? "text-teal" : "text-grey/60 hover:text-grey"}`}
                        >
                            Mis Regalos
                            {activeTab === "gifts" && initialRecipients.length > 0 && (
                                <span className="ml-2 text-xs bg-teal/10 text-teal rounded-full px-1.5 py-0.5">
                                    {initialRecipients.length}
                                </span>
                            )}
                            {activeTab === "gifts" && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-teal rounded-t-full" />}
                        </button>
                    </div>
                </div>

                {/* Content — Wishes */}
                {activeTab === "wishes" && (
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                        {initialWishlists.length === 0 ? (
                            <EmptyWishlists onCreateClick={() => setShowCreateModal(true)} />
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                {initialWishlists.map((list) => (
                                    <WishlistCard key={list.id} wishlist={list} />
                                ))}

                                {/* Add New Card */}
                                <button
                                    onClick={() => setShowCreateModal(true)}
                                    className="group border-2 border-dashed border-teal/20 rounded-xl p-8 flex flex-col items-center justify-center gap-4 hover:border-teal/50 hover:bg-teal/5 transition-all min-h-[180px] text-grey/60 hover:text-teal"
                                >
                                    <div className="w-12 h-12 rounded-full bg-teal/10 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform duration-300">
                                        ＋
                                    </div>
                                    <span className="font-medium">Crear otra lista</span>
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* Content — Gifts */}
                {activeTab === "gifts" && (
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-8">
                        {initialRecipients.length === 0 ? (
                            <EmptyGiftRecipients onAddClick={() => setShowAddRecipientModal(true)} />
                        ) : (
                            <>
                                {/* Urgent Reminder Banner (only if someone has an event in 7 days) */}
                                {initialRecipients.some(r => r.upcomingEvent && r.upcomingEvent.daysLeft !== null && r.upcomingEvent.daysLeft <= 7) && (
                                    <div className="bg-white border-l-4 border-coral p-4 rounded-r-xl shadow-sm flex items-start gap-3">
                                        <span className="text-2xl">💡</span>
                                        <div>
                                            <h4 className="font-bold text-teal text-sm">Recordatorio Inteligente</h4>
                                            {initialRecipients
                                                .filter(r => r.upcomingEvent && r.upcomingEvent.daysLeft !== null && r.upcomingEvent.daysLeft <= 7)
                                                .slice(0, 1)
                                                .map(r => (
                                                    <p key={r.id} className="text-grey text-xs mt-1">
                                                        Se acerca el <span className="font-bold">{r.upcomingEvent!.name}</span> de{" "}
                                                        <span className="font-bold">{r.name}</span> ({r.upcomingEvent!.daysLeft} días).
                                                        Tienes {r.giftIdeasCount} ideas guardadas.
                                                    </p>
                                                ))}
                                        </div>
                                    </div>
                                )}

                                {/* Personas Section */}
                                <div className="space-y-4">
                                    <h3 className="font-serif text-xl text-teal">Personas a las que regalo</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {initialRecipients.map((person) => (
                                            <PersonCard key={person.id} recipient={person} />
                                        ))}

                                        {/* Add Friend Card */}
                                        <button
                                            onClick={() => setShowAddRecipientModal(true)}
                                            className="group border-2 border-dashed border-teal/20 rounded-xl p-6 flex items-center justify-center gap-4 hover:border-teal/50 hover:bg-teal/5 transition-all text-grey/60 hover:text-teal h-[120px]"
                                        >
                                            <div className="w-10 h-10 rounded-full bg-teal/10 flex items-center justify-center text-xl group-hover:scale-110 transition-transform duration-300">
                                                ＋
                                            </div>
                                            <span className="font-medium">Añadir nuevo perfil</span>
                                        </button>
                                    </div>
                                </div>

                                {/* Reservas Section */}
                                {initialReservations.length > 0 && (
                                    <div className="space-y-4 pt-8 border-t border-grey/10">
                                        <h3 className="font-serif text-xl text-teal">Mis Reservas y Compras</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                            {initialReservations.map((item) => (
                                                <ReservedItemCard key={item.id} item={item} />
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                )}
            </div>

            {/* Modals */}
            <CreateWishlistModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onSuccess={handleSuccess}
            />
            <AddGiftRecipientModal
                isOpen={showAddRecipientModal}
                onClose={() => setShowAddRecipientModal(false)}
                onSuccess={handleSuccess}
            />
        </>
    );
}
