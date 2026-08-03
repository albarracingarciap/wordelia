"use client";

import * as React from "react";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { StatsRow } from "@/components/dashboard/StatsRow";
import { BookCard } from "@/components/ui/BookCard";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { RegisterReadingModal } from "@/components/dashboard/RegisterReadingModal";
import { EditSessionModal } from "@/components/dashboard/EditSessionModal";
import { ReadingTimerModal } from "@/components/dashboard/ReadingTimerModal";
import { ReadingEmotionModal } from "@/components/dashboard/ReadingEmotionModal";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CreateNoteModal } from "@/components/notes/CreateNoteModal";
import { ReviewModal } from "@/components/reviews/ReviewModal";
import { DashboardSkeleton } from "@/components/dashboard/DashboardSkeleton";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { PlanStatusCard } from "@/components/pricing/PlanStatusCard";
import { ReadingChallengeWidget } from "@/components/dashboard/ReadingChallengeWidget";
import { MyLibraryHome } from "@/components/librerias/MyLibraryHome";
import { NextReadCard } from "@/components/assistant/NextReadCard";
import { getCurrentBooks, getReadingStats, getRecentNotes, CurrentBook, ReadingStats, Note, deleteBook, getRecommendedBook, RecommendedBook, startReadingBook, convertBookEmotionToNote, getEmotionBookGroups, EmotionBookGroup, getReaderResourceContext, ReaderResourceContext } from "@/app/app/mi-lectura/actions";
import { getUpcomingMilestones } from "@/app/app/clubs/[id]/actions";
import { Search, BookOpen, CalendarDays, AlertCircle, Plus, Timer, Library, Users, StickyNote, BookOpenText, Dna, ShieldCheck, Lock } from "lucide-react";

type Milestone = {
    id: string;
    eventDate: string;
    clubName: string;
    content: string;
    durationMinutes?: number | null;
    format?: "online" | "in_person" | string | null;
    location?: string | null;
};

const sectionTitleClass = "text-xs font-bold uppercase tracking-widest text-grey/40 lg:text-sm";

function InlineError({ message }: { message: string }) {
    return (
        <div className="flex items-start gap-3 rounded-xl border border-coral/25 bg-coral/10 px-4 py-3 text-sm text-coral">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>{message}</p>
        </div>
    );
}

function InlineSuccess({ message }: { message: string }) {
    return (
        <div className="flex items-start gap-3 rounded-xl border border-teal/20 bg-teal/10 px-4 py-3 text-sm font-bold text-teal-dark">
            <StickyNote className="mt-0.5 h-4 w-4 shrink-0" />
            <p>{message}</p>
        </div>
    );
}

function QuickActions({
    hasBooks,
    onRegister,
    onNote,
    isAdmin,
}: {
    hasBooks: boolean;
    onRegister: () => void;
    onNote: () => void;
    isAdmin: boolean;
}) {
    const actionClass = "flex min-h-12 items-center justify-center gap-2 rounded-xl border border-teal/10 bg-white px-3 py-3 text-center text-xs font-semibold text-grey shadow-sm transition-all hover:border-teal/25 hover:text-teal";
    const primaryActionClass = "flex min-h-12 items-center justify-center gap-2 rounded-xl border border-coral bg-coral px-3 py-3 text-center text-xs font-bold text-white shadow-md transition-all hover:bg-[#C25852] hover:shadow-lg";

    return (
        <section>
            <h2 className={`${sectionTitleClass} mb-3`}>A un clic</h2>
            <div className="grid grid-cols-2 gap-3">
                <Link href="/app/mi-lectura/nuevo?from=/app/mi-lectura" className={`${primaryActionClass} col-span-2 sm:col-span-1 lg:col-span-2`}>
                    <Plus className="h-4 w-4" /> Añadir libro
                </Link>
                <button type="button" onClick={onRegister} className={actionClass}>
                    <Timer className="h-4 w-4" /> Registrar lectura
                </button>
                <Link href="/app/mi-lectura/estanterias" className={actionClass}>
                    <Library className="h-4 w-4" /> Mis estanterías
                </Link>
                {hasBooks ? (
                    <button type="button" onClick={onNote} className={actionClass}>
                        <StickyNote className="h-4 w-4" /> Crear nota
                    </button>
                ) : (
                    <Link href="/app/clubs/crear" className={actionClass}>
                        <Users className="h-4 w-4" /> Crear club
                    </Link>
                )}
                <Link href="/app/clubs" className={actionClass}>
                    <Users className="h-4 w-4" /> Explorar clubs
                </Link>
                <Link href="/app/recursos/guias" className={actionClass}>
                    <BookOpenText className="h-4 w-4" /> Guías
                </Link>
                <Link href="/app/recursos/genomas" className={actionClass}>
                    <Dna className="h-4 w-4" /> Genomas
                </Link>
            </div>
        </section>
    );
}

