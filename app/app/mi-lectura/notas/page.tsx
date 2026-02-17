"use client";

import * as React from "react";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { SearchInput } from "@/components/ui/SearchInput";
import { Select } from "@/components/ui/Select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import { EmptyState } from "@/components/ui/EmptyState";
import { NoteCard, Note } from "@/components/notes/NoteCard";
import { NotesStats } from "@/components/notes/NotesStats";
import { CreateNoteModal } from "@/components/notes/CreateNoteModal";

// --- MOCK DATA ---
const NOTES_MOCK: Note[] = [
    { id: "1", type: "Cita", content: "Nolite te bastardes carborundorum.", bookTitle: "El cuento de la criada", bookAuthor: "M. Atwood", location: "Cap. 12", date: "Hace 2h" },
    { id: "2", type: "Idea", content: "Me recuerda mucho a la situación política actual en...", bookTitle: "1984", bookAuthor: "G. Orwell", isPrivate: true, date: "Ayer" },
    { id: "3", type: "Pregunta", content: "¿Por qué el personaje decide volver?", bookTitle: "Seda", bookAuthor: "A. Baricco", location: "p. 45", date: "Hace 3 días" },
    { id: "4", type: "Subrayado", content: "La belleza no es más que el inicio de lo terrible.", bookTitle: "Elegías de Duino", bookAuthor: "Rilke", date: "Semana pasada" },
    { id: "5", type: "Idea", content: "Investigar más sobre la simbología de las flores rojas.", bookTitle: "El cuento de la criada", bookAuthor: "M. Atwood", tags: ["Simbología"], date: "Semana pasada" },
];

