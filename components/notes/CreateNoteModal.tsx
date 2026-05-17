import * as React from "react";
import { AlertCircle, Lightbulb, MessageCircleQuestion, Puzzle, Quote, X } from "lucide-react";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { Select } from "../ui/Select";
import { Input } from "../ui/Input";

interface NoteDraft {
    id?: string;
    bookId?: string;
    type?: string;
    content?: string;
    location?: string;
    tags?: string[];
}

interface CreateNoteModalProps {
    isOpen: boolean;
    onClose: () => void;
    books: { id: string; title: string }[];
    initialBookId?: string;
    initialNote?: NoteDraft;
    onSuccess?: () => void;
}

const NOTE_TYPES = [
    { label: "Idea", icon: Lightbulb },
    { label: "Pregunta", icon: MessageCircleQuestion },
    { label: "Cita", icon: Quote },
    { label: "Personaje", icon: Puzzle },
];

export function CreateNoteModal({ isOpen, onClose, books, initialBookId, initialNote, onSuccess }: CreateNoteModalProps) {
    const [bookId, setBookId] = React.useState(initialBookId || books?.[0]?.id || "");
    const [type, setType] = React.useState("Nota");
    const [content, setContent] = React.useState("");
    const [location, setLocation] = React.useState("");
    const [tagInput, setTagInput] = React.useState("");
    const [tags, setTags] = React.useState<string[]>([]);
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const [formError, setFormError] = React.useState("");

    React.useEffect(() => {
        if (!isOpen) return;

        if (initialNote) {
            setBookId(initialNote.bookId || initialBookId || books?.[0]?.id || "");
            setType(initialNote.type || "Nota");
            setContent(initialNote.content || "");
            setLocation(initialNote.location?.replace(/^p\.\s*/, "") || "");
            setTags(initialNote.tags || []);
            setTagInput("");
            setFormError("");
            return;
        }

        setBookId(initialBookId || books?.[0]?.id || "");
        setType("Nota");
        setContent("");
        setLocation("");
        setTags([]);
        setTagInput("");
        setFormError("");
    }, [books, initialBookId, initialNote, isOpen]);

    const handleTypeChipClick = (label: string) => {
        setType(label);
        setContent((current) => (current ? `${current} ${label}` : label));
    };

    const normalizeTag = (value: string) => value.trim().replace(/^#/, "");

    const addTag = (value: string) => {
        const nextTag = normalizeTag(value);
        if (!nextTag) return;

        setTags((currentTags) => {
            const exists = currentTags.some((tag) => tag.toLowerCase() === nextTag.toLowerCase());
            return exists ? currentTags : [...currentTags, nextTag];
        });
        setTagInput("");
    };

    const handleTagKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key !== "Enter") return;

        event.preventDefault();
        addTag(tagInput);
    };

    const removeTag = (tagToRemove: string) => {
        setTags((currentTags) => currentTags.filter((tag) => tag !== tagToRemove));
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setFormError("");

        if (!bookId) {
            setFormError("Selecciona un libro para guardar la nota.");
            return;
        }

        if (!content.trim()) {
            setFormError("Escribe una nota antes de guardarla.");
            return;
        }

        const pendingTag = normalizeTag(tagInput);
        const finalTags = pendingTag && !tags.some((tag) => tag.toLowerCase() === pendingTag.toLowerCase())
            ? [...tags, pendingTag]
            : tags;

        setIsSubmitting(true);

        try {
            const { saveNote, updateNote } = await import("@/app/app/mi-lectura/actions");
            let finalContent = content.trim();

            if (finalTags.length > 0) {
                finalContent += `\n\nTags: ${finalTags.join(", ")}`;
            }

            const result = initialNote?.id
                ? await updateNote(initialNote.id, bookId, finalContent, type, location)
                : await saveNote(bookId, finalContent, type, location);

            if (result.error) {
                setFormError(result.error);
                return;
            }

            onClose();
            setContent("");
            setLocation("");
            setTags([]);
            setTagInput("");
            onSuccess?.();
        } catch (error) {
            console.error(error);
            setFormError("No hemos podido guardar la nota. Inténtalo de nuevo.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const submitLabel = initialNote ? "Actualizar" : "Guardar";

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={initialNote ? "Editar nota" : "Nueva nota"}
            className="max-h-[92dvh] overflow-y-auto overscroll-contain sm:max-h-[calc(100dvh-2rem)]"
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-3">
                    <label className="block text-xs font-bold uppercase tracking-widest text-grey/60">Libro</label>
                    <Select
                        options={books.map((book) => ({ label: book.title, value: book.id }))}
                        className="h-12 w-full rounded-2xl px-5 text-base"
                        value={bookId}
                        onChange={(event) => setBookId(event.target.value)}
                    />
                </div>

                <div className="flex flex-wrap gap-2">
                    {NOTE_TYPES.map(({ label, icon: Icon }) => (
                        <button
                            key={label}
                            type="button"
                            onClick={() => handleTypeChipClick(label)}
                            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-2 text-xs font-bold transition-colors ${type === label
                                ? "border-teal bg-teal text-white"
                                : "border-teal/5 bg-white text-grey/60 hover:border-teal/20 hover:text-teal"
                                }`}
                        >
                            <Icon className="h-3.5 w-3.5" />
                            {label}
                        </button>
                    ))}
                </div>

                {formError && (
                    <div className="flex items-start gap-3 rounded-2xl border border-coral/20 bg-coral/10 px-4 py-3 text-sm font-medium text-coral">
                        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                        <p>{formError}</p>
                    </div>
                )}

                <textarea
                    rows={4}
                    className="w-full resize-none rounded-2xl border border-teal/10 bg-cream/30 px-4 py-3 text-base text-teal-dark transition-all placeholder:text-grey/30 focus:border-teal/30 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal/5"
                    placeholder="¿Qué te movió?"
                    value={content}
                    onChange={(event) => setContent(event.target.value)}
                    autoFocus
                />

                {type === "Cita" && (
                    <p className="-mt-3 text-right text-[10px] text-grey/40">Si es una cita, mejor corta.</p>
                )}

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <Input
                        placeholder="Pág/Cap"
                        value={location}
                        onChange={(event) => setLocation(event.target.value)}
                    />
                    <div className="space-y-2">
                        <Input
                            placeholder="Etiqueta y Enter..."
                            value={tagInput}
                            onChange={(event) => setTagInput(event.target.value)}
                            onKeyDown={handleTagKeyDown}
                        />
                        {tags.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {tags.map((tag) => (
                                    <span
                                        key={tag}
                                        className="inline-flex items-center gap-1.5 rounded-full border border-teal/10 bg-teal/5 px-3 py-1.5 text-xs font-medium text-teal"
                                    >
                                        #{tag}
                                        <button
                                            type="button"
                                            onClick={() => removeTag(tag)}
                                            className="rounded-full text-teal/60 transition-colors hover:text-coral"
                                            aria-label={`Eliminar etiqueta ${tag}`}
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="sticky bottom-0 z-10 -mx-5 grid grid-cols-2 gap-3 border-t border-teal/5 bg-white/95 px-5 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-4 backdrop-blur sm:static sm:mx-0 sm:flex sm:justify-end sm:border-t-0 sm:bg-transparent sm:p-0 sm:pt-2 sm:backdrop-blur-none">
                    <Button type="button" variant="ghost" onClick={onClose} className="h-12 px-4 text-base sm:px-8" disabled={isSubmitting}>
                        Cancelar
                    </Button>
                    <Button type="submit" className="h-12 px-4 text-base sm:min-w-44 sm:px-8" disabled={!content.trim() || isSubmitting}>
                        {isSubmitting ? "Guardando..." : submitLabel}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
