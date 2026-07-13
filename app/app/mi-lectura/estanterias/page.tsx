"use client";

import * as React from "react";
import Link from "next/link";
import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { SearchInput } from "@/components/ui/SearchInput";
import { Select } from "@/components/ui/Select";
import { BookCard } from "@/components/ui/BookCard";
import { Button } from "@/components/ui/Button";
import { CreateShelfModal } from "@/components/shelves/CreateShelfModal";
import { MoveBookModal } from "@/components/shelves/MoveBookModal";
import { RegisterReadingModal } from "@/components/dashboard/RegisterReadingModal";
import { EditSessionModal } from "@/components/dashboard/EditSessionModal";
import { ReadingTimerModal } from "@/components/dashboard/ReadingTimerModal";
import { CreateNoteModal } from "@/components/notes/CreateNoteModal";
import { ReviewModal } from "@/components/reviews/ReviewModal";
import { EmptyLibrary } from "@/components/empty-states/EmptyLibrary";
import { cn } from "@/lib/utils";
import { getLibraryBooks, getUserShelves, CurrentBook, Shelf, startReadingBook, updateBookStatus } from "@/app/app/mi-lectura/actions";
import { AlertCircle, ArrowLeft, BookOpen, CheckCircle, Clock, FolderInput, Grid as GridIcon, List, PauseCircle, Plus, XCircle } from "lucide-react";

const SYSTEM_FILTERS = [
    { id: "all", label: "Todos los libros", icon: BookOpen },
    { id: "toread", label: "Por leer", icon: Clock },
    { id: "reading", label: "Leyendo", icon: BookOpen },
    { id: "read", label: "Leído", icon: CheckCircle },
    { id: "paused", label: "Pausado", icon: PauseCircle },
    { id: "abandoned", label: "Abandonado", icon: XCircle },
];

type SortOption = "recent" | "title" | "author";

function InlineError({ message }: { message: string }) {
    return (
        <div className="flex items-start gap-3 rounded-xl border border-coral/25 bg-coral/10 px-4 py-3 text-sm text-coral">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>{message}</p>
        </div>
    );
}

function ShelvesPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const initialFilter = searchParams.get("filter") || "all";

    const [activeFilter, setActiveFilter] = React.useState(initialFilter);
    const [isCreateModalOpen, setIsCreateModalOpen] = React.useState(false);
    const [activeMoveBook, setActiveMoveBook] = React.useState<{ id: string; title: string } | null>(null);
    const [searchQuery, setSearchQuery] = React.useState("");
    const [viewMode, setViewMode] = React.useState<"grid" | "list">("grid");
    const [sortOption, setSortOption] = React.useState<SortOption>("recent");

    const [isRegisterModalOpen, setIsRegisterModalOpen] = React.useState(false);
    const [isTimerOpen, setIsTimerOpen] = React.useState(false);
    const [isNoteModalOpen, setIsNoteModalOpen] = React.useState(false);
    const [selectedBookId, setSelectedBookId] = React.useState<string | undefined>(undefined);
    const [timerBook, setTimerBook] = React.useState<CurrentBook | null>(null);
    const [sessionDuration, setSessionDuration] = React.useState<number | undefined>(undefined);
    const [isReviewModalOpen, setIsReviewModalOpen] = React.useState(false);
    const [reviewTargetBookId, setReviewTargetBookId] = React.useState<string | undefined>(undefined);
    const [isEditSessionOpen, setIsEditSessionOpen] = React.useState(false);
    const [editSessionBookId, setEditSessionBookId] = React.useState<string | undefined>(undefined);

    const [books, setBooks] = React.useState<CurrentBook[]>([]);
    const [shelves, setShelves] = React.useState<Shelf[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [loadError, setLoadError] = React.useState("");
    const [actionError, setActionError] = React.useState("");

    const fetchData = React.useCallback(async () => {
        setIsLoading(true);
        setLoadError("");

        try {
            const fetchedShelves = await getUserShelves();
            setShelves(fetchedShelves);

            const isSystemFilter = SYSTEM_FILTERS.some((filter) => filter.id === activeFilter);
            const fetchedBooks = await getLibraryBooks({
                status: isSystemFilter && activeFilter !== "all" ? activeFilter : activeFilter === "all" ? "ALL" : undefined,
                shelfId: !isSystemFilter ? activeFilter : undefined,
                query: searchQuery,
                sort: sortOption,
            });

            setBooks(fetchedBooks);
        } catch (error) {
            console.error("Failed to load shelves:", error);
            setLoadError("No hemos podido cargar tu biblioteca. Inténtalo de nuevo en unos segundos.");
        } finally {
            setIsLoading(false);
        }
    }, [activeFilter, searchQuery, sortOption]);

    React.useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleShelfCreated = () => {
        fetchData();
    };

    const handleStartReading = async (bookId: string) => {
        setActionError("");
        const res = await startReadingBook(bookId);
        if (res.success) fetchData();
        else setActionError(res.error || "No hemos podido empezar este libro.");
    };

    const handleRetryBook = async (bookId: string) => {
        setActionError("");
        const res = await updateBookStatus(bookId, "WANT_TO_READ");
        if (res.success) fetchData();
        else setActionError(res.error || "No hemos podido mover este libro.");
    };

    const handleNewSession = (book: CurrentBook) => {
        setTimerBook(book);
        setIsTimerOpen(true);
    };

    const handleTimerFinish = (duration: number) => {
        setSessionDuration(duration);
        setIsTimerOpen(false);
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

    const handleFirstImpressions = (bookId: string) => {
        setReviewTargetBookId(bookId);
        setIsReviewModalOpen(true);
    };

    const handleCorrectLastSession = (bookId: string) => {
        setEditSessionBookId(bookId);
        setIsEditSessionOpen(true);
    };

    const handleBookPrimaryAction = (book: CurrentBook) => {
        switch (book.status) {
            case "WANT_TO_READ":
            case "PAUSED":
                handleStartReading(book.id);
                break;
            case "DNF":
                handleRetryBook(book.id);
                break;
            case "READING":
                handleNewSession(book);
                break;
            case "READ":
                router.push(`/app/libros/${book.id}`);
                break;
            default:
                break;
        }
    };

    const activeLabel = SYSTEM_FILTERS.find((filter) => filter.id === activeFilter)?.label
        || shelves.find((shelf) => shelf.id === activeFilter)?.name
        || "Biblioteca";

    return (
        <div className="space-y-6">
            <Link
                href="/app/mi-lectura"
                className="inline-flex items-center gap-2 rounded-full text-sm font-medium text-grey/60 transition-colors hover:text-teal"
            >
                <ArrowLeft className="h-4 w-4" />
                Volver
            </Link>

            <SectionHeader
                eyebrow="MI LECTURA"
                title="Estanterías"
                subtitle="Tu biblioteca personal."
                className="mb-0 md:mb-4 [&_h1]:text-[1.65rem] [&_h1]:leading-tight [&_p]:text-sm"
                action={{
                    label: "Añadir libro",
                    onClick: () => router.push("/app/mi-lectura/nuevo?from=/app/mi-lectura/estanterias"),
                    variant: "primary",
                }}
            />

            {loadError && <InlineError message={loadError} />}
            {actionError && <InlineError message={actionError} />}

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8">
                <aside className="space-y-5 lg:col-span-3 lg:space-y-8">
                    <div className="rounded-xl border border-teal/5 bg-white/90 p-3 shadow-sm lg:hidden">
                        <div className="mb-2 flex items-center justify-between">
                            <label htmlFor="library-filter" className="text-xs font-bold uppercase tracking-widest text-grey/40">
                                Mostrar
                            </label>
                            <button
                                onClick={() => setIsCreateModalOpen(true)}
                                className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium text-teal transition-colors hover:bg-teal/10"
                                type="button"
                            >
                                <Plus size={13} />
                                Colección
                            </button>
                        </div>
                        <select
                            id="library-filter"
                            value={activeFilter}
                            onChange={(event) => setActiveFilter(event.target.value)}
                            className="h-11 w-full appearance-none rounded-xl border border-teal/10 bg-white px-4 text-sm font-medium text-teal-dark shadow-sm outline-none transition-all focus:border-teal/30 focus:ring-2 focus:ring-teal/10"
                        >
                            <optgroup label="Biblioteca">
                                {SYSTEM_FILTERS.map((filter) => (
                                    <option key={filter.id} value={filter.id}>
                                        {filter.label}
                                    </option>
                                ))}
                            </optgroup>
                            {shelves.length > 0 && (
                                <optgroup label="Tus colecciones">
                                    {shelves.map((shelf) => (
                                        <option key={shelf.id} value={shelf.id}>
                                            {shelf.name} ({shelf.count})
                                        </option>
                                    ))}
                                </optgroup>
                            )}
                        </select>
                    </div>

                    <div className="hidden lg:block">
                        <p className="mb-2 px-3 text-xs font-bold uppercase tracking-widest text-grey/40">Biblioteca</p>
                        <div className="space-y-1">
                            {SYSTEM_FILTERS.map((filter) => (
                                <button
                                    key={filter.id}
                                    onClick={() => setActiveFilter(filter.id)}
                                    className={cn(
                                        "flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-all",
                                        activeFilter === filter.id
                                            ? "bg-teal/10 text-teal"
                                            : "text-grey/60 hover:bg-teal/5 hover:text-teal-dark"
                                    )}
                                >
                                    <span className="flex items-center gap-3">
                                        <filter.icon size={16} />
                                        {filter.label}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="hidden lg:block">
                        <div className="mb-2 flex items-center justify-between px-3">
                            <p className="text-xs font-bold uppercase tracking-widest text-grey/40">Tus colecciones</p>
                            <button
                                onClick={() => setIsCreateModalOpen(true)}
                                className="rounded p-1 text-teal transition-colors hover:bg-teal/10"
                                title="Nueva colección"
                            >
                                <Plus size={14} />
                            </button>
                        </div>

                        {shelves.length > 0 ? (
                            <div className="space-y-1">
                                {shelves.map((shelf) => (
                                    <button
                                        key={shelf.id}
                                        onClick={() => setActiveFilter(shelf.id)}
                                        className={cn(
                                            "flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all group",
                                            activeFilter === shelf.id
                                                ? "bg-teal/10 text-teal"
                                                : "text-grey/60 hover:bg-teal/5 hover:text-teal-dark"
                                        )}
                                    >
                                        <span className="flex items-center gap-3">
                                            <span className="h-4 w-4 rounded-full border-2 border-teal/20 group-hover:border-teal/40" />
                                            {shelf.name}
                                        </span>
                                        <span className={cn(
                                            "rounded-md px-1.5 py-0.5 text-xs opacity-60 transition-opacity",
                                            activeFilter === shelf.id ? "bg-white/50" : "opacity-0 group-hover:opacity-100"
                                        )}>
                                            {shelf.count}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <div className="px-3 py-2 text-xs italic text-grey/40">
                                No has creado colecciones aún.
                            </div>
                        )}
                    </div>
                </aside>

                <main className="min-w-0 lg:col-span-9">
                    <div className="mb-6 flex flex-col gap-4 rounded-xl border border-teal/5 bg-white/90 p-3 shadow-sm backdrop-blur-md lg:sticky lg:top-24 lg:z-10 lg:flex-row lg:items-center lg:justify-between lg:p-4">
                        <div className="flex w-full items-center gap-4 lg:w-auto">
                            <h2 className="hidden whitespace-nowrap text-lg font-semibold text-teal-dark md:block">{activeLabel}</h2>
                            <div className="hidden h-6 w-px bg-grey/10 md:block" />
                            <div className="w-full md:w-64">
                                <SearchInput
                                    placeholder="Buscar..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="bg-transparent border-none shadow-none focus:ring-0 px-0"
                                />
                            </div>
                        </div>

                        <div className="flex w-full items-center justify-between gap-2 lg:w-auto lg:justify-end">
                            <Select
                                options={[
                                    { label: "Reciente", value: "recent" },
                                    { label: "Título", value: "title" },
                                    { label: "Autor", value: "author" },
                                ]}
                                className="w-32"
                                value={sortOption}
                                onChange={(e) => setSortOption(e.target.value as SortOption)}
                            />
                            <div className="flex rounded-lg bg-grey/5 p-1">
                                <button
                                    onClick={() => setViewMode("grid")}
                                    className={cn("rounded p-1.5 transition-all", viewMode === "grid" ? "bg-white text-teal shadow" : "text-grey/40 hover:text-grey")}
                                    aria-label="Vista en cuadrícula"
                                >
                                    <GridIcon size={16} />
                                </button>
                                <button
                                    onClick={() => setViewMode("list")}
                                    className={cn("rounded p-1.5 transition-all", viewMode === "list" ? "bg-white text-teal shadow" : "text-grey/40 hover:text-grey")}
                                    aria-label="Vista en lista"
                                >
                                    <List size={16} />
                                </button>
                            </div>
                        </div>
                    </div>

                    {!isLoading && activeFilter === "all" && books.length === 0 && !searchQuery ? (
                        <EmptyLibrary />
                    ) : isLoading ? (
                        <div className="grid grid-cols-1 gap-5 animate-pulse sm:grid-cols-2 xl:grid-cols-3">
                            {[1, 2, 3, 4].map((item) => (
                                <div key={item} className="h-64 rounded-xl bg-grey/5" />
                            ))}
                        </div>
                    ) : books.length > 0 ? (
                        <div className={cn(
                            "grid animate-fade-in",
                            viewMode === "grid" ? "grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3" : "grid-cols-1 gap-4"
                        )}>
                            {books.map((book) => (
                                <div key={book.id} className="relative group">
                                    <BookCard
                                        {...book}
                                        coverUrl={book.coverUrl || ""}
                                        compact={viewMode === "grid"}
                                        onActionClick={() => handleBookPrimaryAction(book)}
                                        onRegisterClick={() => handleManualRegister(book.id)}
                                        onNotesClick={() => handleOpenNoteModal(book.id)}
                                        onReviewClick={() => handleFirstImpressions(book.id)}
                                        onCorrectLastClick={() => handleCorrectLastSession(book.id)}
                                        reviewLabel="Primeras impresiones"
                                    />
                                    <div className="absolute right-2 top-2 z-10 flex gap-1 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
                                        <button
                                            onClick={() => setActiveMoveBook({ id: book.id, title: book.title })}
                                            className="rounded-full border border-teal/10 bg-white p-1.5 text-grey shadow-md transition-all hover:scale-110 hover:text-teal"
                                            title="Mover a otra estantería"
                                        >
                                            <FolderInput size={14} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="rounded-xl border border-dashed border-teal/10 bg-cream/10 py-16 text-center animate-fade-in">
                            <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-teal/5 text-teal/40">
                                <BookOpen size={24} />
                            </div>
                            <h3 className="mb-1 text-lg font-medium text-teal-dark">Esta estantería está vacía</h3>
                            <p className="mx-auto mb-6 max-w-xs text-sm text-grey/60">
                                {searchQuery ? "No hay resultados para tu búsqueda." : "Añade libros para verlos aquí."}
                            </p>
                            {!searchQuery && activeFilter === "toread" && (
                                <Button variant="outline" size="sm" onClick={() => router.push("/app/explorar")}>
                                    Explorar catálogo
                                </Button>
                            )}
                        </div>
                    )}
                </main>
            </div>

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
                onSuccess={fetchData}
                books={books.map((book) => ({ ...book, coverUrl: book.coverUrl || "" }))}
                initialBookId={selectedBookId}
                initialDuration={sessionDuration}
            />

            <ReadingTimerModal
                isOpen={isTimerOpen}
                onClose={() => setIsTimerOpen(false)}
                onFinish={handleTimerFinish}
                bookTitle={timerBook?.title || "Lectura actual"}
            />

            <EditSessionModal
                isOpen={isEditSessionOpen}
                onClose={() => setIsEditSessionOpen(false)}
                bookId={editSessionBookId}
                bookTitle={books.find((book) => book.id === editSessionBookId)?.title}
                onSuccess={fetchData}
            />

            <CreateNoteModal
                isOpen={isNoteModalOpen}
                onClose={() => setIsNoteModalOpen(false)}
                books={books.map((book) => ({ ...book, coverUrl: book.coverUrl || "" }))}
                initialBookId={selectedBookId}
            />

            {books.length > 0 && (
                <ReviewModal
                    isOpen={isReviewModalOpen}
                    onClose={() => setIsReviewModalOpen(false)}
                    bookId={reviewTargetBookId || ""}
                    bookTitle={books.find((book) => book.id === reviewTargetBookId)?.title || ""}
                    status="READING"
                    onSuccess={() => setIsReviewModalOpen(false)}
                />
            )}
        </div>
    );
}

export default function ShelvesPage() {
    return (
        <Suspense fallback={<div className="py-12 text-center text-grey/40">Cargando...</div>}>
            <ShelvesPageContent />
        </Suspense>
    );
}
