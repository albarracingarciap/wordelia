"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, Plus, X } from "lucide-react";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { SearchInput } from "@/components/ui/SearchInput";
import { Select } from "@/components/ui/Select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { NoteCard, Note } from "@/components/notes/NoteCard";
import { NotesStats } from "@/components/notes/NotesStats";
import { CreateNoteModal } from "@/components/notes/CreateNoteModal";

const TYPE_FILTERS = [
    { id: "all", label: "Todas" },
    { id: "Cita", label: "Citas" },
    { id: "Idea", label: "Ideas" },
    { id: "Pregunta", label: "Preguntas" },
    { id: "Personaje", label: "Personajes" },
    { id: "Subrayado", label: "Subrayados" },
    { id: "Emociones", label: "Emociones" },
];

type SortOrder = "recent" | "book" | "type";
type ViewMode = "recent" | "book" | "type" | "tags";

function getNoteTypeGroup(note: Note) {
    return note.type.startsWith("Emoción") ? "Emociones" : note.type;
}

function splitColumns(items: Note[]) {
    const left: Note[] = [];
    const right: Note[] = [];
    items.forEach((item, index) => {
        if (index % 2 === 0) left.push(item);
        else right.push(item);
    });
    return { left, right };
}

function NotesGrid({
    notes,
    onEdit,
    onDelete,
    onToggleHighlight,
    onToggleResolved,
    onTagClick,
}: {
    notes: Note[];
    onEdit: (note: Note) => void;
    onDelete: (note: Note) => void;
    onToggleHighlight: (note: Note) => void;
    onToggleResolved: (note: Note) => void;
    onTagClick: (tag: string) => void;
}) {
    const { left, right } = splitColumns(notes);

    const renderNote = (note: Note) => (
        <NoteCard
            key={note.id}
            note={note}
            onEdit={onEdit}
            onDelete={onDelete}
            onToggleHighlight={onToggleHighlight}
            onToggleResolved={onToggleResolved}
            onTagClick={onTagClick}
        />
    );

    return (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-4">{left.map(renderNote)}</div>
            <div className="space-y-4">{right.map(renderNote)}</div>
        </div>
    );
}

