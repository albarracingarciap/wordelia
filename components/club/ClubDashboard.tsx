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
import { ClubCalendar } from "@/components/club/ClubCalendar";
import { ClubLibrary } from "@/components/club/ClubLibrary";
import { saveReadingPlan, activateReading, cancelReadingPlan, createPoll } from "@/app/app/clubs/[id]/actions";

import { SearchBookModal } from "@/components/club/management/SearchBookModal";
import { ReadingSetup } from "@/components/club/management/ReadingSetup";
import { CreatePollModal } from "@/components/club/polls/CreatePollModal";
import { BookSearchResult } from "@/lib/isbndb"; // Or wherever types are
import { ArrowLeft, Bell, BookOpen, CalendarClock, Sparkles, Users } from "lucide-react";

interface ClubDashboardClub {
    id: string;
    name: string;
    visibility?: "public" | "private" | "secret" | string;
    tags?: string[];
    memberCount?: number;
    rules?: string[] | null;
    userRole?: "admin" | "moderator" | "member" | string | null;
    currentBook?: {
        id?: string | null;
        pace_unit?: string | null;
        checkpoints?: Array<{
            id: string;
            title: string;
            start: string;
            end: string;
            date?: string;
            questions?: string[];
        }> | null;
        book?: {
            id?: string;
            title?: string;
            cover_url?: string | null;
            page_count?: number | null;
            description?: string | null;
            author?: { name?: string | null } | null;
            authors?: { name?: string | null } | null;
        };
    } | null;
    plannedBook?: {
        id?: string | null;
        start_date?: string | null;
        cover_url?: string | null;
        pregunta_apertura?: string | null;
        pace_config?: { pace?: string | null; progressMeasure?: string | null } | null;
        checkpoints?: any[] | null;
        book?: {
            id?: string;
            title?: string;
            cover_url?: string | null;
            author?: { name?: string | null } | null;
            authors?: { name?: string | null } | null;
        };
    } | null;
    libraryBooks?: Array<{
        id: string;
        status?: string | null;
        start_date?: string | null;
        target_date?: string | null;
        created_at?: string | null;
        book?: {
            id?: string | null;
            title?: string | null;
            cover_url?: string | null;
            author?: { name?: string | null } | null;
            authors?: { name?: string | null } | null;
        } | null;
    }>;
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

function formatPlanDate(value?: string | null) {
    if (!value) return "Sin fecha";
    const [datePart] = value.split("T");
    const [year, month, day] = datePart.split("-").map(Number);
    if (!year || !month || !day) return "Sin fecha";
    return new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "long", year: "numeric" }).format(new Date(year, month - 1, day));
}

