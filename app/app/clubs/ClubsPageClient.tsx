"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Card } from "@/components/ui/Card";

import { ClubCard } from "@/components/clubs/ClubCard";
import { JoinClubModal } from "@/components/clubs/JoinClubModal";
import { ClubFilters } from "@/components/clubs/ClubFilters";
import { unarchiveClub } from "@/app/app/clubs/[id]/actions";

interface ClubsPageClientProps {
    activeClubs: any[];
    archivedClubs: any[];
    exploreClubs: any[];
}

export default function ClubsPageClient({ activeClubs, archivedClubs, exploreClubs }: ClubsPageClientProps) {
    const [isJoinModalOpen, setIsJoinModalOpen] = React.useState(false);
    const router = useRouter();
    const [showArchived, setShowArchived] = React.useState(false);
    const [localArchived, setLocalArchived] = React.useState(archivedClubs);
    const [unarchiving, setUnarchiving] = React.useState<string | null>(null);

    const handleUnarchive = async (clubId: string) => {
        setUnarchiving(clubId);
        const result = await unarchiveClub(clubId);
        setUnarchiving(null);
        if (!result?.error) {
            setLocalArchived(prev => prev.filter(c => c.id !== clubId));
            router.refresh();
        }
    };

    return (
        <div className="pb-20">
            <SectionHeader
                eyebrow="CLUBS"
                title="Clubs de lectura"
                subtitle="Conversaciones cuidadas, a tu ritmo (y sin spoilers)."
                action={{
                    label: "Crear un club",
                    onClick: () => router.push("/app/clubs/crear"),
                    variant: "primary"
                }}
                secondaryAction={{
                    label: "Unirme con código",
                    onClick: () => setIsJoinModalOpen(true),
                    variant: "ghost"
                }}
            >
            </SectionHeader>

            <JoinClubModal isOpen={isJoinModalOpen} onClose={() => setIsJoinModalOpen(false)} />

            <Tabs defaultValue="my-clubs" className="mt-6">
                <TabsList className="mb-6">
                    <TabsTrigger value="my-clubs">Tus clubs</TabsTrigger>
                    <TabsTrigger value="explore">Explorar</TabsTrigger>
                </TabsList>

                {/* TAB 1: MY CLUBS */}
                <TabsContent value="my-clubs" className="space-y-12">
                    <section>
                        <h3 className="text-sm font-bold text-grey/40 uppercase tracking-widest mb-6">Activos</h3>
                        {activeClubs.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {activeClubs.map(club => (
                                    <ClubCard key={club.id} {...club}
                                        badges={club.tags ? club.tags.map((t: string) => ({ label: t })) : []}
                                    />
                                ))}
                                {/* Add New Card Placeholder */}
                                <button className="flex flex-col items-center justify-center border-2 border-dashed border-teal/10 rounded-xl p-6 h-full min-h-[280px] hover:bg-teal/5 hover:border-teal/30 transition-all group" onClick={() => router.push("/app/clubs/crear")}>
                                    <span className="w-12 h-12 rounded-full bg-teal/10 text-teal flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">+</span>
                                    <span className="font-serif text-teal font-medium">Crear nuevo club</span>
                                </button>
                            </div>
                        ) : (
                            <EmptyState
                                title="Tu próxima conversación empieza aquí"
                                description="Explora clubs que ya están leyendo o crea uno con tu gente."
                                actionLabel="Explorar clubs"
                                onAction={() => {
                                    const exploreTab = document.querySelector('[value="explore"]') as HTMLElement;
                                    if (exploreTab) exploreTab.click();
                                }}
                            />
                        )}
                    </section>

                    {archivedClubs.length > 0 && (
                        <section>
                            <h3
                                className="text-sm font-bold text-grey/40 uppercase tracking-widest mb-4 flex items-center gap-2 cursor-pointer hover:text-teal"
                                onClick={() => setShowArchived(!showArchived)}
                            >
                                <span>Archivados ({archivedClubs.length})</span>
                                <svg className={`w-4 h-4 transition-transform ${showArchived ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                            </h3>
                            {showArchived && (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 opacity-75">
                                    {localArchived.map(club => (
                                        <div key={club.id} className="relative">
                                            <ClubCard {...club}
                                                badges={club.tags ? club.tags.map((t: string) => ({ label: t })) : []}
                                                preview
                                            />
                                            {/* Reactivar overlay button */}
                                            {club.isAdmin && (
                                                <div className="absolute bottom-4 right-4 z-10">
                                                    <button
                                                        onClick={() => handleUnarchive(club.id)}
                                                        disabled={unarchiving === club.id}
                                                        className="text-xs font-bold text-teal bg-white border border-teal/30 hover:bg-teal hover:text-white px-3 py-1.5 rounded-full shadow-sm transition-all disabled:opacity-50"
                                                    >
                                                        {unarchiving === club.id ? 'Reactivando...' : '↑ Reactivar'}
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>
                    )}
                </TabsContent>

                {/* TAB 2: EXPLORE */}
                <TabsContent value="explore">
                    <ClubFilters />

                    <div className="space-y-12 mt-8">
                        {/* Featured / All Loop for now */}
                        <section>
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h3 className="font-serif text-xl text-teal">Descubre clubs</h3>
                                    <p className="text-sm text-grey/60">Únete a la conversación</p>
                                </div>
                            </div>
                            {exploreClubs.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    {exploreClubs.map(club => (
                                        <ClubCard key={club.id} {...club}
                                            badges={club.tags ? club.tags.map((t: string) => ({ label: t })) : []}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12 text-grey/40 italic">
                                    No hay clubs públicos disponibles todavía. ¡Sé el primero en crear uno!
                                </div>
                            )}
                        </section>

                        {/* Final CTA */}
                        <section className="py-8">
                            <Card className="bg-gradient-to-r from-teal/5 to-coral/5 text-center py-8 border-none">
                                <h3 className="font-serif text-lg text-teal mb-2">¿No encuentras el tuyo?</h3>
                                <p className="text-sm text-grey/60 mb-6">Crea uno en 1 minuto y lee con tu gente.</p>
                                <Button variant="primary" onClick={() => router.push("/app/clubs/crear")}>Crear un club</Button>
                            </Card>
                        </section>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