export default function NotesPage() {
    const [books, setBooks] = React.useState<{ id: string; title: string }[]>([]);
    const [notes, setNotes] = React.useState<Note[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = React.useState(false);
    const [editingNote, setEditingNote] = React.useState<Note | undefined>(undefined);
    const [noteToDelete, setNoteToDelete] = React.useState<Note | null>(null);
    const [isDeleting, setIsDeleting] = React.useState(false);
    const [searchQuery, setSearchQuery] = React.useState("");
    const [sortOrder, setSortOrder] = React.useState<SortOrder>("recent");
    const [activeType, setActiveType] = React.useState("all");
    const [activeTag, setActiveTag] = React.useState("");
    const [viewMode, setViewMode] = React.useState<ViewMode>("recent");
    const [feedback, setFeedback] = React.useState("");

    const refreshData = React.useCallback(async () => {
        setIsLoading(true);

        try {
            const { getLibraryBooks, getAllNotes } = await import("@/app/app/mi-lectura/actions");
            const [libraryBooks, allNotes] = await Promise.all([
                getLibraryBooks({ status: "ALL" }),
                getAllNotes(),
            ]);
            setBooks(libraryBooks.map((book) => ({ id: book.id, title: book.title })));
            setNotes(allNotes as Note[]);
        } catch (error) {
            console.error("Failed to load notes data:", error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    React.useEffect(() => {
        refreshData();
    }, [refreshData]);

    const filteredNotes = React.useMemo(() => {
        const query = searchQuery.trim().toLowerCase();

        return notes.filter((note) => {
            const matchesSearch = !query
                || note.content?.toLowerCase().includes(query)
                || note.bookTitle?.toLowerCase().includes(query)
                || note.bookAuthor?.toLowerCase().includes(query)
                || note.type?.toLowerCase().includes(query)
                || note.tags?.some((tag) => tag.toLowerCase().includes(query));
            const matchesType = activeType === "all" || getNoteTypeGroup(note) === activeType;
            const matchesTag = !activeTag || note.tags?.some((tag) => tag.toLowerCase() === activeTag.toLowerCase());

            return matchesSearch && matchesType && matchesTag;
        });
    }, [activeTag, activeType, notes, searchQuery]);

    const sortedNotes = React.useMemo(() => {
        const copy = [...filteredNotes];

        if (sortOrder === "book") {
            copy.sort((a, b) => (a.bookTitle || "").localeCompare(b.bookTitle || ""));
        }

        if (sortOrder === "type") {
            copy.sort((a, b) => getNoteTypeGroup(a).localeCompare(getNoteTypeGroup(b)));
        }

        return copy;
    }, [filteredNotes, sortOrder]);

    const stats = React.useMemo(() => {
        const uniqueBooks = new Set(notes.map((note) => note.bookTitle)).size;
        const questions = notes.filter((note) => note.type === "Pregunta" && !note.resolvedAt).length;

        return { notesThisMonth: notes.length, booksWithNotes: uniqueBooks, questionsCount: questions };
    }, [notes]);

    const notesByBook = React.useMemo(() => {
        const groups: Record<string, Note[]> = {};
        sortedNotes.forEach((note) => {
            const title = note.bookTitle || "Sin título";
            if (!groups[title]) groups[title] = [];
            groups[title].push(note);
        });
        return groups;
    }, [sortedNotes]);

    const notesByType = React.useMemo(() => {
        const groups: Record<string, Note[]> = {};
        sortedNotes.forEach((note) => {
            const type = getNoteTypeGroup(note);
            if (!groups[type]) groups[type] = [];
            groups[type].push(note);
        });
        return groups;
    }, [sortedNotes]);

    const allTags = React.useMemo(() => {
        const tags = new Set<string>();
        notes.forEach((note) => note.tags?.forEach((tag) => tags.add(tag)));
        return Array.from(tags).sort((a, b) => a.localeCompare(b));
    }, [notes]);

    const clearFilters = () => {
        setSearchQuery("");
        setActiveType("all");
        setActiveTag("");
    };

    const handleEditNote = (note: Note) => {
        setEditingNote(note);
        setIsCreateModalOpen(true);
    };

    const handleCreateModalClose = () => {
        setIsCreateModalOpen(false);
        setEditingNote(undefined);
    };

    const handleDeleteNote = async () => {
        if (!noteToDelete) return;

        setIsDeleting(true);
        try {
            const { deleteNote } = await import("@/app/app/mi-lectura/actions");
            const result = await deleteNote(noteToDelete.id);

            if (result.error) {
                setFeedback(result.error);
                return;
            }

            setFeedback("Nota eliminada.");
            setNoteToDelete(null);
            await refreshData();
        } finally {
            setIsDeleting(false);
        }
    };

    const handleToggleHighlight = async (note: Note) => {
        const { setNoteHighlighted } = await import("@/app/app/mi-lectura/actions");
        const nextValue = !note.isHighlighted;
        const result = await setNoteHighlighted(note.id, nextValue);
        if (result.error) {
            setFeedback(result.error);
            return;
        }
        setFeedback(nextValue ? "Cita destacada." : "Cita sin destacar.");
        await refreshData();
    };

    const handleToggleResolved = async (note: Note) => {
        const { setQuestionResolved } = await import("@/app/app/mi-lectura/actions");
        const nextValue = !note.resolvedAt;
        const result = await setQuestionResolved(note.id, nextValue);
        if (result.error) {
            setFeedback(result.error);
            return;
        }
        setFeedback(nextValue ? "Pregunta marcada como resuelta." : "Pregunta marcada como pendiente.");
        await refreshData();
    };

    const hasActiveFilters = Boolean(searchQuery || activeType !== "all" || activeTag);
    const gridProps = {
        onEdit: handleEditNote,
        onDelete: setNoteToDelete,
        onToggleHighlight: handleToggleHighlight,
        onToggleResolved: handleToggleResolved,
        onTagClick: setActiveTag,
    };

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
                title="Notas"
                subtitle="Guarda lo que te mueve. Vuelve cuando quieras."
                className="mb-0 md:mb-2 [&_h1]:text-[1.65rem] [&_h1]:leading-tight [&_p]:text-sm"
                action={{
                    label: "Nueva nota",
                    onClick: () => {
                        setEditingNote(undefined);
                        setIsCreateModalOpen(true);
                    },
                }}
            />

            {feedback && (
                <div className="flex items-center justify-between gap-3 rounded-2xl border border-teal/10 bg-teal/5 px-4 py-3 text-sm font-medium text-teal">
                    <span>{feedback}</span>
                    <button type="button" onClick={() => setFeedback("")} className="text-teal/60 hover:text-coral" aria-label="Cerrar aviso">
                        <X className="h-4 w-4" />
                    </button>
                </div>
            )}

            <div className="rounded-2xl border border-teal/5 bg-white/90 p-4 shadow-sm">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_auto] md:items-center">
                    <SearchInput
                        placeholder="Buscar por nota, libro, autor o etiqueta..."
                        value={searchQuery}
                        onChange={(event) => setSearchQuery(event.target.value)}
                    />
                    <Select
                        options={[
                            { label: "Recientes", value: "recent" },
                            { label: "Por libro", value: "book" },
                            { label: "Por tipo", value: "type" },
                        ]}
                        value={sortOrder}
                        onChange={(event) => setSortOrder(event.target.value as SortOrder)}
                        containerClassName="w-44 max-w-full"
                        className="h-12 w-full rounded-2xl"
                    />
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                    {TYPE_FILTERS.map((filter) => (
                        <button
                            key={filter.id}
                            type="button"
                            onClick={() => setActiveType(filter.id)}
                            className={`rounded-full border px-3 py-2 text-xs font-bold transition-colors ${activeType === filter.id
                                ? "border-teal bg-teal text-white shadow-sm"
                                : "border-teal/10 bg-white text-grey/60 hover:text-teal"
                                }`}
                        >
                            {filter.label}
                        </button>
                    ))}
                    {activeTag && (
                        <button
                            type="button"
                            onClick={() => setActiveTag("")}
                            className="rounded-full border border-coral/15 bg-coral/5 px-3 py-2 text-xs font-bold text-coral"
                        >
                            #{activeTag} · quitar
                        </button>
                    )}
                    {hasActiveFilters && (
                        <button
                            type="button"
                            onClick={clearFilters}
                            className="rounded-full px-3 py-2 text-xs font-bold text-grey/50 transition-colors hover:text-teal"
                        >
                            Limpiar
                        </button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8">
                <main className="lg:col-span-8">
                    <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as ViewMode)}>
                        <TabsList className="mb-5 rounded-2xl border border-teal/5 bg-white p-1 shadow-sm">
                            <TabsTrigger value="recent" className="flex-1 rounded-xl py-3 text-center">Recientes</TabsTrigger>
                            <TabsTrigger value="book" className="flex-1 rounded-xl py-3 text-center">Libros</TabsTrigger>
                            <TabsTrigger value="type" className="flex-1 rounded-xl py-3 text-center">Tipos</TabsTrigger>
                            <TabsTrigger value="tags" className="flex-1 rounded-xl py-3 text-center">Etiquetas</TabsTrigger>
                        </TabsList>

                        <TabsContent value="recent">
                            {isLoading ? (
                                <div className="py-12 text-center text-grey/40">Cargando notas...</div>
                            ) : sortedNotes.length > 0 ? (
                                <NotesGrid notes={sortedNotes} {...gridProps} />
                            ) : (
                                <EmptyState
                                    title={hasActiveFilters ? "No hay notas con estos filtros" : "Tu diario está en blanco"}
                                    description={hasActiveFilters ? "Prueba a limpiar filtros o buscar otra palabra." : "Guarda una cita, una idea o una emoción mientras lees."}
                                    actionLabel={hasActiveFilters ? "Limpiar filtros" : "Crear mi primera nota"}
                                    onAction={hasActiveFilters ? clearFilters : () => setIsCreateModalOpen(true)}
                                />
                            )}
                        </TabsContent>

                        <TabsContent value="book">
                            {Object.keys(notesByBook).length > 0 ? (
                                <div className="space-y-8">
                                    {Object.entries(notesByBook).map(([bookTitle, bookNotes]) => (
                                        <section key={bookTitle}>
                                            <h3 className="mb-4 text-base font-bold text-teal-dark">
                                                {bookTitle} <span className="ml-1 text-sm text-grey/40">({bookNotes.length})</span>
                                            </h3>
                                            <NotesGrid notes={bookNotes} {...gridProps} />
                                        </section>
                                    ))}
                                </div>
                            ) : (
                                <EmptyState title="No hay notas registradas" description="Cuando crees notas aparecerán agrupadas por libro." />
                            )}
                        </TabsContent>

                        <TabsContent value="type">
                            {Object.keys(notesByType).length > 0 ? (
                                <div className="space-y-8">
                                    {Object.entries(notesByType).map(([type, typeNotes]) => (
                                        <section key={type}>
                                            <h3 className="mb-4 text-base font-bold text-teal-dark">
                                                {type} <span className="ml-1 text-sm text-grey/40">({typeNotes.length})</span>
                                            </h3>
                                            <NotesGrid notes={typeNotes} {...gridProps} />
                                        </section>
                                    ))}
                                </div>
                            ) : (
                                <EmptyState title="No hay notas de este tipo" description="Cambia el filtro o crea una nota nueva." />
                            )}
                        </TabsContent>

                        <TabsContent value="tags">
                            {allTags.length > 0 ? (
                                <div className="rounded-2xl border border-teal/5 bg-white p-4 shadow-sm">
                                    <div className="flex flex-wrap gap-2">
                                        {allTags.map((tag) => (
                                            <button
                                                key={tag}
                                                type="button"
                                                onClick={() => setActiveTag(tag)}
                                                className={`rounded-full border px-4 py-2 text-sm font-bold transition-colors ${activeTag === tag
                                                    ? "border-teal bg-teal text-white"
                                                    : "border-teal/10 bg-white text-teal-dark hover:border-teal/30"
                                                    }`}
                                            >
                                                #{tag}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <EmptyState title="No tienes etiquetas aún" description="Añade etiquetas al crear tus notas para encontrarlas mejor." />
                            )}
                        </TabsContent>
                    </Tabs>
                </main>

                <aside className="space-y-6 lg:col-span-4">
                    <Button
                        type="button"
                        onClick={() => {
                            setEditingNote(undefined);
                            setIsCreateModalOpen(true);
                        }}
                        className="hidden h-12 w-full items-center justify-center gap-2 lg:inline-flex"
                    >
                        <Plus className="h-4 w-4" />
                        Nueva nota
                    </Button>
                    <NotesStats
                        notesThisMonth={stats.notesThisMonth}
                        booksWithNotes={stats.booksWithNotes}
                        questionsCount={stats.questionsCount}
                    />
                </aside>
            </div>

            <CreateNoteModal
                isOpen={isCreateModalOpen}
                onClose={handleCreateModalClose}
                books={books}
                initialNote={editingNote}
                onSuccess={refreshData}
            />

            <Modal isOpen={Boolean(noteToDelete)} onClose={() => setNoteToDelete(null)} title="Eliminar nota" size="sm">
                <div className="space-y-5">
                    <p className="text-sm leading-relaxed text-grey/70">
                        Esta nota se eliminará de tu diario. Esta acción no se puede deshacer.
                    </p>
                    {noteToDelete && (
                        <div className="rounded-2xl border border-coral/10 bg-coral/5 p-4 text-sm text-grey-dark">
                            {noteToDelete.content}
                        </div>
                    )}
                    <div className="grid grid-cols-2 gap-3">
                        <Button type="button" variant="ghost" onClick={() => setNoteToDelete(null)} disabled={isDeleting}>
                            Cancelar
                        </Button>
                        <Button type="button" onClick={handleDeleteNote} disabled={isDeleting} className="bg-coral hover:bg-coral/90">
                            {isDeleting ? "Eliminando..." : "Eliminar"}
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
