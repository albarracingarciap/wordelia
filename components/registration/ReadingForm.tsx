import * as React from "react";
import Image from "next/image";
import { AlertCircle, BookOpen, HeartPulse, Lightbulb, MessageCircleQuestion, Puzzle, Quote } from "lucide-react";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Select } from "../ui/Select";
import { Rating } from "../ui/Rating";

export interface ReadingFormBook {
    id: string;
    title: string;
    author: string;
    coverUrl: string | null;
    progress: {
        label: string;
        unit?: "PAGES" | "CHAPTERS" | string;
    };
}

interface ReadingFormProps {
    books: ReadingFormBook[];
    initialBookId?: string;
    initialDuration?: number;
    onCancel: () => void;
    onSuccess: () => void;
    isModal?: boolean;
}

const NOTE_CHIPS = [
    { label: "Idea", icon: Lightbulb },
    { label: "Pregunta", icon: MessageCircleQuestion },
    { label: "Cita", icon: Quote },
    { label: "Personaje", icon: Puzzle },
];

const EMOTION_OPTIONS = [
    { id: "asombro", label: "Asombro" },
    { id: "tristeza", label: "Tristeza" },
    { id: "enojo", label: "Enojo" },
    { id: "miedo", label: "Miedo" },
    { id: "alegria", label: "Alegria" },
    { id: "disgusto", label: "Disgusto" },
    { id: "empatia", label: "Empatia" },
    { id: "confusion", label: "Confusion" },
    { id: "esperanza", label: "Esperanza" },
];