type SidebarResource = {
    bookId: string;
    bookTitle: string;
    bookAuthor: string;
    kind: "guide" | "genome";
    label: string;
    href: string;
    access: "granted" | "admin" | "requires_purchase" | "requires_plan";
};

function ReadingResourcesPanel({ resources }: { resources: SidebarResource[] }) {
    if (resources.length === 0) return null;

    return (
        <section className="order-2 lg:order-2">
            <div className="mb-3">
                <h2 className={sectionTitleClass}>Recursos de tus lecturas</h2>
            </div>
            <Card className="space-y-3">
                {resources.slice(0, 3).map((resource) => {
                    const Icon = resource.kind === "guide" ? BookOpenText : Dna;
                    const unlocked = resource.access === "admin" || resource.access === "granted";
                    return (
                        <Link
                            key={`${resource.bookId}-${resource.kind}`}
                            href={resource.href}
                            className="block rounded-lg border border-teal/5 px-3 py-3 transition-colors hover:border-teal/20 hover:bg-teal/5"
                        >
                            <div className="flex items-start gap-3">
                                <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${unlocked ? "bg-teal/10 text-teal" : "bg-grey/10 text-grey"}`}>
                                    <Icon className="h-4 w-4" />
                                </span>
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center justify-between gap-2">
                                        <p className="truncate text-xs font-bold text-teal-dark">{resource.label}</p>
                                        <span className="inline-flex shrink-0 items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-grey/50">
                                            {resource.access === "admin" ? <ShieldCheck className="h-3 w-3 text-teal" /> : unlocked ? null : <Lock className="h-3 w-3" />}
                                            {resource.access === "admin" ? "Admin" : unlocked ? "Abrir" : "Plan"}
                                        </span>
                                    </div>
                                    <p className="mt-1 line-clamp-1 text-xs font-semibold text-grey-dark">{resource.bookTitle}</p>
                                    <p className="line-clamp-1 text-[11px] text-grey/45">{resource.bookAuthor}</p>
                                </div>
                            </div>
                        </Link>
                    );
                })}
            </Card>
        </section>
    );
}

export default function MiLecturaPage() {
    const router = useRouter();
    const [isRegisterModalOpen, setIsRegisterModalOpen] = React.useState(false);
    const [isTimerOpen, setIsTimerOpen] = React.useState(false);
    const [sessionDuration, setSessionDuration] = React.useState<number | undefined>(undefined);
    const [isNoteModalOpen, setIsNoteModalOpen] = React.useState(false);

    // Real Data State
    const [books, setBooks] = React.useState<CurrentBook[]>([]);
    const [stats, setStats] = React.useState<ReadingStats | null>(null);
    const [notes, setNotes] = React.useState<Note[]>([]);
    const [recommendedBook, setRecommendedBook] = React.useState<RecommendedBook | null>(null);
    const [emotionGroups, setEmotionGroups] = React.useState<EmotionBookGroup[]>([]);
    const [milestones, setMilestones] = React.useState<Milestone[]>([]);
    const [resourceContext, setResourceContext] = React.useState<ReaderResourceContext>({
        isAdmin: false,
        plan: null,
        canAccessGuides: false,
        canAccessGenomes: false,
    });
    const [isLoading, setIsLoading] = React.useState(true);
    const [loadError, setLoadError] = React.useState("");
    const [actionError, setActionError] = React.useState("");
    const [actionSuccess, setActionSuccess] = React.useState("");
    const [pendingDeleteBookId, setPendingDeleteBookId] = React.useState<string | null>(null);
    const [pendingAction, setPendingAction] = React.useState<string | null>(null);
    const [launcherQuery, setLauncherQuery] = React.useState("");
    const [registerBookId, setRegisterBookId] = React.useState<string | undefined>(undefined);
    const [noteTargetBookId, setNoteTargetBookId] = React.useState<string | undefined>(undefined);
    const [emotionTargetBookId, setEmotionTargetBookId] = React.useState<string | undefined>(undefined);
    const [isEmotionModalOpen, setIsEmotionModalOpen] = React.useState(false);
    const [isEditSessionOpen, setIsEditSessionOpen] = React.useState(false);
    const [editSessionBookId, setEditSessionBookId] = React.useState<string | undefined>(undefined);

    const handleOpenNoteModal = (bookId?: string) => {
        setNoteTargetBookId(bookId);
        setIsNoteModalOpen(true);
    };

    const handleCorrectLastSession = (bookId: string) => {
        setEditSessionBookId(bookId);
        setIsEditSessionOpen(true);
    };

    const handleOpenEmotionModal = (bookId: string) => {
        setEmotionTargetBookId(bookId);
        setIsEmotionModalOpen(true);
    };

    const [isReviewModalOpen, setIsReviewModalOpen] = React.useState(false);
    const [reviewTargetBookId, setReviewTargetBookId] = React.useState<string | undefined>(undefined);

    const handleFirstImpressions = (bookId: string) => {
        setReviewTargetBookId(bookId);
        setIsReviewModalOpen(true);
    };

    const loadDashboardData = React.useCallback(async ({ showSkeleton = false }: { showSkeleton?: boolean } = {}) => {
        if (showSkeleton) setIsLoading(true);
        setLoadError("");

        const [booksResult, statsResult, notesResult, recommendationResult, milestonesResult, emotionGroupsResult, resourceContextResult] = await Promise.allSettled([
            getCurrentBooks(),
            getReadingStats(),
            getRecentNotes(),
            getRecommendedBook(),
            getUpcomingMilestones(),
            getEmotionBookGroups(),
            getReaderResourceContext()
        ]);

        let hasError = false;

        if (booksResult.status === "fulfilled") setBooks(booksResult.value);
        else hasError = true;

        if (statsResult.status === "fulfilled") setStats(statsResult.value);
        else hasError = true;

        if (notesResult.status === "fulfilled") setNotes(notesResult.value);
        else hasError = true;

        if (recommendationResult.status === "fulfilled") setRecommendedBook(recommendationResult.value);
        else hasError = true;

        if (milestonesResult.status === "fulfilled") setMilestones(milestonesResult.value as Milestone[]);
        else hasError = true;

        if (emotionGroupsResult.status === "fulfilled") setEmotionGroups(emotionGroupsResult.value);
        else hasError = true;

        if (resourceContextResult.status === "fulfilled") setResourceContext(resourceContextResult.value);
        else hasError = true;

        if (hasError) {
            setLoadError("No hemos podido cargar todos tus datos. Algunas secciones pueden estar incompletas.");
        }

        setIsLoading(false);
    }, []);

    React.useEffect(() => {
        loadDashboardData({ showSkeleton: true });
    }, [loadDashboardData]);

    const hasBooks = books.length > 0;
    const readingResources = React.useMemo<SidebarResource[]>(() => {
        return books.flatMap((book) => (book.resources || []).map((resource) => ({
            bookId: book.id,
            bookTitle: book.title,
            bookAuthor: book.author,
            kind: resource.kind,
            label: resource.label,
            href: resource.href,
            access: resource.access,
        })));
    }, [books]);

    const handleNewSession = () => {
        setIsTimerOpen(true);
    };

    const handleTimerFinish = (duration: number) => {
        setSessionDuration(duration);
        setIsTimerOpen(false);
        setIsRegisterModalOpen(true);
    };

    // Reset duration when manually opening register modal
    const handleManualRegister = (bookId?: string) => {
        setSessionDuration(undefined);
        setRegisterBookId(bookId);
        setIsRegisterModalOpen(true);
    };

    const requestDeleteBook = (bookId: string) => {
        setActionError("");
        setActionSuccess("");
        setPendingDeleteBookId(bookId);
    };

    const confirmDeleteBook = async () => {
        if (!pendingDeleteBookId) return;

        setActionError("");
        setPendingAction("delete");

        try {
            const res = await deleteBook(pendingDeleteBookId);
            if (res.success) {
                setBooks(prev => prev.filter(b => b.id !== pendingDeleteBookId));
                setPendingDeleteBookId(null);
            } else {
                setActionError(res.error || "No hemos podido quitar el libro de tu lectura.");
            }
        } catch (error) {
            console.error("Error deleting book:", error);
            setActionError("No hemos podido quitar el libro de tu lectura.");
        } finally {
            setPendingAction(null);
        }
    };

    const handleLauncherSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (launcherQuery.trim()) {
            router.push(`/app/search?q=${encodeURIComponent(launcherQuery)}&status=READING`);
        }
    };

    const handleStartReading = async (bookId: string) => {
        setActionError("");
        setActionSuccess("");
        setPendingAction(`start-${bookId}`);

        try {
            const res = await startReadingBook(bookId);
            if (res.success) {
                await loadDashboardData();
                router.refresh();
            } else {
                setActionError(res.error || "No hemos podido empezar esta lectura.");
            }
        } catch (error) {
            console.error("Error starting reading:", error);
            setActionError("No hemos podido empezar esta lectura.");
        } finally {
            setPendingAction(null);
        }
    };

    const handleConvertEmotionToNote = async (emotionId: string) => {
        setActionError("");
        setActionSuccess("");
        setPendingAction(`emotion-note-${emotionId}`);

        try {
            const result = await convertBookEmotionToNote(emotionId);
            if (result?.error) {
                setActionError(result.error);
                return;
            }

            await loadDashboardData();
            setActionSuccess("Emoción convertida en nota.");
            window.setTimeout(() => setActionSuccess(""), 3500);
        } catch (error) {
            console.error("Error converting emotion to note:", error);
            setActionError("No hemos podido convertir la emoción en nota.");
        } finally {
            setPendingAction(null);
        }
    };

    if (isLoading) {
        return <DashboardSkeleton />;
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <SectionHeader
                eyebrow="MI LECTURA"
                title="Tu rincón de lectura"
                subtitle="Continúa donde lo dejaste, guarda tus momentos y avanza a tu ritmo."
                className="mb-0 md:mb-4 [&_h1]:text-[1.65rem] [&_h1]:leading-tight [&_p]:text-sm"
            />

            {loadError && <InlineError message={loadError} />}
            {actionError && <InlineError message={actionError} />}
            {actionSuccess && <InlineSuccess message={actionSuccess} />}

            <div className="-mb-3 pb-1">
                <StatsRow
                    streakDays={hasBooks && stats ? stats.streak : undefined}
                    weeklyPages={hasBooks && stats ? stats.weeklyPages : undefined}
                    activeClubs={hasBooks && stats ? stats.activeClubs : undefined}
                    spoilerMode={false}
                />
            </div>

            <div className="lg:hidden">
                <QuickActions
                    hasBooks={hasBooks}
                    onRegister={() => handleManualRegister()}
                    onNote={() => handleOpenNoteModal()}
                    isAdmin={resourceContext.isAdmin}
                />
            </div>

            {/* Main Layout */}
            <div className="grid grid-cols-1 gap-7 lg:grid-cols-12 lg:gap-8">

                {/* Left Column (Main Content) - 8 Cols */}
                <div className="space-y-7 lg:col-span-8 lg:space-y-10">

                    {/* Section 1: Ahora Leyendo */}
                    <section>
                        <h2 className={`${sectionTitleClass} mb-4`}>Ahora leyendo</h2>

                        {hasBooks ? (
                            <div className="space-y-4">
                                {pendingDeleteBookId && (
                                    <Card className="border-coral/20 bg-coral/5">
                                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                            <p className="text-sm text-grey-dark">
                                                ¿Quieres quitar este libro de “Ahora leyendo”?
                                            </p>
                                            <div className="flex gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => setPendingDeleteBookId(null)}
                                                    disabled={pendingAction === "delete"}
                                                >
                                                    Cancelar
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    onClick={confirmDeleteBook}
                                                    isLoading={pendingAction === "delete"}
                                                >
                                                    Quitar
                                                </Button>
                                            </div>
                                        </div>
                                    </Card>
                                )}
                                {books.map((book) => (
                                    <BookCard
                                        key={book.id}
                                        {...book}
                                        coverUrl={book.coverUrl || ""}
                                        onRegisterClick={() => handleManualRegister(book.id)}
                                        actionLabel="Nueva sesión"
                                        onActionClick={handleNewSession}
                                        onDelete={() => requestDeleteBook(book.id)}
                                        onNotesClick={() => handleOpenNoteModal(book.id)}
                                        onEmotionClick={() => handleOpenEmotionModal(book.id)}
                                        onCorrectLastClick={() => handleCorrectLastSession(book.id)}
                                        onEmotionToNoteClick={handleConvertEmotionToNote}
                                        onReviewClick={() => handleFirstImpressions(book.id)}
                                        reviewLabel="Primeras impresiones"
                                    />
                                ))}
                            </div>
                        ) : (
                            // LAUNCHER EMPTY STATE
                            <div className="flex flex-col items-center justify-center rounded-2xl border border-teal/5 bg-white/50 p-5 py-10 text-center animate-fade-in sm:p-8 md:py-16">
                                <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-teal/5 text-teal/40 md:mb-6 md:h-20 md:w-20">
                                    <BookOpen size={32} />
                                </div>
                                <h3 className="text-xl md:text-2xl font-serif text-teal mb-2">Tu rincón está listo</h3>
                                <p className="text-grey/80 max-w-md mb-8 leading-relaxed">
                                    Empieza añadiendo tu lectura actual para llevar el registro.
                                </p>

                                <form onSubmit={handleLauncherSearch} className="w-full max-w-md relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <Search size={18} className="text-teal/40 group-focus-within:text-teal transition-colors" />
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Busca tu libro aquí (ej. Dune)..."
                                        className="w-full pl-11 pr-4 py-4 bg-white border border-teal/10 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal transition-all placeholder:text-grey/40 text-teal-dark"
                                        value={launcherQuery}
                                        onChange={(e) => setLauncherQuery(e.target.value)}
                                    />
                                    <div className="absolute inset-y-0 right-2 flex items-center">
                                        <button
                                            type="submit"
                                            disabled={!launcherQuery.trim()}
                                            className="p-2 bg-teal/10 hover:bg-teal text-teal hover:text-white rounded-lg transition-colors disabled:opacity-0 disabled:pointer-events-none"
                                        >
                                            <span className="sr-only">Buscar</span>
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
                                        </button>
                                    </div>
                                </form>
                                <div className="mt-6 flex flex-col gap-2 text-sm text-grey/60 sm:mt-8 sm:flex-row sm:gap-4">
                                    <span>¿Buscas inspiración?</span>
                                    <Link href="/app/explorar" className="text-teal font-medium hover:underline">Explorar catálogos</Link>
                                </div>
                            </div>
                        )}
                    </section>

                    {/* Section 2: Próximos Hitos */}
                    <section>
                        <h2 className={`${sectionTitleClass} mb-4`}>Próximos hitos</h2>
                        {milestones.length > 0 ? (
                            <div className="space-y-3">
                                {milestones.map((m) => {
                                    const d = new Date(m.eventDate);
                                    const day = d.getDate();
                                    const month = d.toLocaleDateString('es-ES', { month: 'short' }).toUpperCase();
                                    const hh = String(d.getHours()).padStart(2, '0');
                                    const mm2 = String(d.getMinutes()).padStart(2, '0');
                                    const time = `${hh}:${mm2}`;
                                    const hasTime = time !== '00:00';
                                    const loc = m.location ? `&location=${encodeURIComponent(m.location)}` : '';
                                    const iso = m.eventDate.replace(/[-:]/g, '').split('.')[0] + 'Z';
                                    const calUrl = `https://calendar.google.com/calendar/r/eventedit?text=${encodeURIComponent(m.content.slice(0, 60))}&dates=${iso}/${iso}${loc}`;
                                    return (
                                        <Card key={m.id} className="border-teal/10 hover:border-teal/25 transition-colors">
                                            <div className="flex gap-4 items-start">
                                                <div className="shrink-0 flex flex-col items-center justify-center w-12 h-12 rounded-xl bg-teal/10 text-teal-dark">
                                                    <span className="text-[9px] font-bold">{month}</span>
                                                    <span className="text-lg font-bold leading-none">{day}</span>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-[10px] font-bold text-teal/60 uppercase tracking-wide mb-0.5">{m.clubName}</p>
                                                    <p className="text-sm text-grey-dark line-clamp-2">{m.content}</p>
                                                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-grey/50 mt-1">
                                                        {hasTime && <span>{time}h</span>}
                                                        {m.durationMinutes && (
                                                            <><span className="text-grey/30">·</span><span>{m.durationMinutes} min</span></>
                                                        )}
                                                        {m.format && (
                                                            <><span className="text-grey/30">·</span><span>{m.format === 'online' ? '💻 Online' : '📍 Presencial'}</span></>
                                                        )}
                                                        {m.location && (
                                                            <><span className="text-grey/30">·</span>
                                                                {m.format === 'online'
                                                                    ? <a href={m.location} target="_blank" rel="noopener" className="underline hover:text-teal truncate max-w-[150px]">{m.location}</a>
                                                                    : <span className="truncate max-w-[150px]">{m.location}</span>
                                                                }</>
                                                        )}
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => window.open(calUrl, '_blank')}
                                                    className="shrink-0 p-1.5 text-grey/30 hover:text-teal transition-colors"
                                                    title="Añadir al calendario"
                                                >
                                                    <CalendarDays size={16} />
                                                </button>
                                            </div>
                                        </Card>
                                    );
                                })}
                            </div>
                        ) : (
                            <Card className="bg-cream/20 border-teal/5">
                                <div className="py-6 text-center space-y-2">
                                    <p className="text-sm text-grey/60 font-medium">No hay hitos pendientes</p>
                                    <p className="text-xs text-grey/40 max-w-[200px] mx-auto">
                                        Uniéndote a un club o reto comenzarás a ver aquí tus próximas metas.
                                    </p>
                                </div>
                            </Card>
                        )}
                    </section>

                    {/* Section 3: Momentos Guardados */}
                    <section>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className={sectionTitleClass}>Momentos guardados</h2>
                            {notes.length > 0 && (
                                <Link href="/app/mi-lectura/notas" className="text-xs font-medium text-teal hover:underline">Ver todas</Link>
                            )}
                        </div>
                        {notes.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {notes.map((note) => (
                                    <Card key={note.id} className="hover:border-teal/20 cursor-pointer group bg-white">
                                        <p className="text-xs font-bold text-grey/40 mb-2 uppercase tracking-wide">{note.book}</p>
                                        <p className="text-sm text-grey italic mb-3 line-clamp-2">&ldquo;{note.snippet}&rdquo;</p>
                                        <p className="text-[10px] text-teal/60">{note.date}</p>
                                    </Card>
                                ))}
                                {/* Generic "Add Note" Card */}
                                {hasBooks && (
                                    <button
                                        onClick={() => handleOpenNoteModal()}
                                        className="flex flex-col items-center justify-center p-6 rounded-xl border border-dashed border-teal/20 text-teal/40 hover:text-teal hover:border-teal/40 hover:bg-teal/5 transition-all h-full min-h-[140px]"
                                    >
                                        <span className="text-2xl mb-2">+</span>
                                        <span className="text-xs font-medium">Añadir nota</span>
                                    </button>
                                )}
                            </div>
                        ) : (
                            <Card className="bg-cream/5 border-dashed border-teal/10">
                                <div className="text-center py-6">
                                    <p className="text-sm text-grey/60 mb-3 font-medium">Guarda tus citas favoritas</p>
                                    <p className="text-xs text-grey/40 mb-4 px-4">
                                        Mientras lees, podrás guardar fragmentos o pensamientos. Aparecerán aquí como tu colección personal.
                                    </p>
                                    {hasBooks && (
                                        <Button variant="ghost" size="sm" onClick={() => handleOpenNoteModal()}>Crear primera nota</Button>
                                    )}
                                </div>
                            </Card>
                        )}
                    </section>
                </div>


                {/* Right Column (Sidebar) - 4 Cols */}
                <div className="flex flex-col gap-7 lg:col-span-4 lg:gap-8">

                    {/* Plan status + upsell (oculto para el plan máximo) */}
                    <PlanStatusCard plan={resourceContext.plan} />

                    {/* Reto de lectura anual */}
                    <ReadingChallengeWidget />

                    {/* Tu próxima lectura (IA — plan Bibliófilo) */}
                    <NextReadCard />

                    {/* Mi librería: agenda y clubs de tus librerías adoptadas */}
                    <MyLibraryHome />

                    {/* Section 4: Actions */}
                    <section className="order-1 hidden lg:block">
                        <h2 className={`${sectionTitleClass} mb-3`}>A un clic</h2>
                        <div className="space-y-3">
                            <Link
                                href="/app/mi-lectura/nuevo?from=/app/mi-lectura"
                                className="w-full p-3 bg-white border border-teal/5 rounded-lg text-xs font-medium text-grey hover:border-teal/20 hover:text-teal transition-all text-center shadow-sm flex items-center justify-center"
                            >
                                Añadir libro
                            </Link>
                            <div className="grid grid-cols-2 gap-3">
                                <button onClick={() => handleManualRegister()} className="p-3 bg-white border border-teal/5 rounded-lg text-xs font-medium text-grey hover:border-teal/20 hover:text-teal transition-all text-center shadow-sm flex items-center justify-center h-full">
                                    Registrar lectura
                                </button>
                                <Link href="/app/mi-lectura/estanterias" className="p-3 bg-white border border-teal/5 rounded-lg text-xs font-medium text-grey hover:border-teal/20 hover:text-teal transition-all text-center shadow-sm flex items-center justify-center h-full">
                                    Mis estanterías
                                </Link>
                            </div>
                            <div className="grid grid-cols-2 gap-3 pt-2">
                                <Link href="/app/clubs/crear" className="p-3 bg-white border border-teal/5 rounded-lg text-xs font-medium text-grey hover:border-teal/20 hover:text-teal transition-all text-center shadow-sm flex items-center justify-center h-full">
                                    Crear un club
                                </Link>
                                <Link href="/app/clubs" className="p-3 bg-white border border-teal/5 rounded-lg text-xs font-medium text-grey hover:border-teal/20 hover:text-teal transition-all text-center shadow-sm flex items-center justify-center h-full">
                                    Explorar clubs
                                </Link>
                            </div>
                            <div className="grid grid-cols-2 gap-3 pt-2">
                                <Link href="/app/recursos/guias" className="p-3 bg-teal/5 border border-teal/10 rounded-lg text-xs font-bold text-teal hover:border-teal/25 hover:bg-teal/10 transition-all text-center shadow-sm flex items-center justify-center gap-2 h-full">
                                    <BookOpenText className="h-4 w-4" /> Guías
                                </Link>
                                <Link href="/app/recursos/genomas" className="p-3 bg-teal/5 border border-teal/10 rounded-lg text-xs font-bold text-teal hover:border-teal/25 hover:bg-teal/10 transition-all text-center shadow-sm flex items-center justify-center gap-2 h-full">
                                    <Dna className="h-4 w-4" /> Genomas
                                </Link>
                            </div>
                        </div>
                    </section>

                    <ReadingResourcesPanel resources={readingResources} />

                    {/* Section: Activity Feed */}
                    <section className="order-3 lg:order-3">
                        <ActivityFeed />
                    </section>

                    {emotionGroups.length > 0 && (
                        <section className="order-2 lg:order-4">
                            <h2 className={`${sectionTitleClass} mb-3`}>Lecturas que te hicieron sentir</h2>
                            <Card className="space-y-4">
                                {emotionGroups.map((group) => (
                                    <div key={group.emotion} className="border-b border-grey/10 pb-3 last:border-0 last:pb-0">
                                        <div className="mb-2 flex items-center justify-between gap-2">
                                            <p className="text-sm font-bold text-teal-dark capitalize">{group.emotion}</p>
                                            <span className="rounded-full bg-teal/5 px-2 py-1 text-[10px] font-bold text-teal">
                                                {group.count} {group.count === 1 ? "libro" : "libros"}
                                            </span>
                                        </div>
                                        <div className="space-y-2">
                                            {group.books.slice(0, 2).map((book) => (
                                                <div key={`${group.emotion}-${book.id}`} className="flex items-center justify-between gap-3 text-xs">
                                                    <div className="min-w-0">
                                                        <p className="truncate font-bold text-grey-dark">{book.title}</p>
                                                        <p className="truncate text-grey/45">{book.author}</p>
                                                    </div>
                                                    <span className="shrink-0 text-teal/70">{book.intensity}/5</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </Card>
                        </section>
                    )}

                    {/* Section 5: Recommended */}
                    <section className="order-2 lg:order-5">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className={sectionTitleClass}>Recomendado hoy</h2>
                            {/* Filter hidden as requested */}
                        </div>
                        {recommendedBook ? (
                            <BookCard
                                title={recommendedBook.title}
                                author={recommendedBook.author}
                                coverUrl={recommendedBook.coverUrl || ""}
                                compact
                                tag={`Añadido: ${recommendedBook.addedDate}`}
                                actionLabel={pendingAction === `start-${recommendedBook.id}` ? "Empezando..." : "Empezar"}
                                onActionClick={() => handleStartReading(recommendedBook.id)}
                            />
                        ) : (
                            <Card className="bg-cream/10 border-dashed border-teal/10 p-4 text-center">
                                <p className="text-xs text-grey/60">
                                    Añade libros a tu lista &ldquo;Quiero leer&rdquo; para recibir recomendaciones aquí.
                                </p>
                            </Card>
                        )}
                    </section>

                    {/* Section 6: Weekly Summary */}
                    <section className="order-4 lg:order-6">
                        <Card className="bg-[#D8E2DC]/30 border-none">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-serif text-teal">Tu semana en calma</h3>
                                {hasBooks && stats && (
                                    <Link href="/app/mi-lectura/estadisticas" className="text-xs font-medium text-teal hover:underline">Ver detalles</Link>
                                )}
                            </div>
                            {hasBooks && stats ? (
                                <div className="space-y-3">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-grey/60">Sesiones</span>
                                        <span className="font-bold text-teal-dark">{stats.totalSessions ?? 0}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-grey/60">Tiempo</span>
                                        <span className="font-bold text-teal-dark">{stats.totalTime ?? 0}m</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-grey/60">Páginas</span>
                                        <span className="font-bold text-teal-dark">{stats.weeklyPages}</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="py-2 text-center space-y-2">
                                    <p className="text-xs text-grey/60 italic">
                                        &ldquo;La lectura es un refugio, no una carrera.&rdquo;
                                    </p>
                                    <p className="text-[10px] text-grey/40">
                                        Tus estadísticas de lectura en calma aparecerán aquí.
                                    </p>
                                </div>
                            )}
                            <div className="mt-4 pt-3 border-t border-teal/5">
                                <p className="text-[10px] text-center text-teal/60">Sin comparaciones. Solo tu progreso.</p>
                            </div>
                        </Card>
                    </section>

                </div>
            </div>

            {/* Modals */}
            <RegisterReadingModal
                isOpen={isRegisterModalOpen}
                onClose={() => setIsRegisterModalOpen(false)}
                onSuccess={async () => {
                    await loadDashboardData();
                    router.refresh();
                }}
                // bookTitle can be removed or kept as fallback logic inside modal, but passing books is key
                books={books.map(b => ({ ...b, coverUrl: b.coverUrl || "" }))}
                initialBookId={registerBookId || (books.length > 0 ? books[0].id : undefined)}
                initialDuration={sessionDuration}
            />

            <EditSessionModal
                isOpen={isEditSessionOpen}
                onClose={() => setIsEditSessionOpen(false)}
                bookId={editSessionBookId}
                bookTitle={books.find((b) => b.id === editSessionBookId)?.title}
                onSuccess={async () => {
                    await loadDashboardData();
                    router.refresh();
                }}
            />

            <ReadingTimerModal
                isOpen={isTimerOpen}
                onClose={() => setIsTimerOpen(false)}
                onFinish={handleTimerFinish}
                bookTitle={books[0]?.title || "Lectura actual"} // Fallback
                initialDuration={sessionDuration}
            />

            <CreateNoteModal
                isOpen={isNoteModalOpen}
                onClose={() => setIsNoteModalOpen(false)}
                books={books}
                initialBookId={noteTargetBookId}
            />

            <ReadingEmotionModal
                isOpen={isEmotionModalOpen}
                onClose={() => setIsEmotionModalOpen(false)}
                onSaved={() => loadDashboardData()}
                book={books.find((book) => book.id === emotionTargetBookId) || null}
            />

            {/* Review Modal for First Impressions */}
            {books.length > 0 && (
                <ReviewModal
                    isOpen={isReviewModalOpen}
                    onClose={() => setIsReviewModalOpen(false)}
                    bookId={reviewTargetBookId || ""}
                    bookTitle={books.find(b => b.id === reviewTargetBookId)?.title || ""}
                    status="READING"
                    onSuccess={() => setIsReviewModalOpen(false)}
                />
            )}
        </div>
    );
}
