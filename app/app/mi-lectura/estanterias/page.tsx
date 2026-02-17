"use client";

import * as React from "react";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { SearchInput } from "@/components/ui/SearchInput";
import { Select } from "@/components/ui/Select";
import { BookCard } from "@/components/ui/BookCard";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { CreateShelfModal } from "@/components/shelves/CreateShelfModal";
import { MoveBookModal } from "@/components/shelves/MoveBookModal";
import { RegisterReadingModal } from "@/components/dashboard/RegisterReadingModal";
import { ReadingTimerModal } from "@/components/dashboard/ReadingTimerModal";
import { CreateNoteModal } from "@/components/notes/CreateNoteModal";
import { ReviewModal } from "@/components/reviews/ReviewModal";
import { EmptyLibrary } from "@/components/empty-states/EmptyLibrary";
import { BookOpen, List, Grid as GridIcon, Star, Clock, CheckCircle, PauseCircle, XCircle, Plus, FolderInput } from "lucide-react";
import { cn } from "@/lib/utils";
import { getLibraryBooks, getUserShelves, CurrentBook, Shelf, startReadingBook, updateBookStatus } from "@/app/app/mi-lectura/actions";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

// --- STATIC FILTERS ---
const SYSTEM_FILTERS = [
    { id: "all", label: "Todos los libros", icon: BookOpen },
    { id: "toread", label: "Por leer", icon: Clock },
    { id: "reading", label: "Leyendo", icon: BookOpen },
    { id: "read", label: "Leído", icon: CheckCircle },
    { id: "paused", label: "Pausado", icon: PauseCircle },
    { id: "abandoned", label: "Abandonado", icon: XCircle },
];

function ShelvesPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const initialFilter = searchParams.get("filter") || "all";
    const [activeFilter, setActiveFilter] = React.useState(initialFilter);
    const [isCreateModalOpen, setIsCreateModalOpen] = React.useState(false);
    const [activeMoveBook, setActiveMoveBook] = React.useState<{ id: string, title: string } | null>(null);
    const [searchQuery, setSearchQuery] = React.useState("");
    const [viewMode, setViewMode] = React.useState<"grid" | "list">("grid");
    const [sortOption, setSortOption] = React.useState<"recent" | "title" | "author">("recent");

    // Modal States
    const [isRegisterModalOpen, setIsRegisterModalOpen] = React.useState(false);
    const [isTimerOpen, setIsTimerOpen] = React.useState(false);
    const [isNoteModalOpen, setIsNoteModalOpen] = React.useState(false);
    const [selectedBookId, setSelectedBookId] = React.useState<string | undefined>(undefined);
    const [timerBook, setTimerBook] = React.useState<CurrentBook | null>(null);
    const [sessionDuration, setSessionDuration] = React.useState<number | undefined>(undefined);

    // Real Data State
    const [books, setBooks] = React.useState<CurrentBook[]>([]);
    const [shelves, setShelves] = React.useState<Shelf[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [systemCounts, setSystemCounts] = React.useState<Record<string, number>>({});

    // Fetch Data
    const fetchData = React.useCallback(async () => {
        setIsLoading(true);
        try {
            // 1. Fetch Shelves
            const fetchedShelves = await getUserShelves();
            setShelves(fetchedShelves);

            // 2. Fetch Books based on active filter
            const isSystemFilter = SYSTEM_FILTERS.some(f => f.id === activeFilter);

            const fetchedBooks = await getLibraryBooks({
                status: isSystemFilter && activeFilter !== 'all' ? activeFilter : (activeFilter === 'all' ? 'ALL' : undefined),
                shelfId: !isSystemFilter ? activeFilter : undefined, // If not system, it's a shelf ID
                query: searchQuery,
                sort: sortOption
            });
            setBooks(fetchedBooks);

            // 3. Fetch counts for system filters (optional optimization: do incorrectly or lazily)
            // For now, let's just do a "All" fetch to count or separate counts action?
            // To avoid N requests, we might skip counts or add a specific action 'getCounts'.
            // Let's defer exact system counts to a separate action if needed, or just show for current view?
            // VISUAL DESIGN shows counts. We should probably fetch them.
            // Simplified: we won't show counts for now to save bandwidth, or we fetch "stats" object.

        } catch (error) {
            console.error("Failed to load shelves:", error);
        } finally {
            setIsLoading(false);
        }
    }, [activeFilter, searchQuery, sortOption]);

    React.useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Handle Create Shelf success
    const handleShelfCreated = (newShelfName: string) => {
        fetchData();
    };

    // --- ACTION HANDLERS ---

    const handleStartReading = async (bookId: string) => {
        const res = await startReadingBook(bookId);
        if (res.success) fetchData();
    };

    const handleResumeReading = async (bookId: string) => {
        // Resume is same as Start (sets status to READING)
        const res = await startReadingBook(bookId);
        if (res.success) fetchData();
    };

    const handleRetryBook = async (bookId: string) => {
        // "Dar otra oportunidad" -> Move to WANT_TO_READ
        const res = await updateBookStatus(bookId, 'WANT_TO_READ');
        if (res.success) fetchData();
    };

    const handleNewSession = (book: CurrentBook) => {
        setTimerBook(book);
        setIsTimerOpen(true);
    };

    const handleTimerFinish = (duration: number) => {
        setSessionDuration(duration);
        setIsTimerOpen(false);
        // Open register modal with the book from timer
        if (timerBook) {
            setSelectedBookId(timerBook.id);
            setIsRegisterModalOpen(true);
        }
    };

    const handleManualRegister = (bookId: string) => {
        setSessionDuration(undefined);
        setSelectedBookId(bookId);
        setIsRegisterModalOpen(true);
    };

    const handleOpenNoteModal = (bookId: string) => {
        setSelectedBookId(bookId);
        setIsNoteModalOpen(true);
    };

    const [isReviewModalOpen, setIsReviewModalOpen] = React.useState(false);
    const [reviewTargetBookId, setReviewTargetBookId] = React.useState<string | undefined>(undefined);

    const handleFirstImpressions = (bookId: string) => {
        setReviewTargetBookId(bookId);
        setIsReviewModalOpen(true);
    };

    const handleViewDetails = (bookId: string) => {
        router.push(`/app/libros/${bookId}`);
    };

    const handleBookPrimaryAction = (book: CurrentBook) => {
        switch (book.status) {
            case 'WANT_TO_READ':
                handleStartReading(book.id);
                break;
            case 'PAUSED':
                handleResumeReading(book.id);
                break;
            case 'DNF':
                handleRetryBook(book.id);
                break;
            case 'READING':
                handleNewSession(book);
                break;
            case 'READ':
                handleViewDetails(book.id);
                break;
            default:
                break;
        }
    };

    const activeLabel = SYSTEM_FILTERS.find(f => f.id === activeFilter)?.label
        || shelves.find(s => s.id === activeFilter)?.name
        || "Biblioteca";

    // GLOBAL EMPTY STATE (Only if ALL and empty)
    if (!isLoading && activeFilter === 'all' && books.length === 0 && !searchQuery) {
        return <EmptyLibrary />;
    }

    return (
        <div className="min-h-screen">
            {/* Header */}
            <SectionHeader
                eyebrow="MI LECTURA"
                title="Estanterías"
                subtitle="Tu biblioteca personal."
                action={{
                    label: "Añadir libro",
                    onClick: () => router.push("/app/mi-lectura/nuevo"),
                    variant: "primary"
                }}
            />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-6">

                {/* LEFT SIDEBAR: NAVIGATOR */}
                <div className="lg:col-span-3 space-y-8">
                    {/* System Collections */}
                    <div className="space-y-1">
                        <p className="px-3 text-xs font-bold text-grey/40 uppercase tracking-widest mb-2">Biblioteca</p>
                        {SYSTEM_FILTERS.map(filter => (
                            <button
                                key={filter.id}
                                onClick={() => setActiveFilter(filter.id)}
                                className={cn(
                                    "w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-all",
                                    activeFilter === filter.id
                                        ? "bg-teal/10 text-teal"
                                        : "text-grey/60 hover:bg-cream/50 hover:text-teal-dark"
                                )}
                            >
                                <div className="flex items-center gap-3">
                                    <filter.icon size={16} />
                                    <span>{filter.label}</span>
                                </div>
                                {/* Counts removed for now until separate action exists */}
                            </button>
                        ))}
                    </div>

                    {/* Custom Shelves */}
                    <div className="space-y-1">
                        <div className="flex items-center justify-between px-3 mb-2">
                            <p className="text-xs font-bold text-grey/40 uppercase tracking-widest">Tus Colecciones</p>
                            <button
                                onClick={() => setIsCreateModalOpen(true)}
                                className="text-teal hover:bg-teal/10 rounded p-1 transition-colors"
                                title="Nueva colección"
                            >
                                <Plus size={14} />
                            </button>
                        </div>
                        {shelves.length > 0 ? shelves.map(shelf => (
                            <button
                                key={shelf.id}
                                onClick={() => setActiveFilter(shelf.id)}
                                className={cn(
                                    "w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-all group",
                                    activeFilter === shelf.id
                                        ? "bg-teal/10 text-teal"
                                        : "text-grey/60 hover:bg-cream/50 hover:text-teal-dark"
                                )}
                            >
                                <div className="flex items-center gap-3">
                                    <span className="w-4 h-4 rounded-full border-2 border-teal/20 group-hover:border-teal/40"></span>
                                    <span>{shelf.name}</span>
                                </div>
                                <span className={cn(
                                    "text-xs opacity-60 px-1.5 py-0.5 rounded-md transition-opacity",
                                    activeFilter === shelf.id ? "bg-white/50" : "opacity-0 group-hover:opacity-100"
                                )}>
                                    {shelf.count}
                                </span>
                            </button>
                        )) : (
                            <div className="px-3 py-2 text-xs text-grey/40 italic">
                                No has creado colecciones aún.
                            </div>
                        )}
                    </div>
                </div>

                {/* MAIN CONTENT: GRID */}
                <div className="lg:col-span-9">

                    {/* Toolbar */}
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-teal/5 flex flex-col md:flex-row gap-4 items-center justify-between mb-6 sticky top-4 z-10 backdrop-blur-md bg-white/90">
                        <div className="flex items-center gap-4 w-full md:w-auto">
                            <h2 className="text-lg font-serif text-teal-dark whitespace-nowrap hidden md:block">{activeLabel}</h2>
                            <div className="h-6 w-px bg-grey/10 hidden md:block"></div>
                            <div className="w-full md:w-64">
                                <SearchInput
                                    placeholder="Buscar..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="bg-transparent border-none shadow-none focus:ring-0 px-0"
                                />
                            </div>
                        </div>

                        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                            <Select
                                options={[
                                    { label: "Reciente", value: "recent" },
                                    { label: "Título", value: "title" },
                                    { label: "Autor", value: "author" },
                                ]}
                                className="w-32"
                                value={sortOption}
                                onChange={(e) => setSortOption(e.target.value as any)}
                            />
                            <div className="flex bg-grey/5 p-1 rounded-lg">
                                <button
                                    onClick={() => setViewMode("grid")}
                                    className={cn("p-1.5 rounded transition-all", viewMode === "grid" ? "bg-white shadow text-teal" : "text-grey/40 hover:text-grey")}
                                >
                                    <GridIcon size={16} />
                                </button>
                                <button
                                    onClick={() => setViewMode("list")}
                                    className={cn("p-1.5 rounded transition-all", viewMode === "list" ? "bg-white shadow text-teal" : "text-grey/40 hover:text-grey")}
                                >
                                    <List size={16} />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Content Grid */}
                    {isLoading ? (
                        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-pulse">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="h-64 bg-grey/5 rounded-xl"></div>
                            ))}
                        </div>
                    ) : books.length > 0 ? (
                        <div className={cn(
                            "grid gap-6 animate-fade-in",
                            viewMode === "grid" ? "grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "grid-cols-1"
                        )}>
                            {books.map(book => (
                                <div key={book.id} className="relative group">
                                    <BookCard
                                        {...book}
                                        coverUrl={book.coverUrl || ""}
                                        compact={viewMode === "grid"}
                                        onActionClick={() => handleBookPrimaryAction(book)}
                                        onRegisterClick={() => handleManualRegister(book.id)}
                                        onNotesClick={() => handleOpenNoteModal(book.id)}
                                        onReviewClick={() => handleFirstImpressions(book.id)}
                                        reviewLabel="Primeras impresiones"
                                    />
                                    {/* Hover Actions (Desktop) */}
                                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                        <button
                                            onClick={() => setActiveMoveBook({ id: book.id, title: book.title })}
                                            className="p-1.5 bg-white shadow-md rounded-full text-grey hover:text-teal hover:scale-110 transition-all border border-teal/10"
                                            title="Mover a otra estantería"
                                        >
                                            <FolderInputIcon size={14} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-20 bg-cream/10 rounded-xl border border-dashed border-teal/10 animate-fade-in">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-teal/5 text-teal/40 mb-4">
                                <BookOpen size={24} />
                            </div>
                            <h3 className="text-lg font-medium text-teal-dark mb-1">Esta estantería está vacía</h3>
                            <p className="text-grey/60 text-sm max-w-xs mx-auto mb-6">
                                {searchQuery ? "No hay resultados para tu búsqueda." : "Añade libros para verlos aquí."}
                            </p>
                            {!searchQuery && activeFilter === 'toread' && (
                                <Button variant="outline" size="sm" onClick={() => console.log("Add")}>
                                    Explorar catálogo
                                </Button>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Modals */}
            <CreateShelfModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onCreate={handleShelfCreated}
            />

            {activeMoveBook && (
                <MoveBookModal
                    isOpen={!!activeMoveBook}
                    onClose={() => setActiveMoveBook(null)}
                    bookTitle={activeMoveBook.title}
                    bookId={activeMoveBook.id}
                    onMoveComplete={fetchData}
                />
            )}

            <RegisterReadingModal
                isOpen={isRegisterModalOpen}
                onClose={() => setIsRegisterModalOpen(false)}
                books={books.map(b => ({ ...b, coverUrl: b.coverUrl || "" }))}
                initialBookId={selectedBookId}
                initialDuration={sessionDuration}
            />

            <ReadingTimerModal
                isOpen={isTimerOpen}
                onClose={() => setIsTimerOpen(false)}
                onFinish={handleTimerFinish}
                bookTitle={timerBook?.title || "Lectura actual"}
            />

            <CreateNoteModal
                isOpen={isNoteModalOpen}
                onClose={() => setIsNoteModalOpen(false)}
                books={books.map(b => ({ ...b, coverUrl: b.coverUrl || "" }))}
                initialBookId={selectedBookId}
            />

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

function FolderInputIcon({ size = 24, className }: { size?: number, className?: string }) {
    return (
        <svg width={size} height={size} className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 9a3 3 0 0 1 3-3h6l2 2h7a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3H5a3 3 0 0 1-3-3V9z" /><path d="M12 10v6" /><path d="m9 13 3 3 3-3" /></svg>
    )
}

export default function ShelvesPage() {
    return (
        <Suspense fallback={<div className="text-center py-12 text-grey/40">Cargando...</div>}>
            <ShelvesPageContent />
        </Suspense>
    );
}