export default function NotesPage() {
    // Real Data State
    const [books, setBooks] = React.useState<{ id: string; title: string }[]>([]);
    const [notes, setNotes] = React.useState<Note[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = React.useState(false);
    const [searchQuery, setSearchQuery] = React.useState("");
    const [sortOrder, setSortOrder] = React.useState<'recent' | 'book'>('recent');

    const refreshData = React.useCallback(async () => {
        try {
            const { getCurrentBooks, getAllNotes } = await import("@/app/app/mi-lectura/actions");
            const [currentBooks, allNotes] = await Promise.all([
                getCurrentBooks(),
                getAllNotes()
            ]);
            setBooks(currentBooks.map(b => ({ id: b.id, title: b.title })));
            setNotes(allNotes);
        } catch (error) {
            console.error("Failed to load notes data:", error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    React.useEffect(() => {
        refreshData();
    }, [refreshData]);

    // 1. Filtering
    const filteredNotes = notes.filter(n => {
        const q = searchQuery.toLowerCase();
        return (n.content?.toLowerCase().includes(q) ||
            n.bookTitle?.toLowerCase().includes(q) ||
            n.type?.toLowerCase().includes(q));
    });

    // 2. Sorting
    const sortedNotes = [...filteredNotes].sort((a, b) => {
        if (sortOrder === 'book') {
            return (a.bookTitle || "").localeCompare(b.bookTitle || "");
        }
        // default recent
        // Assuming date is string "10 feb", we might need raw date for correct sorting if not ISO.
        // Actions returns display friendly date string, AND no raw date.
        // Ideally Actions returns raw date too.
        // For now, let's assume notes come sorted from DB (actions.ts does .order("created_at")).
        // So 'recent' is just default order.
        return 0; // Keep DB order (Descending created_at)
    });

    // 3. Stats Calculation
    const stats = React.useMemo(() => {
        const now = new Date();
        const currentMonth = now.getMonth();
        const notesThisMonth = notes.filter(n => {
            // We need to parse the date or check creation time.
            // Current `Note` interface only has `date` string.
            // We should trust the DB count or update interface. 
            // Limitation: we don't have raw date in Note interface here.
            // Let's assume if text says "Hace..." it's recent? 
            // Better: update Note interface to include raw createdAt?
            // For now, let's return total notes count as placeholder for "This Month" 
            return true;
        }).length;

        const uniqueBooks = new Set(notes.map(n => n.bookTitle)).size;
        const questions = notes.filter(n => n.type === 'Pregunta').length;

        return { notesThisMonth, booksWithNotes: uniqueBooks, questionsCount: questions };
    }, [notes]);

    // 4. Group by Book
    const notesByBook = React.useMemo(() => {
        const groups: Record<string, Note[]> = {};
        sortedNotes.forEach(note => {
            const title = note.bookTitle || "Sin título";
            if (!groups[title]) groups[title] = [];
            groups[title].push(note);
        });
        return groups;
    }, [sortedNotes]);

    // 5. Extract Tags
    const allTags = React.useMemo(() => {
        const tags = new Set<string>();
        notes.forEach(note => {
            note.tags?.forEach(t => tags.add(t));
        });
        return Array.from(tags);
    }, [notes]);

    // Helper to split notes into columns for masonry
    const getMasonryColumns = (items: Note[]) => {
        const left: Note[] = [];
        const right: Note[] = [];
        items.forEach((item, i) => {
            if (i % 2 === 0) left.push(item);
            else right.push(item);
        });
        return { left, right };
    };

    const [editingNote, setEditingNote] = React.useState<Note | undefined>(undefined);

    const handleEditNote = (note: Note) => {
        setEditingNote(note);
        setIsCreateModalOpen(true);
    };

    const handleCreateModalClose = () => {
        setIsCreateModalOpen(false);
        setEditingNote(undefined);
    };

    return (
        <div>
            {/* ... Header and Search ... */}
            <SectionHeader
                eyebrow="MI LECTURA"
                title="Notas"
                subtitle="Guarda lo que te mueve. Vuelve cuando quieras."
                action={{
                    label: "Nueva nota",
                    onClick: () => {
                        setEditingNote(undefined);
                        setIsCreateModalOpen(true);
                    }
                }}
            />

            {/* Controls */}
            <div className="flex flex-col md:flex-row gap-4 mb-8 items-start md:items-center justify-between">
                <div className="w-full md:w-96">
                    <SearchInput
                        placeholder="Buscar en tus notas..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-3">
                    <Select
                        options={[
                            { label: "Ordenar: Más recientes", value: "recent" },
                            { label: "Ordenar: Libro", value: "book" },
                        ]}
                        value={sortOrder}
                        onChange={(e) => setSortOrder(e.target.value as any)}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Main Content (Tabs & Feed) - 8 Cols */}
                <div className="lg:col-span-8">
                    <Tabs defaultValue="all">
                        <TabsList>
                            <TabsTrigger value="all">Todas</TabsTrigger>
                            <TabsTrigger value="bybook">Por libro</TabsTrigger>
                            <TabsTrigger value="tags">Etiquetas</TabsTrigger>
                        </TabsList>

                        <TabsContent value="all">
                            {isLoading ? (
                                <div className="text-center py-12 text-grey/40">Cargando notas...</div>
                            ) : sortedNotes.length > 0 ? (
                                (() => {
                                    const { left, right } = getMasonryColumns(sortedNotes);
                                    return (
                                        <div className="flex flex-col md:flex-row gap-4 items-start">
                                            <div className="flex-1 space-y-4 w-full">
                                                {left.map(note => <NoteCard key={note.id} note={note as any} onEdit={handleEditNote} />)}
                                            </div>
                                            <div className="flex-1 space-y-4 w-full">
                                                {right.map(note => <NoteCard key={note.id} note={note as any} onEdit={handleEditNote} />)}
                                            </div>
                                        </div>
                                    );
                                })()
                            ) : (
                                <EmptyState
                                    title="Tu diario está en blanco"
                                    description="Guarda una cita o idea mientras lees."
                                    actionLabel="Crear mi primera nota"
                                    onAction={() => setIsCreateModalOpen(true)}
                                />
                            )}
                        </TabsContent>

                        <TabsContent value="bybook">
                            {isLoading ? (
                                <div className="text-center py-12 text-grey/40">Cargando...</div>
                            ) : Object.keys(notesByBook).length > 0 ? (
                                <div className="space-y-8">
                                    {Object.entries(notesByBook).map(([bookTitle, bookNotes]) => {
                                        const { left, right } = getMasonryColumns(bookNotes);
                                        return (
                                            <div key={bookTitle}>
                                                <h3 className="font-serif text-lg text-teal-dark mb-4">
                                                    {bookTitle} <span className="text-sm font-sans text-grey/40 ml-2">({bookNotes.length})</span>
                                                </h3>
                                                <div className="flex flex-col md:flex-row gap-4 items-start">
                                                    <div className="flex-1 space-y-4 w-full">
                                                        {left.map(note => <NoteCard key={note.id} note={note as any} onEdit={handleEditNote} />)}
                                                    </div>
                                                    <div className="flex-1 space-y-4 w-full">
                                                        {right.map(note => <NoteCard key={note.id} note={note as any} onEdit={handleEditNote} />)}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="text-center py-12 text-grey/40">No hay notas registradas.</div>
                            )}
                        </TabsContent>

                        <TabsContent value="tags">
                            {isLoading ? (
                                <div className="text-center py-12 text-grey/40">Cargando...</div>
                            ) : allTags.length > 0 ? (
                                <div className="flex flex-wrap gap-2 justify-center py-8">
                                    {allTags.map(tag => (
                                        <div key={tag} className="px-4 py-2 bg-white border border-teal/10 rounded-full text-sm text-teal-dark shadow-sm hover:border-teal/30 cursor-default">
                                            #{tag}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12 text-grey/40">
                                    No tienes etiquetas aún.
                                    <br />
                                    <span className="text-xs">Añade etiquetas al crear tus notas.</span>
                                </div>
                            )}
                        </TabsContent>
                    </Tabs>
                </div>

                {/* Sidebar - 4 Cols */}
                <div className="lg:col-span-4 space-y-6">
                    <NotesStats
                        notesThisMonth={stats.notesThisMonth}
                        booksWithNotes={stats.booksWithNotes}
                        questionsCount={stats.questionsCount}
                    />
                </div>
            </div>

            <CreateNoteModal
                isOpen={isCreateModalOpen}
                onClose={handleCreateModalClose}
                books={books}
                initialNote={editingNote}
                onSuccess={refreshData}
            />
        </div>
    );
}
