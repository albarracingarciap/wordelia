"use client";

import * as React from "react";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { StatsRow } from "@/components/dashboard/StatsRow";
import { BookCard } from "@/components/ui/BookCard";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { RegisterReadingModal } from "@/components/dashboard/RegisterReadingModal";
import { ReadingTimerModal } from "@/components/dashboard/ReadingTimerModal";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { CreateNoteModal } from "@/components/notes/CreateNoteModal";
import { ReviewModal } from "@/components/reviews/ReviewModal";
import { DashboardSkeleton } from "@/components/dashboard/DashboardSkeleton";
import { getCurrentBooks, getReadingStats, getRecentNotes, CurrentBook, ReadingStats, Note, deleteBook, getRecommendedBook, RecommendedBook, startReadingBook } from "@/app/app/mi-lectura/actions";
import { Search, BookOpen } from "lucide-react";

export default function MiLecturaPage() {
    const router = useRouter();
    const [recommendationFilter, setRecommendationFilter] = React.useState("ritmo"); // rhythm, popular, new
    const [isRegisterModalOpen, setIsRegisterModalOpen] = React.useState(false);
    const [isTimerOpen, setIsTimerOpen] = React.useState(false);
    const [sessionDuration, setSessionDuration] = React.useState<number | undefined>(undefined);
    const [isNoteModalOpen, setIsNoteModalOpen] = React.useState(false);

    // Real Data State
    const [books, setBooks] = React.useState<CurrentBook[]>([]);
    const [stats, setStats] = React.useState<ReadingStats | null>(null);
    const [notes, setNotes] = React.useState<Note[]>([]);
    const [recommendedBook, setRecommendedBook] = React.useState<RecommendedBook | null>(null);
    const [isLoading, setIsLoading] = React.useState(true);
    const [launcherQuery, setLauncherQuery] = React.useState("");
    const [registerBookId, setRegisterBookId] = React.useState<string | undefined>(undefined);
    const [noteTargetBookId, setNoteTargetBookId] = React.useState<string | undefined>(undefined);

    const handleOpenNoteModal = (bookId?: string) => {
        setNoteTargetBookId(bookId);
        setIsNoteModalOpen(true);
    };

    const [isReviewModalOpen, setIsReviewModalOpen] = React.useState(false);
    const [reviewTargetBookId, setReviewTargetBookId] = React.useState<string | undefined>(undefined);

    const handleFirstImpressions = (bookId: string) => {
        setReviewTargetBookId(bookId);
        setIsReviewModalOpen(true);
    };

    // Fetch Data
    React.useEffect(() => {
        async function loadData() {
            try {
                const [fetchedBooks, fetchedStats, fetchedNotes, fetchedRecommendation] = await Promise.all([
                    getCurrentBooks(),
                    getReadingStats(),
                    getRecentNotes(),
                    getRecommendedBook()
                ]);
                setBooks(fetchedBooks);
                setStats(fetchedStats);
                setNotes(fetchedNotes);
                setRecommendedBook(fetchedRecommendation);
            } catch (error) {
                console.error("Failed to load dashboard data:", error);
            } finally {
                setIsLoading(false);
            }
        }
        loadData();
    }, []);

    const hasBooks = books.length > 0;

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

    const handleDeleteBook = async (bookId: string) => {
        if (!confirm("¿Estás seguro de que quieres dejar de leer este libro? Se eliminará de tu lista 'Ahora leyendo'.")) return;

        const res = await deleteBook(bookId);
        if (res.success) {
            setBooks(prev => prev.filter(b => b.id !== bookId));
        } else {
            alert("Error al eliminar el libro: " + res.error);
        }
    };

    const handleLauncherSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (launcherQuery.trim()) {
            router.push(`/app/search?q=${encodeURIComponent(launcherQuery)}&status=READING`);
        }
    };

    const handleStartReading = async (bookId: string) => {
        const res = await startReadingBook(bookId);
        if (res.success) {
            // Optimistic update or reload
            // Ideally we re-fetch all data, but for now let's just reload the page or fetch data again
            // Simple way:
            window.location.reload();
        } else {
            alert("Error al iniciar lectura: " + res.error);
        }
    };

    if (isLoading) {
        return <DashboardSkeleton />;
    }

    return (
        <div>
            {/* Header */}
            <SectionHeader
                eyebrow="MI LECTURA"
                title="Tu rincón de lectura"
                subtitle="Continúa donde lo dejaste, guarda tus momentos y avanza a tu ritmo."
            />

            {/* Main Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                {/* Left Column (Main Content) - 8 Cols */}
                <div className="lg:col-span-8 space-y-10">

                    {/* Stats Row */}
                    <div className="-mb-4">
                        <StatsRow
                            streakDays={hasBooks && stats ? stats.streak : undefined}
                            weeklyPages={hasBooks && stats ? stats.weeklyPages : undefined}
                            activeClubs={hasBooks && stats ? stats.activeClubs : undefined}
                            spoilerMode={false} // TODO: fetch from preferences
                        />
                    </div>

                    {/* Section 1: Ahora Leyendo */}
                    <section>
                        <h2 className="text-xl font-serif text-teal mb-4">Ahora leyendo</h2>

                        {hasBooks ? (
                            <div className="space-y-4">
                                {books.map((book) => (
                                    <BookCard
                                        key={book.id}
                                        {...book}
                                        coverUrl={book.coverUrl || ""}
                                        onRegisterClick={() => handleManualRegister(book.id)}
                                        actionLabel="Nueva sesión"
                                        onActionClick={handleNewSession}
                                        onDelete={() => handleDeleteBook(book.id)}
                                        onNotesClick={() => handleOpenNoteModal(book.id)}
                                        onReviewClick={() => handleFirstImpressions(book.id)}
                                        reviewLabel="Primeras impresiones"
                                    />
                                ))}
                            </div>
                        ) : (
                            // LAUNCHER EMPTY STATE
                            <div className="flex flex-col items-center justify-center py-16 text-center animate-fade-in bg-white/50 rounded-2xl border border-teal/5 p-8">
                                <div className="w-20 h-20 bg-teal/5 rounded-full flex items-center justify-center mb-6 text-teal/40">
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
                                <div className="mt-8 flex gap-4 text-sm text-grey/60">
                                    <span>¿Buscas inspiración?</span>
                                    <Link href="/explorar" className="text-teal font-medium hover:underline">Explorar catálogos</Link>
                                </div>
                            </div>
                        )}
                    </section>

                    {/* Section 2: Próximos Hitos (Placeholder for now) */}
                    <section>
                        <h2 className="text-xl font-serif text-teal mb-4">Próximos hitos</h2>
                        <Card className="bg-cream/20 border-teal/5">
                            <div className="py-6 text-center space-y-2">
                                <p className="text-sm text-grey/60 font-medium">No hay hitos pendientes</p>
                                <p className="text-xs text-grey/40 max-w-[200px] mx-auto">
                                    Uniéndote a un club o reto comenzarás a ver aquí tus próximas metas.
                                </p>
                            </div>
                        </Card>
                    </section>

                    {/* Section 3: Momentos Guardados */}
                    <section>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-serif text-teal">Momentos guardados</h2>
                            {notes.length > 0 && (
                                <Link href="/app/mi-lectura/notas" className="text-xs font-medium text-teal hover:underline">Ver todas</Link>
                            )}
                        </div>
                        {notes.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {notes.map((note) => (
                                    <Card key={note.id} className="hover:border-teal/20 cursor-pointer group bg-white">
                                        <p className="text-xs font-bold text-grey/40 mb-2 uppercase tracking-wide">{note.book}</p>
                                        <p className="text-sm text-grey italic mb-3 line-clamp-2">"{note.snippet}"</p>
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
                <div className="lg:col-span-4 space-y-8">

                    {/* Section 4: Actions */}
                    <section>
                        <h2 className="text-sm font-bold text-grey/40 uppercase tracking-widest mb-3">A un clic</h2>
                        <div className="space-y-3">
                            <Link
                                href="/app/mi-lectura/nuevo"
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
                                <Link href="#" className="p-3 bg-white border border-teal/5 rounded-lg text-xs font-medium text-grey hover:border-teal/20 hover:text-teal transition-all text-center shadow-sm flex items-center justify-center h-full">
                                    Crear un club
                                </Link>
                                <Link href="#" className="p-3 bg-white border border-teal/5 rounded-lg text-xs font-medium text-grey hover:border-teal/20 hover:text-teal transition-all text-center shadow-sm flex items-center justify-center h-full">
                                    Explorar clubs
                                </Link>
                            </div>
                        </div>
                    </section>

                    {/* Section 5: Recommended */}
                    <section>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-sm font-bold text-grey/40 uppercase tracking-widest">Recomendado hoy</h2>
                            {/* Filter hidden as requested */}
                        </div>
                        {recommendedBook ? (
                            <BookCard
                                title={recommendedBook.title}
                                author={recommendedBook.author}
                                coverUrl={recommendedBook.coverUrl || ""}
                                compact
                                tag={`Añadido: ${recommendedBook.addedDate}`}
                                actionLabel="Empezar"
                                onActionClick={() => handleStartReading(recommendedBook.id)}
                            />
                        ) : (
                            <Card className="bg-cream/10 border-dashed border-teal/10 p-4 text-center">
                                <p className="text-xs text-grey/60">
                                    Añade libros a tu lista "Quiero leer" para recibir recomendaciones aquí.
                                </p>
                            </Card>
                        )}
                    </section>

                    {/* Section 6: Weekly Summary */}
                    <section>
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
                                        "La lectura es un refugio, no una carrera."
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
                // bookTitle can be removed or kept as fallback logic inside modal, but passing books is key
                books={books.map(b => ({ ...b, coverUrl: b.coverUrl || "" }))}
                initialBookId={registerBookId || (books.length > 0 ? books[0].id : undefined)}
                initialDuration={sessionDuration}
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
