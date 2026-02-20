"use client";

import * as React from "react";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";

import { ClubSummary } from "@/components/club/ClubSummary";
import { ClubFeed } from "@/components/club/ClubFeed";
import { ClubSidebar } from "@/components/club/ClubSidebar";
import { ClubManagement } from "@/components/club/management/ClubManagement";
import { ClubCheckpoints } from "@/components/club/ClubCheckpoints";
import { startReading, createPoll } from "@/app/app/clubs/[id]/actions";

import { SearchBookModal } from "@/components/club/management/SearchBookModal";
import { ReadingSetup } from "@/components/club/management/ReadingSetup";
import { CreatePollModal } from "@/components/club/polls/CreatePollModal";
import { BookSearchResult } from "@/lib/isbndb"; // Or wherever types are

interface ClubDashboardProps {
    club: any;
    activePoll?: any;
}

export function ClubDashboard({ club, activePoll }: ClubDashboardProps) {
    const isAdmin = club.userRole === 'admin' || club.userRole === 'moderator';
    const hasActiveBook = !!club.currentBook;

    // View State Handlers
    const [activeTab, setActiveTab] = React.useState("summary");
    const [isSearchModalOpen, setIsSearchModalOpen] = React.useState(false);
    const [isCreatePollModalOpen, setIsCreatePollModalOpen] = React.useState(false);
    const [selectedBook, setSelectedBook] = React.useState<BookSearchResult | null>(null);

    const handleBookSelect = (book: BookSearchResult) => {
        setIsSearchModalOpen(false);
        setSelectedBook(book);
    };

    const handleStartReading = async (config: any) => {
        if (!selectedBook) return;

        try {
            const result = await startReading(club.id, selectedBook, config);
            if (result.error) {
                alert("Error: " + result.error);
            } else {
                // Success - State update will happen via revalidatePath/props update? 
                setSelectedBook(null); // Clear selection to show new state
            }
        } catch (e) {
            console.error(e);
            alert("Error al iniciar lectura.");
        }
    };

    const handleCreatePoll = async (question: string, options: string[]) => {
        const result = await createPoll(club.id, question, options);
        if (result?.error) {
            alert("Error al crear la votación: " + result.error);
        } else {
            // Success
        }
    };

    // 1. HEADER SECTION
    const Header = () => (
        <div className="mb-8">
            <SectionHeader
                eyebrow="CLUB"
                title={club.name}
                subtitle={hasActiveBook ? `Leyendo: ${club.currentBook.book.title}` : "Sin lectura activa"}
            >
                <div className="flex flex-wrap gap-2 mt-2">
                    <Badge variant={club.visibility === 'private' ? 'neutral' : 'brand'}>
                        {club.visibility === 'private' ? 'Privado' : 'Público'}
                    </Badge>
                    {club.tags?.map((tag: string) => (
                        <Badge key={tag} variant="outline">{tag}</Badge>
                    ))}
                </div>
            </SectionHeader>
        </div>
    );

    // 2. NO BOOK STATE
    if (!hasActiveBook) {
        if (selectedBook) {
            return (
                <div className="pb-20">
                    <Header />
                    <div className="max-w-4xl mx-auto">
                        <ReadingSetup
                            book={selectedBook}
                            onBack={() => setSelectedBook(null)}
                            onSave={handleStartReading}
                        />
                    </div>
                </div>
            );
        }

        return (
            <div className="pb-20">
                <Header />
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    <div className="lg:col-span-8">
                        {isAdmin ? (
                            <div className="bg-white border-2 border-dashed border-teal/20 rounded-xl py-20 px-12 text-center space-y-6">
                                <div className="w-16 h-16 bg-teal/10 text-teal rounded-full flex items-center justify-center mx-auto text-2xl">
                                    📖
                                </div>
                                <div>
                                    <h3 className="text-xl font-serif text-teal-dark font-bold mb-2">Comienza la lectura</h3>
                                    <p className="text-grey/60 max-w-md mx-auto">
                                        Como moderador, puedes elegir el próximo libro o proponer una votación a los miembros.
                                    </p>
                                </div>
                                <div className="flex gap-4 justify-center">
                                    <Button variant="primary" onClick={() => setIsSearchModalOpen(true)}>
                                        Elegir libro
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={() => setIsCreatePollModalOpen(true)}
                                        disabled={!!activePoll}
                                    >
                                        {activePoll ? "Votación activa" : "Crear votación"}
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <EmptyState
                                title="Próxima lectura en breve"
                                description="El moderador está preparando la siguiente lectura. ¡Atento a las notificaciones!"
                            />
                        )}

                        {/* Always show Management tab for admins even without book */}
                        {isAdmin && (
                            <div className="mt-12 opacity-50 hover:opacity-100 transition-opacity">
                                <h3 className="text-sm font-bold text-grey/40 uppercase mb-4">Gestión del Club</h3>
                                <ClubManagement club={club} />
                            </div>
                        )}
                    </div>

                    <div className="lg:col-span-4">
                        <ClubSidebar
                            club={club}
                            activePoll={activePoll}
                            onOpenCreatePoll={() => setIsCreatePollModalOpen(true)}
                        />
                    </div>
                </div>

                <SearchBookModal
                    isOpen={isSearchModalOpen}
                    onClose={() => setIsSearchModalOpen(false)}
                    onSelectBook={handleBookSelect}
                />

                <CreatePollModal
                    isOpen={isCreatePollModalOpen}
                    onClose={() => setIsCreatePollModalOpen(false)}
                    onCreate={handleCreatePoll}
                />
            </div>
        );
    }

    // 3. ACTIVE BOOK STATE (Standard View)
    return (
        <div className="pb-20">
            <Header />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Main Content */}
                <div className="lg:col-span-8">
                    <Tabs defaultValue="summary">
                        <TabsList className="mb-6 sticky top-[64px] z-20 bg-cream/95 backdrop-blur shadow-sm -mx-4 px-4 md:mx-0 md:px-0 md:shadow-none md:bg-transparent md:static">
                            <TabsTrigger value="summary">Resumen</TabsTrigger>
                            <TabsTrigger value="feed">Conversación</TabsTrigger>
                            <TabsTrigger value="checkpoints">Checkpoints</TabsTrigger>
                            <TabsTrigger value="announcements">Anuncios</TabsTrigger>
                            {isAdmin && (
                                <TabsTrigger value="manage" className="text-teal-dark font-bold">Gestionar</TabsTrigger>
                            )}
                        </TabsList>

                        <TabsContent value="summary">
                            <ClubSummary club={club} />
                        </TabsContent>

                        <TabsContent value="feed">
                            <ClubFeed />
                        </TabsContent>

                        <TabsContent value="checkpoints">
                            <ClubCheckpoints club={club} />
                        </TabsContent>

                        <TabsContent value="announcements">
                            <EmptyState title="No hay anuncios" description="El tablón está vacío por ahora." />
                        </TabsContent>

                        {isAdmin && (
                            <TabsContent value="manage">
                                <ClubManagement club={club} />
                            </TabsContent>
                        )}
                    </Tabs>
                </div>

                {/* Sidebar */}
                <div className="lg:col-span-4 space-y-6">
                    <ClubSidebar
                        club={club}
                        activePoll={activePoll}
                        onOpenCreatePoll={() => setIsCreatePollModalOpen(true)}
                    />
                </div>
            </div>

            <CreatePollModal
                isOpen={isCreatePollModalOpen}
                onClose={() => setIsCreatePollModalOpen(false)}
                onCreate={handleCreatePoll}
            />
        </div>
    );
}
