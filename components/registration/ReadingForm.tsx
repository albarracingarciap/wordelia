import * as React from "react";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Select } from "../ui/Select";
import { Rating } from "../ui/Rating";
import { Chip } from "../ui/Chip";
import { BookCard } from "../ui/BookCard";

interface ReadingFormProps {
    books: { id: string; title: string; author: string; coverUrl: string; progress: any }[]; // Added books prop
    initialBookId?: string;
    initialDuration?: number;
    onCancel: () => void;
    onSuccess: () => void;
    isModal?: boolean;
}

export function ReadingForm({ books, initialBookId, initialDuration, onCancel, onSuccess, isModal = false }: ReadingFormProps) {
    const [selectedBookId, setSelectedBookId] = React.useState(initialBookId || (books.length > 0 ? books[0].id : ""));
    const [progressValue, setProgressValue] = React.useState("");
    const [durationValue, setDurationValue] = React.useState(initialDuration !== undefined ? initialDuration.toString() : ""); // Duration state
    const [note, setNote] = React.useState("");
    const [isFinished, setIsFinished] = React.useState(false);
    const [rating, setRating] = React.useState(0);

    // Sync duration state when initialDuration prop changes
    React.useEffect(() => {
        if (initialDuration !== undefined) {
            setDurationValue(initialDuration.toString());
        } else {
            setDurationValue(""); // Reset if undefined (manual mode)
        }
    }, [initialDuration]);

    const selectedBook = books.find(b => b.id === selectedBookId);

    const handleChipClick = (text: string) => {
        setNote(prev => prev ? `${prev} ${text}` : text);
    };

    const [isSubmitting, setIsSubmitting] = React.useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            // Parse inputs
            const duration = durationValue ? parseInt(durationValue) : 0;
            const pages = progressValue ? parseInt(progressValue) : null;

            // If we have a note, we should save it too!
            // But logReadingSession doesn't take notes.
            // We should probably call saveNote if there is a note.
            // Let's import saveNote as well.

            const { logReadingSession, saveNote } = await import("@/app/app/mi-lectura/actions");

            const result = await logReadingSession(
                selectedBookId,
                duration,
                pages,
                isFinished,
                rating > 0 ? rating : undefined
            );

            if (result.error) {
                alert("Error: " + result.error);
                return;
            }

            if (note.trim()) {
                await saveNote(
                    selectedBookId,
                    note,
                    "Sesión", // Tag as session note
                    progressValue ? `Pág ${progressValue}` : undefined
                );
            }

            onSuccess();
        } catch (error) {
            console.error(error);
            alert("Error al guardar la sesión.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* 1. Select Book */}
            <div className={`space-y-4 ${isModal ? "mb-4" : "mb-8"}`}>
                <div className="flex flex-col gap-2">
                    <label className="block text-xs font-bold text-grey/60 uppercase tracking-widest">
                        ¿Qué libro has leído?
                    </label>
                    <Select
                        options={[
                            ...books.map(b => ({ label: b.title, value: b.id })),
                            { label: "+ Buscar otro libro...", value: "search" }
                        ]}
                        value={selectedBookId}
                        onChange={(e) => setSelectedBookId(e.target.value)}
                        className="w-full"
                    />
                </div>

                {selectedBook && (
                    <div className="bg-white border border-teal/10 rounded-xl p-3 flex gap-3 items-center">
                        <img src={selectedBook.coverUrl} alt="" className="w-10 h-14 object-cover rounded shadow-sm" />
                        <div>
                            <p className="font-serif text-teal text-sm leading-tight">{selectedBook.title}</p>
                            <p className="text-xs text-coral mt-0.5">{selectedBook.author}</p>
                            <p className="text-[10px] text-grey/60 mt-1">
                                Actual: <span className="font-medium">{selectedBook.progress.label}</span>
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* 2. Progress & Time */}
            <div className="grid grid-cols-2 gap-4">
                <Input
                    label="Tu progreso de hoy"
                    type="number"
                    placeholder={selectedBook?.progress.unit === "PAGES" ? "+ Páginas" : "+ Capítulos"}
                    value={progressValue}
                    onChange={(e) => setProgressValue(e.target.value)}
                    helperText="Lo que has avanzado."
                    autoFocus={!isModal && !initialDuration}
                />
                <Input
                    label="Tiempo (min)"
                    type="number"
                    placeholder="Minutos"
                    value={durationValue}
                    onChange={(e) => setDurationValue(e.target.value)}
                    helperText={initialDuration ? "Cronometrado automáticamente." : "Estimado."}
                />
            </div>

            {/* 3. Session Status (Finished?) */}
            <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer group">
                    <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${isFinished ? "bg-teal border-teal" : "border-grey/30 bg-white"}`}>
                        {isFinished && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4"><polyline points="20 6 9 17 4 12" /></svg>}
                    </div>
                    <input type="checkbox" className="hidden" checked={isFinished} onChange={(e) => setIsFinished(e.target.checked)} />
                    <span className={`text-sm ${isFinished ? "text-teal font-medium" : "text-grey group-hover:text-teal/80"}`}>He terminado este libro</span>
                </label>
            </div>

            {/* FINISHED BLOCK */}
            {isFinished && (
                <div className="bg-cream/20 p-4 rounded-xl space-y-4 border border-teal/5 animate-fade-in">
                    <div>
                        <label className="block text-xs font-bold text-grey/60 uppercase tracking-widest mb-2">¿Qué nota le pones?</label>
                        <Rating value={rating} onChange={setRating} />
                    </div>
                </div>
            )}

            {/* 4. Note */}
            <div>
                <label className="block text-xs font-bold text-grey/60 uppercase tracking-widest mb-2">Nota rápida (Opcional)</label>
                <textarea
                    rows={isModal ? 2 : 3}
                    placeholder="¿Qué te movió hoy? Una idea, una cita..."
                    className="w-full bg-cream/30 border border-teal/10 rounded-xl px-4 py-3 text-teal-dark placeholder:text-grey/30 text-sm focus:outline-none focus:border-teal/30 focus:bg-white focus:ring-2 focus:ring-teal/5 transition-all resize-none mb-3"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                />
                <div className="flex flex-wrap gap-2">
                    {["💡 Idea", "❓ Pregunta", "✨ Cita", "🧩 Personaje"].map(tag => (
                        <button
                            key={tag}
                            type="button"
                            onClick={() => handleChipClick(tag)}
                            className="text-[10px] px-2 py-1 bg-white border border-teal/5 rounded-full text-grey/60 hover:text-teal hover:border-teal/20 transition-colors"
                        >
                            {tag}
                        </button>
                    ))}
                </div>
            </div>

            {/* Actions */}
            <div className={`flex items-center ${isModal ? "justify-end gap-3 mt-8" : "gap-4 mt-8 flex-col-reverse sm:flex-row"}`}>
                <Button type="button" variant="ghost" onClick={onCancel} className={isModal ? "" : "w-full sm:w-auto"}>Cancelar</Button>
                <Button type="submit" fullWidth={!isModal} disabled={(!progressValue && !isFinished) || isSubmitting}>
                    {isSubmitting ? "Guardando..." : (isFinished ? "Guardar y terminar" : "Guardar sesión")}
                </Button>
            </div>

            {!isModal && (
                <p className="text-center text-[10px] text-grey/40">Sin rachas obligatorias. Solo tu lectura.</p>
            )}
        </form>
    );
}
