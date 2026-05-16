"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";

import { ClubReadingRoom } from "@/components/club/ClubReadingRoom";
import { ClubFeed } from "@/components/club/ClubFeed";
import { ClubSidebar } from "@/components/club/ClubSidebar";
import { ClubManagement } from "@/components/club/management/ClubManagement";
import { ClubCheckpoints } from "@/components/club/ClubCheckpoints";
import { ClubAnnouncements } from "@/components/club/ClubAnnouncements";
import { startReading, createPoll } from "@/app/app/clubs/[id]/actions";

import { SearchBookModal } from "@/components/club/management/SearchBookModal";
import { ReadingSetup } from "@/components/club/management/ReadingSetup";
import { CreatePollModal } from "@/components/club/polls/CreatePollModal";
import { BookSearchResult } from "@/lib/isbndb"; // Or wherever types are
import { ArrowLeft, Bell, BookOpen, Sparkles, Users } from "lucide-react";

interface ClubDashboardClub {
    id: string;
    name: string;
    visibility?: "public" | "private" | "secret" | string;
    tags?: string[];
    memberCount?: number;
    rules?: string[] | null;
    userRole?: "admin" | "moderator" | "member" | string | null;
    currentBook?: {
        pace_unit?: string | null;
        checkpoints?: Array<{
            id: string;
            title: string;
            start: string;
            end: string;
            date?: string;
        }> | null;
        book?: {
            title?: string;
            cover_url?: string | null;
            page_count?: number | null;
            description?: string | null;
            author?: { name?: string | null } | null;
            authors?: { name?: string | null } | null;
        };
    } | null;
}

interface ClubDashboardProps {
    club: ClubDashboardClub | null;
    activePoll?: React.ComponentProps<typeof ClubSidebar>["activePoll"];
    pollHistory?: React.ComponentProps<typeof ClubSidebar>["pollHistory"];
}

function MemberWaitingState({
    club,
    hasOpenPoll,
}: {
    club: ClubDashboardClub;
    hasOpenPoll: boolean;
}) {
    const memberCount = club.memberCount ?? 0;

    return (
        <div className="rounded-3xl border border-teal/10 bg-white/70 px-5 py-7 text-center shadow-sm sm:px-8 sm:py-10">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-teal/5 text-teal/45">
                {hasOpenPoll ? <Sparkles size={34} /> : <BookOpen size={34} />}
            </div>

            <p className="mt-6 text-xs font-bold uppercase tracking-[0.14em] text-teal-dark/50">
                {hasOpenPoll ? "Votación abierta" : "Preparando lectura"}
            </p>
            <h3 className="mx-auto mt-2 max-w-md text-2xl font-bold leading-tight text-teal-dark">
                {hasOpenPoll ? "Tu próxima lectura se está decidiendo" : "Próxima lectura en breve"}
            </h3>
            <p className="mx-auto mt-3 max-w-lg text-base leading-7 text-grey/70">
                {hasOpenPoll
                    ? "Participa en la votación del club y ayuda a elegir el próximo libro."
                    : "El moderador está preparando la siguiente lectura. Mientras tanto puedes revisar las reglas, ver decisiones anteriores o descubrir nuevos libros."}
            </p>

            <div className="mt-7 grid gap-3 text-left sm:grid-cols-2">
                <div className="rounded-2xl bg-cream/70 p-4">
                    <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-teal shadow-sm">
                            <Users size={18} />
                        </span>
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-grey/45">Lectores</p>
                            <p className="text-sm font-bold text-teal-dark">
                                {memberCount > 0 ? `${memberCount} miembros` : "Club en marcha"}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="rounded-2xl bg-cream/70 p-4">
                    <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-teal shadow-sm">
                            <Bell size={18} />
                        </span>
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-grey/45">Avisos</p>
                            <p className="text-sm font-bold text-teal-dark">Te avisaremos cuando empiece</p>
                        </div>
                    </div>
                </div>
            </div>

            <Link
                href="/app/explorar"
                className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-teal px-5 text-sm font-bold text-white shadow-sm transition hover:bg-teal-dark sm:w-auto"
            >
                <BookOpen size={18} />
                Explorar libros
            </Link>
        </div>
    );
}