function PlannedReadingCard({ planned, onActivate, onEdit, onCancel, onChooseOther, busy }: {
    planned: NonNullable<ClubDashboardClub["plannedBook"]>;
    onActivate: () => void;
    onEdit: () => void;
    onCancel: () => void;
    onChooseOther?: () => void;
    busy: boolean;
}) {
    const book = planned.book || {};
    const cover = planned.cover_url || book.cover_url || null;
    const author = book.author?.name || book.authors?.name || "Autor desconocido";
    const checkpointCount = planned.checkpoints?.length || 0;

    return (
        <div className="rounded-3xl border border-teal/15 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
                <span className="inline-flex items-center gap-2 rounded-full bg-teal/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-teal">
                    <CalendarClock className="h-3.5 w-3.5" aria-hidden="true" />
                    Lectura programada
                </span>
            </div>
            <div className="flex gap-4">
                <div className="h-28 w-20 shrink-0 overflow-hidden rounded-xl bg-grey/10 shadow-sm">
                    {cover ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={cover} alt={book.title || "Portada"} className="h-full w-full object-cover" />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center text-center text-xs text-grey/40">Sin portada</div>
                    )}
                </div>
                <div className="min-w-0 flex-1">
                    <h3 className="truncate text-xl font-bold text-teal-dark">{book.title || "Libro por confirmar"}</h3>
                    <p className="text-sm text-grey/60">{author}</p>
                    <p className="mt-2 text-sm text-grey">
                        <span className="font-semibold text-teal-dark">Inicio:</span> {formatPlanDate(planned.start_date)}
                    </p>
                    <p className="mt-1 text-xs text-grey/50">
                        {checkpointCount > 0
                            ? `${checkpointCount} checkpoints configurados`
                            : "Sin checkpoints (puedes añadirlos ahora o más tarde)"}
                    </p>
                </div>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
                <Button variant="primary" onClick={onActivate} disabled={busy}>Comenzar ahora</Button>
                <Button variant="outline" onClick={onEdit} disabled={busy}>Editar</Button>
                {onChooseOther && (
                    <Button variant="ghost" onClick={onChooseOther} disabled={busy}>Elegir otro libro</Button>
                )}
                <Button variant="ghost" onClick={onCancel} disabled={busy} className="text-red-600 hover:bg-red-50">Descartar</Button>
            </div>
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
    const [conversationCheckpointNumber, setConversationCheckpointNumber] = React.useState<number | null>(null);
    const [planBusy, setPlanBusy] = React.useState(false);
    const [editingConfig, setEditingConfig] = React.useState<any | null>(null);

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
    const plannedBook = club.plannedBook || null;
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

    const openConversationCheckpoint = (checkpointNumber: number) => {
        setConversationCheckpointNumber(checkpointNumber);
        setActiveTab("feed");
    };

    const handleSaveReadingPlan = async (config: Record<string, unknown>) => {
        if (!selectedBook) return;

        setPlanBusy(true);
        try {
            const result = await saveReadingPlan(club.id, selectedBook, config);
            if (result.error) {
                alert("Error: " + result.error);
            } else {
                setSelectedBook(null);
                setEditingConfig(null);
            }
        } catch (e) {
            console.error(e);
            alert("Error al guardar la lectura.");
        } finally {
            setPlanBusy(false);
        }
    };

    const handleActivatePlan = async () => {
        if (!plannedBook?.id) return;
        if (!confirm("¿Comenzar ahora esta lectura? Pasará a ser la lectura activa del club.")) return;

        setPlanBusy(true);
        try {
            const result = await activateReading(club.id, plannedBook.id);
            if (result.error) alert("Error: " + result.error);
        } catch (e) {
            console.error(e);
            alert("Error al iniciar la lectura.");
        } finally {
            setPlanBusy(false);
        }
    };

    const handleEditPlan = () => {
        if (!plannedBook) return;
        const b = plannedBook.book || {};
        const authorName = b.author?.name || b.authors?.name || "";
        setSelectedBook({
            id: b.id || "",
            title: b.title || "",
            authors: authorName ? [authorName] : [],
            cover_url: plannedBook.cover_url || b.cover_url || null,
            description: null,
            isbn: null,
            isbn13: null,
            page_count: null,
            published_date: null,
            publisher: null,
            categories: [],
            average_rating: null,
            ratings_count: null,
            language: null,
            price: null,
            source: "db",
        } as BookSearchResult);
        setEditingConfig({
            startDate: plannedBook.start_date || new Date().toISOString().split('T')[0],
            pace: plannedBook.pace_config?.pace || "Estándar (2 check/sem)",
            progressMeasure: plannedBook.pace_config?.progressMeasure || "pages",
            checkpoints: plannedBook.checkpoints || [],
            preguntaApertura: plannedBook.pregunta_apertura || "",
        });
    };

    const handleCancelPlan = async () => {
        if (!plannedBook?.id) return;
        if (!confirm("¿Descartar la lectura programada?")) return;

        setPlanBusy(true);
        try {
            const result = await cancelReadingPlan(club.id, plannedBook.id);
            if (result.error) alert("Error: " + result.error);
        } catch (e) {
            console.error(e);
            alert("Error al descartar la lectura.");
        } finally {
            setPlanBusy(false);
        }
    };

    const handleScheduleWinner = (winnerText: string) => {
        setEditingConfig(null);
        setBookSearchQuery(winnerText || "");
        setIsSearchModalOpen(true);
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

    // Configurar lectura (elegir o editar) — válido con o sin lectura activa.
    if (selectedBook) {
        return (
            <div className="pb-20">
                {header}
                <div className="max-w-4xl mx-auto">
                    <ReadingSetup
                        book={selectedBook}
                        onBack={() => { setSelectedBook(null); setEditingConfig(null); }}
                        onSave={handleSaveReadingPlan}
                        initialConfig={editingConfig}
                        isSaving={planBusy}
                    />
                </div>
            </div>
        );
    }

    // 2. NO BOOK STATE
    if (!hasActiveBook) {
        return (
            <div className="pb-20">
                {header}
                <div className="grid grid-cols-1 gap-7 lg:grid-cols-12 lg:gap-8">
                    <div className="lg:col-span-8">
                        {isAdmin ? (
                            plannedBook ? (
                                <PlannedReadingCard
                                    planned={plannedBook}
                                    onActivate={handleActivatePlan}
                                    onEdit={handleEditPlan}
                                    onCancel={handleCancelPlan}
                                    onChooseOther={handleChooseBook}
                                    busy={planBusy}
                                />
                            ) : (
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
                            )
                        ) : (
                            <>
                                <MemberWaitingState club={club} hasOpenPoll={hasOpenPoll} />
                                <div className="mt-6 lg:hidden">
                                    <ClubSidebar
                                        club={club}
                                        activePoll={activePoll}
                                        pollHistory={pollHistory}
                                        onOpenCreatePoll={() => setIsCreatePollModalOpen(true)}
                                        onScheduleWinner={handleScheduleWinner}
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
                                            onScheduleWinner={handleScheduleWinner}
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
                            onScheduleWinner={handleScheduleWinner}
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
                    {isAdmin && plannedBook && (
                        <div className="mb-6">
                            <PlannedReadingCard
                                planned={plannedBook}
                                onActivate={handleActivatePlan}
                                onEdit={handleEditPlan}
                                onCancel={handleCancelPlan}
                                busy={planBusy}
                            />
                        </div>
                    )}
                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                        <TabsList className="sticky top-[64px] z-20 mb-5 grid grid-cols-3 gap-0.5 overflow-x-visible rounded-xl border-b-0 bg-white/90 p-1 shadow-sm backdrop-blur md:static md:flex md:gap-6 md:overflow-x-auto md:rounded-none md:border-b md:border-teal/10 md:bg-transparent md:p-0 md:shadow-none [&_button]:py-2 [&_button]:text-xs md:[&_button]:py-3 md:[&_button]:text-sm">
                            <TabsTrigger value="summary">Sala</TabsTrigger>
                            <TabsTrigger value="feed">Conversación</TabsTrigger>
                            <TabsTrigger value="checkpoints">Checkpoints</TabsTrigger>
                            <TabsTrigger value="library">Biblioteca</TabsTrigger>
                            <TabsTrigger value="announcements">Calendario</TabsTrigger>
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
                                    onScheduleWinner={handleScheduleWinner}
                                />
                            </div>
                        </TabsContent>

                        <TabsContent value="feed">
                            <ClubFeed
                                isAdminOrMod={isAdmin}
                                checkpoints={club.currentBook?.checkpoints || []}
                                currentBookId={club.currentBook?.book?.id}
                                currentClubBookId={club.currentBook?.id}
                                targetCheckpointNumber={conversationCheckpointNumber}
                            />
                        </TabsContent>

                        <TabsContent value="checkpoints">
                            <ClubCheckpoints
                                club={club}
                                onOpenConversationCheckpoint={openConversationCheckpoint}
                            />
                        </TabsContent>

                        <TabsContent value="library">
                            <ClubLibrary
                                books={club.libraryBooks || []}
                                activePoll={activePoll || null}
                                pollHistory={pollHistory}
                                canCreatePoll={isAdmin}
                                onCreatePoll={handleCreatePoll}
                            />
                        </TabsContent>

                        <TabsContent value="announcements">
                            <ClubCalendar canManage={isAdmin} />
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
                        onScheduleWinner={handleScheduleWinner}
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
