import * as React from "react";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { Select } from "../ui/Select";
import { Input } from "../ui/Input";

interface CreateNoteModalProps {
    isOpen: boolean;
    onClose: () => void;
    books: { id: string; title: string }[];
    initialBookId?: string;
    initialNote?: any; // Note to edit
    onSuccess?: () => void;
}

const NOTE_TYPES = ["Cita", "Idea", "Pregunta", "Subrayado"];

export function CreateNoteModal({ isOpen, onClose, books, initialBookId, initialNote, onSuccess }: CreateNoteModalProps) {
    const [bookId, setBookId] = React.useState(initialBookId || (books?.[0]?.id));
    const [type, setType] = React.useState("Idea");
    const [content, setContent] = React.useState("");

    const [location, setLocation] = React.useState("");
    const [tags, setTags] = React.useState("");
    const [isSubmitting, setIsSubmitting] = React.useState(false);

    React.useEffect(() => {
        if (isOpen) {
            if (initialNote) {
                // Edit Mode
                setBookId(initialNote.bookId || initialBookId || books?.[0]?.id);
                setType(initialNote.type || "Idea");
                setContent(initialNote.content || "");
                // Parse location from format "p. 120" if possible, or just use raw if we had it. 
                // But simplified: extract number if starts with p.
                const loc = initialNote.location?.replace(/^p\.\s*/, "") || "";
                setLocation(loc);
                setTags(initialNote.tags?.join(", ") || "");
            } else {
                // Create Mode
                if (initialBookId) setBookId(initialBookId);
                else if (!bookId && books.length > 0) setBookId(books[0].id);

                // Reset fields if switching from edit to create
                if (!initialNote) {
                    setContent("");
                    setLocation("");
                    setTags("");
                    setType("Idea");
                }
            }
        }
    }, [isOpen, initialBookId, books, initialNote]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const { saveNote, updateNote } = await import("@/app/app/mi-lectura/actions");

            // Append tags to content if any
            let finalContent = content;
            if (tags.trim()) {
                finalContent += `\n\nTags: ${tags}`;
            }

            let result;
            if (initialNote) {
                result = await updateNote(
                    initialNote.id,
                    bookId,
                    finalContent,
                    type,
                    location
                );
            } else {
                result = await saveNote(
                    bookId,
                    finalContent,
                    type,
                    location
                );
            }

            if (result.error) {
                alert("Error: " + result.error);
                return;
            }

            onClose();
            // Reset form
            setContent("");
            setLocation("");
            setTags("");
            if (onSuccess) onSuccess();
        } catch (error) {
            console.error(error);
            alert("Error al guardar la nota.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={initialNote ? "Editar nota" : "Nueva nota"}>
            <form onSubmit={handleSubmit}>
                {/* 1. Book Select */}
                <div className="mb-4">
                    <label className="block text-xs font-bold text-grey/60 uppercase tracking-widest mb-2">Libro</label>
                    <Select
                        options={books.map(b => ({ label: b.title, value: b.id }))}
                        className="w-full"
                        value={bookId}
                        onChange={(e) => setBookId(e.target.value)}
                    />
                </div>

                {/* 2. Type Tabs */}
                <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
                    {NOTE_TYPES.map(t => (
                        <button
                            key={t}
                            type="button"
                            onClick={() => setType(t)}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${type === t ? "bg-teal text-white border-teal shadow-sm" : "bg-white text-grey border-teal/10 hover:border-teal/30"
                                }`}
                        >
                            {t}
                        </button>
                    ))}
                </div>

                {/* 3. Textarea */}
                <div className="mb-2">
                    <textarea
                        rows={5}
                        className="w-full bg-cream/30 border border-teal/10 rounded-xl px-4 py-3 text-teal-dark placeholder:text-grey/30 text-sm focus:outline-none focus:border-teal/30 focus:bg-white focus:ring-2 focus:ring-teal/5 transition-all resize-none"
                        placeholder={type === "Cita" ? "Pega aquí una cita corta..." : "¿Qué te movió?"}
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        autoFocus
                    />
                    {type === "Cita" && (
                        <p className="text-[10px] text-grey/40 mt-1.5 text-right">Si es una cita, mejor corta.</p>
                    )}
                </div>

                {/* 4. Location & Tags (SimplifiedRow) */}
                <div className="flex gap-4 mb-6">
                    <Input
                        placeholder="Pág/Cap"
                        className="flex-1"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                    />
                    <Input
                        placeholder="Etiquetas..."
                        className="flex-[2]"
                        value={tags}
                        onChange={(e) => setTags(e.target.value)}
                    />
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3">
                    <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>Cancelar</Button>
                    <Button type="submit" disabled={!content.trim() || isSubmitting}>
                        {isSubmitting ? "Guardando..." : (initialNote ? "Actualizar nota" : "Guardar nota")}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
