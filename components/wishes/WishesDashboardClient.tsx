"use client";

import { useState, useCallback, useEffect, type ComponentType } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Button } from "@/components/ui/Button";
import { WishlistCard } from "@/components/wishes/WishlistCard";
import { PersonCard } from "@/components/gifts/PersonCard";
import { EmptyWishlists } from "@/components/wishes/EmptyWishlists";
import { EmptyGiftRecipients } from "@/components/gifts/EmptyGiftRecipients";
import { CreateWishlistModal } from "@/components/wishes/CreateWishlistModal";
import { AddGiftRecipientModal } from "@/components/gifts/AddGiftRecipientModal";
import { ReservedItemCard } from "@/components/gifts/ReservedItemCard";
import { GiftStoreModeView } from "@/components/gifts/GiftStoreModeView";
import { WishlistData } from "@/app/app/wishes/wishlist-actions";
import { GiftRecipientData, ReservedItemData } from "@/app/app/wishes/gift-actions";
import { CalendarDays, Gift, Plus, ShoppingBag, Store, UserRound } from "lucide-react";

interface WishesDashboardClientProps {
    initialWishlists: WishlistData[];
    initialRecipients: GiftRecipientData[];
    initialReservations: ReservedItemData[];
}

export function WishesDashboardClient({ initialWishlists, initialRecipients, initialReservations }: WishesDashboardClientProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [activeTab, setActiveTab] = useState<"wishes" | "gifts">("wishes");
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showAddRecipientModal, setShowAddRecipientModal] = useState(false);
    const [showGiftStoreMode, setShowGiftStoreMode] = useState(false);
    const nextRecipient = initialRecipients
        .filter((recipient) => recipient.upcomingEvent?.daysLeft !== null && recipient.upcomingEvent?.daysLeft !== undefined)
        .sort((a, b) => (a.upcomingEvent!.daysLeft || 0) - (b.upcomingEvent!.daysLeft || 0))[0];
    const upcomingRecipients = initialRecipients.filter((recipient) =>
        recipient.upcomingEvent?.daysLeft !== null &&
        recipient.upcomingEvent?.daysLeft !== undefined &&
        recipient.upcomingEvent.daysLeft <= 30
    );
    const totalGiftIdeas = initialRecipients.reduce((total, recipient) => total + recipient.giftIdeasCount, 0);
    const urgentReminders = initialRecipients
        .filter((recipient) =>
            recipient.upcomingEvent?.daysLeft !== null &&
            recipient.upcomingEvent?.daysLeft !== undefined &&
            recipient.upcomingEvent.daysLeft <= 7
        )
        .map((recipient) => ({
            recipient,
            pendingIdeas: recipient.giftIdeas.filter((idea) => !["DELIVERED"].includes(idea.giftStatus)).length,
        }));
    const showHeaderActions =
        (activeTab === "wishes" && initialWishlists.length > 0) ||
        (activeTab === "gifts" && initialRecipients.length > 0);

    useEffect(() => {
        if (searchParams.get("tab") === "gifts") {
            setActiveTab("gifts");
        }
    }, [searchParams]);

    const handleTabChange = (tab: "wishes" | "gifts") => {
        setActiveTab(tab);
        router.replace(tab === "gifts" ? "/app/wishes?tab=gifts" : "/app/wishes", { scroll: false });
    };

    const handleSuccess = useCallback(() => {
        setShowCreateModal(false);
        setShowAddRecipientModal(false);
        router.refresh();
    }, [router]);

    return (
        <>
            <div className="pb-20">
                <SectionHeader
                    eyebrow="DESEOS"
                    title="Lista de deseos"
                    subtitle="Libros que quieres recibir y regalos lectores que quieres preparar."
                    className="mb-5 [&_h1]:text-[1.8rem] [&_h1]:leading-tight [&_p]:text-base"
                >
                    {showHeaderActions && (
                        <div className="mt-5 hidden sm:flex sm:items-center sm:gap-3">
                            {activeTab === "wishes" ? (
                                <Button
                                    className="h-11 w-full rounded-full px-3 text-sm font-bold shadow-sm sm:h-12 sm:w-auto sm:rounded-2xl sm:px-7 sm:shadow-md"
                                    onClick={() => setShowCreateModal(true)}
                                >
                                    <Plus className="mr-2 h-4 w-4" />
                                    Crear lista
                                </Button>
                            ) : (
                                <>
                                    <Button
                                        variant="secondary"
                                        className="h-11 w-full rounded-full px-3 text-sm font-bold shadow-sm sm:h-12 sm:w-auto sm:rounded-2xl sm:px-6 sm:shadow-md"
                                        onClick={() => setShowGiftStoreMode(true)}
                                    >
                                        <Store className="mr-2 h-4 w-4" />
                                        Modo tienda
                                    </Button>
                                    <Button
                                        className="h-11 w-full rounded-full px-3 text-sm font-bold shadow-sm sm:h-12 sm:w-auto sm:rounded-2xl sm:px-7 sm:shadow-md"
                                        onClick={() => setShowAddRecipientModal(true)}
                                    >
                                        <UserRound className="mr-2 h-4 w-4" />
                                        {"A\u00f1adir persona"}
                                    </Button>
                                </>
                            )}
                        </div>
                    )}
                </SectionHeader>

                <div className="mt-6">
                    <div className="mb-7 grid grid-cols-2 rounded-2xl border border-teal/10 bg-white/70 p-1 shadow-sm">
                        {[
                            { value: "wishes" as const, label: "Mis deseos", count: initialWishlists.length },
                            { value: "gifts" as const, label: "Mis regalos", count: initialRecipients.length },
                        ].map((tab) => {
                            const isActive = activeTab === tab.value;
                            return (
                                <button
                                    key={tab.value}
                                    type="button"
                                    onClick={() => handleTabChange(tab.value)}
                                    className={`h-11 rounded-xl text-sm font-bold transition-all ${isActive
                                        ? "bg-teal text-white shadow-sm"
                                        : "text-grey/60 hover:bg-teal/5 hover:text-teal"
                                        }`}
                                >
                                    {tab.label}
                                    {tab.count > 0 && (
                                        <span className={`ml-2 rounded-full px-1.5 py-0.5 text-xs ${isActive ? "bg-white/15 text-white" : "bg-teal/10 text-teal"}`}>
                                            {tab.count}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {activeTab === "wishes" && (
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                        {initialWishlists.length === 0 ? (
                            <EmptyWishlists onCreateClick={() => setShowCreateModal(true)} />
                        ) : (
                            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 2xl:grid-cols-3">
                                {initialWishlists.map((list) => (
                                    <WishlistCard key={list.id} wishlist={list} />
                                ))}

                                <button
                                    onClick={() => setShowCreateModal(true)}
                                    className="group flex min-h-[180px] flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-teal/10 p-8 text-grey/60 transition-all hover:border-teal/30 hover:bg-teal/5 hover:text-teal"
                                >
                                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-teal/10 text-teal transition-transform duration-300 group-hover:scale-105">
                                        <Plus className="h-5 w-5" />
                                    </div>
                                    <span className="font-serif font-medium text-teal">Crear otra lista</span>
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === "gifts" && (
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-8">
                        {initialRecipients.length === 0 ? (
                            <EmptyGiftRecipients onAddClick={() => setShowAddRecipientModal(true)} />
                        ) : (
                            <>
                                <div className="grid grid-cols-1 gap-3 sm:hidden">
                                    <button
                                        type="button"
                                        onClick={() => setShowGiftStoreMode(true)}
                                        className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-teal px-5 text-sm font-bold text-white shadow-md shadow-teal/15"
                                    >
                                        <Store className="h-4 w-4" />
                                        Modo tienda
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                                    <GiftSummaryCard
                                        icon={UserRound}
                                        label="Personas"
                                        value={initialRecipients.length}
                                        detail="Perfiles de regalo"
                                    />
                                    <GiftSummaryCard
                                        icon={Gift}
                                        label="Ideas"
                                        value={totalGiftIdeas}
                                        detail="Libros guardados"
                                    />
                                    <GiftSummaryCard
                                        icon={ShoppingBag}
                                        label="Reservas"
                                        value={initialReservations.length}
                                        detail="Regalos pendientes"
                                    />
                                </div>

                                {nextRecipient?.upcomingEvent && (
                                    <div className="flex items-start gap-4 rounded-2xl border border-coral/10 bg-white/75 p-4 shadow-sm">
                                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-coral/10 text-coral">
                                            <CalendarDays className="h-5 w-5" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <h4 className="text-sm font-bold text-teal">Próxima ocasión</h4>
                                            <p className="mt-1 text-sm leading-relaxed text-grey/65">
                                                {nextRecipient.upcomingEvent.daysLeft === 0 ? (
                                                    <>
                                                        Hoy es <span className="font-bold text-teal">{nextRecipient.upcomingEvent.name}</span> de{" "}
                                                        <span className="font-bold text-teal">{nextRecipient.name}</span>.
                                                    </>
                                                ) : (
                                                    <>
                                                        En {nextRecipient.upcomingEvent.daysLeft} días:{" "}
                                                        <span className="font-bold text-teal">{nextRecipient.upcomingEvent.name}</span> de{" "}
                                                        <span className="font-bold text-teal">{nextRecipient.name}</span>.
                                                    </>
                                                )}{" "}
                                                Tiene {nextRecipient.giftIdeasCount} {nextRecipient.giftIdeasCount === 1 ? "idea guardada" : "ideas guardadas"}.
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {urgentReminders.length > 0 && (
                                    <section className="space-y-3">
                                        <div>
                                            <h3 className="font-serif text-xl text-teal">Recordatorios</h3>
                                            <p className="mt-1 text-sm text-grey/55">Ocasiones cercanas que conviene dejar preparadas.</p>
                                        </div>
                                        <div className="grid gap-3 md:grid-cols-2">
                                            {urgentReminders.map(({ recipient, pendingIdeas }) => (
                                                <Link
                                                    key={recipient.id}
                                                    href={`/app/wishes/person/${recipient.id}`}
                                                    className="flex items-center justify-between gap-4 rounded-2xl border border-coral/10 bg-white/75 p-4 shadow-sm transition-colors hover:border-coral/25 hover:bg-coral/5"
                                                >
                                                    <div className="min-w-0">
                                                        <p className="truncate text-sm font-bold text-teal">
                                                            {recipient.upcomingEvent!.daysLeft === 0 ? "Hoy" : `En ${recipient.upcomingEvent!.daysLeft} días`}: {recipient.name}
                                                        </p>
                                                        <p className="mt-1 truncate text-xs text-grey/55">
                                                            {recipient.upcomingEvent!.name} · {pendingIdeas} {pendingIdeas === 1 ? "regalo por preparar" : "regalos por preparar"}
                                                        </p>
                                                    </div>
                                                    <span className="shrink-0 rounded-full bg-coral px-3 py-1 text-xs font-bold text-white">
                                                        Revisar
                                                    </span>
                                                </Link>
                                            ))}
                                        </div>
                                    </section>
                                )}

                                <div className="space-y-4">
                                    <div>
                                        <h3 className="font-serif text-xl text-teal">Personas a las que regalo</h3>
                                        {upcomingRecipients.length > 0 && (
                                            <p className="mt-1 text-sm text-grey/55">
                                                {upcomingRecipients.length} con fechas en los próximos 30 días.
                                            </p>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                                        {initialRecipients.map((person) => (
                                            <PersonCard key={person.id} recipient={person} />
                                        ))}

                                        <button
                                            type="button"
                                            onClick={() => setShowAddRecipientModal(true)}
                                            className="group flex min-h-[168px] flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-teal/10 p-6 text-grey/60 transition-all hover:border-teal/30 hover:bg-teal/5 hover:text-teal sm:hidden lg:flex"
                                        >
                                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-teal/10 text-teal transition-transform duration-300 group-hover:scale-105">
                                                <Plus className="h-5 w-5" />
                                            </div>
                                            <span className="font-serif font-medium text-teal">Añadir persona</span>
                                        </button>
                                    </div>
                                </div>

                                {initialReservations.length > 0 && (
                                    <div className="space-y-4 border-t border-grey/10 pt-8">
                                        <h3 className="font-serif text-xl text-teal">Mis reservas y compras</h3>
                                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
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
            {showGiftStoreMode && (
                <GiftStoreModeView
                    recipients={initialRecipients}
                    reservations={initialReservations}
                    onExit={() => setShowGiftStoreMode(false)}
                    onAddPerson={() => setShowAddRecipientModal(true)}
                />
            )}
        </>
    );
}

function GiftSummaryCard({
    icon: Icon,
    label,
    value,
    detail,
}: {
    icon: ComponentType<{ className?: string }>;
    label: string;
    value: number;
    detail: string;
}) {
    return (
        <div className="flex items-center gap-3 rounded-2xl border border-teal/10 bg-white/75 p-4 shadow-sm">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-teal/10 text-teal">
                <Icon className="h-5 w-5" />
            </div>
            <div>
                <p className="text-2xl font-bold leading-none text-teal">{value}</p>
                <p className="mt-1 text-xs font-bold uppercase tracking-wide text-grey/45">{label}</p>
                <p className="mt-0.5 text-xs text-grey/50">{detail}</p>
            </div>
        </div>
    );
}