export function ClubDashboard({ club, activePoll, pollHistory = [] }: ClubDashboardProps) {
    // View State Handlers
    const searchParams = useSearchParams();
    const initialTab = searchParams.get('tab') === 'manage' ? 'manage' : 'summary';
    const [activeTab, setActiveTab] = React.useState(initialTab);
    const [isSearchModalOpen, setIsSearchModalOpen] = React.useState(false);
    const [isCreatePollModalOpen, setIsCreatePollModalOpen] = React.useState(false);
    const [selectedBook, setSelectedBook] = React.useState<BookSearchResult | null>(null);
    const [bookSearchQuery, setBookSearchQuery] = React.useState("");

    // No data = club is private/secret and user is not a member
    if (!club) {
        return (
            <div className="min-h-[50vh] flex flex-col items-center justify-center text-center space-y-4 py-20">
                <div className="w-16 h-16 rounded-full bg-grey/10 flex items-center justify-center text-3xl">🔒</div>
                <h2 className="font-serif text-2xl text-grey-dark font-bold">Club privado</h2>
                <p className="text-sm text-grey/60 max-w-xs">Este club es privado o secreto. Necesitas una invitación para acceder a su contenido.</p>
            </div>
        );
    }

    const isAdmin = club.userRole === 'admin' || club.userRole === 'moderator';
    const hasActiveBook = !!club.currentBook;
    const hasOpenPoll = !!activePoll?.isOpen;
    const latestPollWinner = pollHistory.find((poll) => poll?.winner && poll.winner.votes > 0)?.winner;
    const currentBookTitle = club.currentBook?.book?.title || "Lectura activa";

    const handleBookSelect = (book: BookSearchResult) => {
        setIsSearchModalOpen(false);
        setSelectedBook(book);
    };

    const handleChooseBook = () => {
        setBookSearchQuery(latestPollWinner?.text || "");
        setIsSearchModalOpen(true);
    };

    const handleStartReading = async (config: Record<string, unknown>) => {
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
    const header = (
        <div className="mb-5 sm:mb-7">
            <Link
                href="/app/clubs"
                className="mb-4 inline-flex items-center gap-2 text-sm font-bold text-grey/50 transition-colors hover:text-teal"
            >
                <ArrowLeft size={18} />
                Volver
            </Link>
            <SectionHeader
                eyebrow="CLUB"
                title={club.name}
                subtitle={hasActiveBook ? `Leyendo: ${currentBookTitle}` : "Sin lectura activa"}
                className="mb-0 gap-2 md:mb-0"
            >
                <div className="flex flex-wrap gap-2">
                    <Badge variant={club.visibility === 'private' ? 'neutral' : 'brand'}>
                        {club.visibility === 'private' ? 'Privado' : club.visibility === 'secret' ? 'Secreto' : 'Público'}
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
                    {header}
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
                {header}
                <div className="grid grid-cols-1 gap-7 lg:grid-cols-12 lg:gap-8">
                    <div className="lg:col-span-8">
                        {isAdmin ? (
                            <div className="space-y-6 rounded-3xl border-2 border-dashed border-teal/20 bg-white px-6 py-8 text-center sm:px-12 sm:py-16">
                                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-teal/10 text-teal text-2xl">
                                    📖
                                </div>
                                <div>
                                    <h3 className="mb-2 text-xl font-bold text-teal-dark sm:text-2xl">Comienza la lectura</h3>
                                    <p className="mx-auto max-w-md text-sm leading-relaxed text-grey/60 sm:text-base">
                                        Como moderador, puedes elegir el próximo libro o proponer una votación a los miembros.
                                    </p>
                                </div>
                                {latestPollWinner && (
                                    <div className="mx-auto max-w-md rounded-2xl bg-teal/5 px-4 py-3 text-left">
                                        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-teal-dark/60">Última votación</p>
                                        <p className="mt-1 text-sm text-grey/70">
                                            Ganó <span className="font-bold text-teal-dark">{latestPollWinner.text}</span>. Puedes confirmar la ficha antes de iniciar la lectura.
                                        </p>
                                    </div>
                                )}
                                <div className="grid gap-3 sm:flex sm:justify-center sm:gap-4">
                                    <Button variant="primary" onClick={handleChooseBook} className="w-full sm:w-auto">
                                        {latestPollWinner ? "Elegir libro ganador" : "Elegir libro"}
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={() => setIsCreatePollModalOpen(true)}
                                        disabled={hasOpenPoll}
                                        className="w-full sm:w-auto"
                                    >
                                        {activePoll ? "Votación activa" : "Crear votación"}
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <>
                                <MemberWaitingState club={club} hasOpenPoll={hasOpenPoll} />
                                <div className="mt-6 lg:hidden">
                                    <ClubSidebar
                                        club={club}
                                        activePoll={activePoll}
                                        pollHistory={pollHistory}
                                        onOpenCreatePoll={() => setIsCreatePollModalOpen(true)}
                                    />
                                </div>
                            </>
                        )}

                        {/* Always show Management tab for admins even without book */}
                        {isAdmin && (
                            <div className="mt-10">
                                <h3 className="text-sm font-bold text-grey/40 uppercase mb-4">Gestión del Club</h3>
                                <ClubManagement
                                    club={club}
                                    mobileGeneralAside={
                                        <ClubSidebar
                                            club={club}
                                            activePoll={activePoll}
                                            pollHistory={pollHistory}
                                            onOpenCreatePoll={() => setIsCreatePollModalOpen(true)}
                                        />
                                    }
                                />
                            </div>
                        )}
                    </div>

                    <div className="hidden lg:col-span-4 lg:block">
                        <ClubSidebar
                            club={club}
                            activePoll={activePoll}
                            pollHistory={pollHistory}
                            onOpenCreatePoll={() => setIsCreatePollModalOpen(true)}
                        />
                    </div>
                </div>

                <SearchBookModal
                    isOpen={isSearchModalOpen}
                    onClose={() => setIsSearchModalOpen(false)}
                    onSelectBook={handleBookSelect}
                    initialQuery={bookSearchQuery}
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
            {header}

            <div className="grid grid-cols-1 gap-7 lg:grid-cols-12 lg:gap-8">
                {/* Main Content */}
                <div className="lg:col-span-8">
                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                        <TabsList className="mb-6 sticky top-[64px] z-20 bg-cream/95 backdrop-blur shadow-sm -mx-4 px-4 md:mx-0 md:px-0 md:shadow-none md:bg-transparent md:static">
                            <TabsTrigger value="summary">Sala</TabsTrigger>
                            <TabsTrigger value="feed">Conversación</TabsTrigger>
                            <TabsTrigger value="checkpoints">Checkpoints</TabsTrigger>
                            <TabsTrigger value="announcements">Anuncios</TabsTrigger>
                            {isAdmin && (
                                <TabsTrigger value="manage" className="text-teal-dark font-bold">Gestionar</TabsTrigger>
                            )}
                        </TabsList>

                        <TabsContent value="summary">
                            <ClubReadingRoom club={club} />
                            <div className="mt-6 lg:hidden">
                                <ClubSidebar
                                    club={club}
                                    activePoll={activePoll}
                                    pollHistory={pollHistory}
                                    onOpenCreatePoll={() => setIsCreatePollModalOpen(true)}
                                />
                            </div>
                        </TabsContent>

                        <TabsContent value="feed">
                            <ClubFeed isAdminOrMod={isAdmin} />
                        </TabsContent>

                        <TabsContent value="checkpoints">
                            <ClubCheckpoints club={club} />
                        </TabsContent>

                        <TabsContent value="announcements">
                            <ClubAnnouncements club={club} />
                        </TabsContent>

                        {isAdmin && (
                            <TabsContent value="manage">
                                <ClubManagement club={club} />
                            </TabsContent>
                        )}
                    </Tabs>
                </div>

                {/* Sidebar */}
                <div className="hidden space-y-6 lg:col-span-4 lg:block">
                    <ClubSidebar
                        club={club}
                        activePoll={activePoll}
                        pollHistory={pollHistory}
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