export function ReadingForm({ books, initialBookId, initialDuration, onCancel, onSuccess, isModal = false }: ReadingFormProps) {
    const [selectedBookId, setSelectedBookId] = React.useState(initialBookId || (books.length > 0 ? books[0].id : ""));
    const [progressValue, setProgressValue] = React.useState("");
    const [durationValue, setDurationValue] = React.useState(initialDuration !== undefined ? initialDuration.toString() : "");
    const [note, setNote] = React.useState("");
    const [isFinished, setIsFinished] = React.useState(false);
    const [rating, setRating] = React.useState(0);
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const [formError, setFormError] = React.useState("");
    const [attachEmotion, setAttachEmotion] = React.useState(false);
    const [sessionEmotion, setSessionEmotion] = React.useState("asombro");
    const [emotionIntensity, setEmotionIntensity] = React.useState(3);
    const [emotionNote, setEmotionNote] = React.useState("");

    React.useEffect(() => {
        setDurationValue(initialDuration !== undefined ? initialDuration.toString() : "");
    }, [initialDuration]);

    const selectedBook = books.find((book) => book.id === selectedBookId);
    const actionsClass = isModal
        ? "sticky bottom-0 z-10 -mx-5 grid grid-cols-2 gap-3 border-t border-teal/5 bg-white/95 px-5 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-4 backdrop-blur sm:static sm:mx-0 sm:flex sm:justify-end sm:border-t-0 sm:bg-transparent sm:p-0 sm:pt-2 sm:backdrop-blur-none"
        : "flex flex-col gap-3 pt-2 sm:flex-row sm:justify-end";

    const handleChipClick = (text: string) => {
        setNote((prev) => (prev ? `${prev} ${text}` : text));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError("");

        if (!selectedBookId || selectedBookId === "search") {
            setFormError("Selecciona un libro para registrar la sesión.");
            return;
        }

        if (!progressValue && !isFinished) {
            setFormError("Indica tu avance de hoy o marca el libro como terminado.");
            return;
        }

        setIsSubmitting(true);

        try {
            const duration = durationValue ? parseInt(durationValue, 10) : 0;
            const pages = progressValue ? parseInt(progressValue, 10) : null;
            const { logReadingSession, saveNote, saveUserBookEmotion } = await import("@/app/app/mi-lectura/actions");

            const result = await logReadingSession(
                selectedBookId,
                duration,
                pages,
                isFinished,
                rating > 0 ? rating : undefined
            );

            if (result.error) {
                setFormError(result.error);
                return;
            }

            if (attachEmotion) {
                const emotionResult = await saveUserBookEmotion(
                    selectedBookId,
                    sessionEmotion,
                    emotionIntensity,
                    emotionNote,
                    result.sessionId || null
                );

                if (emotionResult.error) {
                    setFormError(`La sesión se guardó, pero no pudimos guardar la emoción: ${emotionResult.error}`);
                    return;
                }
            }

            if (note.trim()) {
                await saveNote(
                    selectedBookId,
                    note,
                    "Sesión",
                    progressValue ? `Pág ${progressValue}` : undefined
                );
            }

            onSuccess();
        } catch (error) {
            console.error(error);
            setFormError("No hemos podido guardar la sesión. Inténtalo de nuevo.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className={`space-y-3 ${isModal ? "mb-1" : "mb-8"}`}>
                <div className="flex flex-col gap-2">
                    <label className="block text-xs font-bold uppercase tracking-widest text-grey/60">
                        ¿Qué libro has leído?
                    </label>
                    <Select
                        options={[
                            ...books.map((book) => ({ label: book.title, value: book.id })),
                            { label: "+ Buscar otro libro...", value: "search" },
                        ]}
                        value={selectedBookId}
                        onChange={(e) => setSelectedBookId(e.target.value)}
                        className="h-12 w-full rounded-2xl px-5 text-base"
                    />
                </div>

                {selectedBook && (
                    <div className="flex items-center gap-3 rounded-2xl border border-teal/10 bg-cream/20 p-3">
                        <div className="relative flex h-16 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white text-teal/40 shadow-sm">
                            {selectedBook.coverUrl ? (
                                <Image src={selectedBook.coverUrl} alt="" fill className="object-cover" sizes="48px" />
                            ) : (
                                <BookOpen size={20} />
                            )}
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="truncate text-base font-bold leading-tight text-teal">{selectedBook.title}</p>
                            <p className="mt-0.5 truncate text-sm text-coral">{selectedBook.author}</p>
                            <p className="mt-1 text-xs text-grey/60">
                                Actual: <span className="font-medium">{selectedBook.progress.label}</span>
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setIsFinished((current) => !current)}
                            className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-bold transition-all ${isFinished ? "bg-teal text-white shadow-sm" : "bg-white text-grey/60 ring-1 ring-teal/10 hover:text-teal"}`}
                            aria-pressed={isFinished}
                        >
                            {isFinished ? "Completado" : "Terminado"}
                        </button>
                    </div>
                )}
            </div>

            {formError && (
                <div className="flex items-start gap-3 rounded-2xl border border-coral/20 bg-coral/10 px-4 py-3 text-sm font-medium text-coral">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    <p>{formError}</p>
                </div>
            )}

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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

            {isFinished && (
                <div className="animate-fade-in space-y-4 rounded-2xl border border-teal/5 bg-cream/20 p-4">
                    <div>
                        <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-grey/60">¿Qué nota le pones?</label>
                        <Rating value={rating} onChange={setRating} />
                    </div>
                </div>
            )}

            <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-grey/60">Nota rápida (opcional)</label>
                <div className="mb-3 flex flex-wrap gap-2">
                    {NOTE_CHIPS.map(({ label, icon: Icon }) => (
                        <button
                            key={label}
                            type="button"
                            onClick={() => handleChipClick(label)}
                            className="inline-flex items-center gap-1.5 rounded-full border border-teal/5 bg-white px-3 py-2 text-xs text-grey/60 transition-colors hover:border-teal/20 hover:text-teal"
                        >
                            <Icon className="h-3.5 w-3.5" />
                            {label}
                        </button>
                    ))}
                </div>
                <textarea
                    rows={isModal ? 2 : 4}
                    placeholder="¿Qué te movió hoy? Una idea, una cita..."
                    className="w-full resize-none rounded-2xl border border-teal/10 bg-cream/30 px-4 py-3 text-sm text-teal-dark transition-all placeholder:text-grey/30 focus:border-teal/30 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal/5"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                />
            </div>

            <div className="rounded-2xl border border-teal/10 bg-teal/[0.03] p-3">
                <button
                    type="button"
                    onClick={() => setAttachEmotion((current) => !current)}
                    className="flex w-full items-center justify-between gap-3 text-left"
                    aria-expanded={attachEmotion}
                >
                    <span className="flex min-w-0 items-center gap-3">
                        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${attachEmotion ? "bg-teal text-white" : "bg-white text-teal ring-1 ring-teal/10"}`}>
                            <HeartPulse className="h-5 w-5" />
                        </span>
                        <span className="min-w-0">
                            <span className="block text-sm font-bold text-teal-dark">Pulso de la sesión</span>
                            <span className="block text-xs text-grey/55">Guarda cómo te ha dejado esta lectura.</span>
                        </span>
                    </span>
                    <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${attachEmotion ? "bg-teal/10 text-teal" : "bg-white text-grey/50 ring-1 ring-grey/10"}`}>
                        {attachEmotion ? "Activo" : "Opcional"}
                    </span>
                </button>

                {attachEmotion && (
                    <div className="mt-4 space-y-4">
                        <div className="grid grid-cols-3 gap-2">
                            {EMOTION_OPTIONS.map((emotion) => {
                                const selected = sessionEmotion === emotion.id;
                                return (
                                    <button
                                        key={emotion.id}
                                        type="button"
                                        onClick={() => setSessionEmotion(emotion.id)}
                                        className={`min-h-11 rounded-2xl border px-2 text-xs font-bold transition ${selected
                                            ? "border-teal bg-teal text-white shadow-sm"
                                            : "border-grey/10 bg-white text-grey/60 hover:border-teal/20 hover:text-teal"
                                            }`}
                                    >
                                        {emotion.label}
                                    </button>
                                );
                            })}
                        </div>

                        <div>
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-bold uppercase tracking-widest text-grey/60">Intensidad</label>
                                <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-teal ring-1 ring-teal/10">
                                    {emotionIntensity}/5
                                </span>
                            </div>
                            <input
                                type="range"
                                min={1}
                                max={5}
                                value={emotionIntensity}
                                onChange={(event) => setEmotionIntensity(Number(event.target.value))}
                                className="mt-2 w-full accent-teal"
                            />
                            <div className="mt-1 flex justify-between text-[11px] text-grey/45">
                                <span>Leve</span>
                                <span>Moderada</span>
                                <span>Intensa</span>
                            </div>
                        </div>

                        <textarea
                            rows={2}
                            placeholder="Nota emocional opcional..."
                            className="w-full resize-none rounded-2xl border border-teal/10 bg-white px-4 py-3 text-sm text-teal-dark transition-all placeholder:text-grey/30 focus:border-teal/30 focus:outline-none focus:ring-2 focus:ring-teal/5"
                            value={emotionNote}
                            onChange={(event) => setEmotionNote(event.target.value)}
                        />
                    </div>
                )}
            </div>

            <div className={actionsClass}>
                <Button type="button" variant="ghost" onClick={onCancel} className="h-12 px-4 text-base sm:px-8" disabled={isSubmitting}>
                    Cancelar
                </Button>
                <Button type="submit" className="h-12 px-4 text-base sm:min-w-48 sm:px-8" disabled={(!progressValue && !isFinished) || isSubmitting}>
                    {isSubmitting ? "Guardando..." : (isFinished ? "Terminar" : "Guardar")}
                </Button>
            </div>

            {!isModal && (
                <p className="text-center text-[10px] text-grey/40">Sin rachas obligatorias. Solo tu lectura.</p>
            )}
        </form>
    );
}
