"use client";

import * as React from "react";
import { CheckCircle2, HeartPulse, Loader2, Minus, NotebookPen, Plus, X } from "lucide-react";
import type { CurrentBook } from "@/app/app/mi-lectura/actions";
import { logReadingSession, saveNote, saveUserBookEmotion } from "@/app/app/mi-lectura/actions";
import { EMOTION_OPTIONS, NOTE_CHIPS } from "@/components/registration/ReadingForm";
import { Rating } from "@/components/ui/Rating";
import { toast } from "@/components/ui/toast";

// Registro rápido de una sesión de lectura (shell móvil /m).
// Un solo campo de progreso adaptado al formato + minutos opcionales +
// "Lo he terminado". La nota y la emoción se ofrecen DESPUÉS de guardar.

type Stage = "form" | "done" | "note" | "emotion";

interface QuickLogSheetProps {
    book: CurrentBook;
    /** Minutos prefijados (al venir del cronómetro). */
    initialMinutes?: number;
    onClose: () => void;
    /** Se llama en cuanto la sesión se guarda (para refrescar los datos de fondo). */
    onSaved: () => void;
}

function toInt(value: string): number | null {
    if (!value.trim()) return null;
    const n = parseInt(value, 10);
    return Number.isFinite(n) ? n : null;
}

export function QuickLogSheet({ book, initialMinutes, onClose, onSaved }: QuickLogSheetProps) {
    const fmt = book.format ?? "paper";
    const isAudio = fmt === "audio";
    const prog = book.progress;
    const pageCount = prog.unit === "PAGES" ? (prog.total ?? null) : null;
    const storedPage = prog.unit === "PAGES" ? (prog.current ?? 0) : 0;
    const isPercent = fmt === "ebook" && !pageCount;
    const storedPercent = Math.round(prog.percent ?? 0);

    const initialProgress = isAudio
        ? (initialMinutes ? String(initialMinutes) : "")
        : isPercent
            ? String(storedPercent)
            : (storedPage > 0 ? String(storedPage) : "");

    const [stage, setStage] = React.useState<Stage>("form");
    const [progressValue, setProgressValue] = React.useState(initialProgress);
    const [minutesValue, setMinutesValue] = React.useState(!isAudio && initialMinutes ? String(initialMinutes) : "");
    const [isFinished, setIsFinished] = React.useState(false);
    const [rating, setRating] = React.useState(0);
    const [submitting, setSubmitting] = React.useState(false);
    const [error, setError] = React.useState("");
    const [sessionId, setSessionId] = React.useState<string | null>(null);
    const [savedExtras, setSavedExtras] = React.useState<{ note: boolean; emotion: boolean }>({ note: false, emotion: false });

    // Nota
    const [noteType, setNoteType] = React.useState<string>("Idea");
    const [noteText, setNoteText] = React.useState("");
    // Emoción
    const [emotion, setEmotion] = React.useState<string>(EMOTION_OPTIONS[0].id);
    const [intensity, setIntensity] = React.useState(3);
    const [emotionNote, setEmotionNote] = React.useState("");

    // Bloquear el scroll del fondo mientras el panel está abierto.
    React.useEffect(() => {
        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => { document.body.style.overflow = prev; };
    }, []);

    const progressLabel = isAudio ? "Minutos escuchados" : isPercent ? "Voy por el" : "Voy por la página";
    const step = isAudio ? 5 : 1;
    const maxValue = isAudio ? null : isPercent ? 100 : pageCount;

    const bump = (delta: number) => {
        setError("");
        const current = toInt(progressValue) ?? (isAudio ? 0 : isPercent ? storedPercent : storedPage);
        let next = Math.max(0, current + delta);
        if (maxValue != null) next = Math.min(maxValue, next);
        setProgressValue(String(next));
    };

    // Ubicación para la nota: página o porcentaje alcanzado en esta sesión.
    const noteLocation = (): string | undefined => {
        const v = toInt(progressValue);
        if (isAudio || v == null) return undefined;
        return isPercent ? `${v}%` : String(v);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (submitting) return;
        setError("");

        const value = toInt(progressValue);
        const minutes = isAudio ? value : toInt(minutesValue);

        if (minutes != null && (minutes < 0 || minutes > 24 * 60)) {
            setError("Revisa los minutos.");
            return;
        }

        if (isAudio) {
            if (!(value && value > 0) && !isFinished) {
                setError("Indica cuántos minutos has escuchado o marca el audiolibro como terminado.");
                return;
            }
        } else {
            const stored = isPercent ? storedPercent : storedPage;
            if (value != null && value < stored) {
                setError(`Ya ibas por ${isPercent ? `el ${stored}%` : `la página ${stored}`}. Para corregir el progreso, usa la versión completa.`);
                return;
            }
            if (value != null && maxValue != null && value > maxValue) {
                setError(isPercent ? "El porcentaje no puede pasar de 100." : `El libro tiene ${maxValue} páginas.`);
                return;
            }
            const advanced = value != null && value > stored;
            if (!advanced && !isFinished && !(minutes && minutes > 0)) {
                setError(isPercent ? "Indica por qué porcentaje vas." : "Indica por qué página vas.");
                return;
            }
        }

        setSubmitting(true);
        try {
            const result = await logReadingSession({
                bookId: book.id,
                durationMinutes: minutes && minutes > 0 ? minutes : null,
                isFinished,
                rating: isFinished && rating > 0 ? rating : undefined,
                format: book.format ?? null,
                ...(isAudio ? {} : isPercent ? { toPercent: value } : { toPage: value }),
            });
            if ("error" in result && result.error) {
                setError(result.error);
                return;
            }
            setSessionId(("sessionId" in result && result.sessionId) || null);
            setStage("done");
            onSaved();
        } catch (err) {
            console.error(err);
            setError("No hemos podido guardar la sesión. Inténtalo de nuevo.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleSaveNote = async () => {
        if (!noteText.trim() || submitting) return;
        setSubmitting(true);
        try {
            const res = await saveNote(book.id, noteText.trim(), noteType, noteLocation());
            if (res && "error" in res && res.error) {
                toast.error(res.error);
                return;
            }
            toast.success(noteType === "Cita" ? "Cita guardada" : "Nota guardada");
            setSavedExtras((s) => ({ ...s, note: true }));
            setNoteText("");
            setStage("done");
        } finally {
            setSubmitting(false);
        }
    };

    const handleSaveEmotion = async () => {
        if (submitting) return;
        setSubmitting(true);
        try {
            const res = await saveUserBookEmotion(book.id, emotion, intensity, emotionNote.trim() || undefined, sessionId);
            if (res && "error" in res && res.error) {
                toast.error(res.error);
                return;
            }
            toast.success("Emoción guardada");
            setSavedExtras((s) => ({ ...s, emotion: true }));
            setStage("done");
        } finally {
            setSubmitting(false);
        }
    };

    const canDismiss = !submitting;

    return (
        <div className="fixed inset-0 z-[70]" role="dialog" aria-modal="true" aria-label={`Registrar lectura de ${book.title}`}>
            <div className="absolute inset-0 bg-teal-dark/40 backdrop-blur-[2px]" onClick={() => canDismiss && onClose()} />
            <div className="absolute inset-x-0 bottom-0 mx-auto max-h-[92dvh] max-w-xl overflow-y-auto rounded-t-[1.75rem] bg-white px-5 pt-3 pb-[calc(env(safe-area-inset-bottom)+1.25rem)] shadow-2xl">
                <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-grey/15" />
                <div className="mb-4 flex items-start gap-3">
                    <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold uppercase tracking-widest text-grey/45">
                            {stage === "note" ? "Nota o cita" : stage === "emotion" ? "Cómo me ha hecho sentir" : "Registrar lectura"}
                        </p>
                        <p className="truncate text-lg font-bold text-teal">{book.title}</p>
                    </div>
                    <button
                        type="button"
                        onClick={() => canDismiss && onClose()}
                        className="rounded-full p-1.5 text-grey/50 active:bg-grey/10"
                        aria-label="Cerrar"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {stage === "form" && (
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="mb-2 block text-sm font-semibold text-teal-dark">{progressLabel}</label>
                            <div className="flex items-center gap-3">
                                <button
                                    type="button"
                                    onClick={() => bump(-step)}
                                    className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-teal/10 text-teal active:bg-teal/20"
                                    aria-label="Menos"
                                >
                                    <Minus className="h-6 w-6" />
                                </button>
                                <div className="relative flex-1">
                                    <input
                                        type="number"
                                        inputMode="numeric"
                                        min={0}
                                        max={maxValue ?? undefined}
                                        value={progressValue}
                                        onChange={(e) => { setError(""); setProgressValue(e.target.value); }}
                                        className="h-14 w-full rounded-2xl border border-teal/15 bg-cream/40 px-4 text-center text-2xl font-bold text-teal-dark tabular-nums outline-none focus:border-teal/40 focus:ring-2 focus:ring-teal/10"
                                        aria-label={progressLabel}
                                    />
                                    {isPercent && (
                                        <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-lg font-bold text-grey/40">%</span>
                                    )}
                                </div>
                                <button
                                    type="button"
                                    onClick={() => bump(step)}
                                    className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-teal/10 text-teal active:bg-teal/20"
                                    aria-label="Más"
                                >
                                    <Plus className="h-6 w-6" />
                                </button>
                            </div>
                            <p className="mt-1.5 text-center text-xs text-grey/55">
                                {isAudio
                                    ? "Lo que has escuchado en esta sesión"
                                    : isPercent
                                        ? `Antes: ${storedPercent}%`
                                        : pageCount
                                            ? `de ${pageCount} páginas · antes: pág. ${storedPage}`
                                            : `Antes: pág. ${storedPage}`}
                            </p>
                        </div>

                        {!isAudio && (
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-teal-dark">
                                    Minutos <span className="font-normal text-grey/50">(opcional)</span>
                                </label>
                                <input
                                    type="number"
                                    inputMode="numeric"
                                    min={0}
                                    placeholder="¿Cuánto has leído?"
                                    value={minutesValue}
                                    onChange={(e) => { setError(""); setMinutesValue(e.target.value); }}
                                    className="h-12 w-full rounded-2xl border border-teal/15 bg-cream/40 px-4 text-base text-teal-dark outline-none focus:border-teal/40 focus:ring-2 focus:ring-teal/10"
                                />
                            </div>
                        )}

                        <div className="rounded-2xl border border-teal/10 bg-cream/30 p-3">
                            <label className="flex items-center justify-between gap-3">
                                <span className="text-sm font-semibold text-teal-dark">Lo he terminado</span>
                                <input
                                    type="checkbox"
                                    checked={isFinished}
                                    onChange={(e) => setIsFinished(e.target.checked)}
                                    className="h-6 w-6 accent-teal"
                                />
                            </label>
                            {isFinished && (
                                <div className="mt-3 flex items-center justify-between gap-3 border-t border-teal/10 pt-3">
                                    <span className="text-sm text-grey/70">¿Qué te ha parecido?</span>
                                    <Rating value={rating} onChange={setRating} />
                                </div>
                            )}
                        </div>

                        {error && (
                            <p className="rounded-xl bg-coral/10 px-3 py-2 text-sm font-medium text-coral">{error}</p>
                        )}

                        <button
                            type="submit"
                            disabled={submitting}
                            className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-teal text-base font-bold text-white shadow-sm active:opacity-90 disabled:opacity-60"
                        >
                            {submitting && <Loader2 className="h-5 w-5 animate-spin" />}
                            Guardar
                        </button>
                    </form>
                )}

                {stage === "done" && (
                    <div className="space-y-4 text-center">
                        <CheckCircle2 className="mx-auto h-12 w-12 text-teal" />
                        <div>
                            <p className="text-lg font-bold text-teal-dark">{isFinished ? "¡Libro terminado!" : "Sesión guardada"}</p>
                            <p className="text-sm text-grey/60">¿Quieres añadir algo más?</p>
                        </div>
                        <div className="grid grid-cols-1 gap-2">
                            <button
                                type="button"
                                onClick={() => setStage("note")}
                                className="flex h-12 items-center justify-center gap-2 rounded-2xl border border-teal/15 font-semibold text-teal active:bg-teal/5"
                            >
                                <NotebookPen className="h-5 w-5" />
                                {savedExtras.note ? "Añadir otra nota o cita" : "Nota o cita"}
                            </button>
                            {!savedExtras.emotion && (
                                <button
                                    type="button"
                                    onClick={() => setStage("emotion")}
                                    className="flex h-12 items-center justify-center gap-2 rounded-2xl border border-teal/15 font-semibold text-teal active:bg-teal/5"
                                >
                                    <HeartPulse className="h-5 w-5" />
                                    Cómo me ha hecho sentir
                                </button>
                            )}
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            className="h-12 w-full rounded-2xl bg-teal font-bold text-white active:opacity-90"
                        >
                            Listo
                        </button>
                    </div>
                )}

                {stage === "note" && (
                    <div className="space-y-4">
                        <div className="flex flex-wrap gap-2">
                            {NOTE_CHIPS.map(({ label, icon: Icon }) => (
                                <button
                                    key={label}
                                    type="button"
                                    onClick={() => setNoteType(label)}
                                    aria-pressed={noteType === label}
                                    className={`flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-semibold ${noteType === label ? "border-teal bg-teal text-white" : "border-teal/15 text-grey/70"}`}
                                >
                                    <Icon className="h-4 w-4" />
                                    {label}
                                </button>
                            ))}
                        </div>
                        <textarea
                            value={noteText}
                            onChange={(e) => setNoteText(e.target.value)}
                            rows={4}
                            autoFocus
                            placeholder={noteType === "Cita" ? "Copia la frase que te ha marcado…" : "Escribe lo que no quieres olvidar…"}
                            className="w-full rounded-2xl border border-teal/15 bg-cream/40 p-4 text-base text-teal-dark outline-none focus:border-teal/40 focus:ring-2 focus:ring-teal/10"
                        />
                        {noteType === "Cita" && (
                            <p className="text-xs text-grey/55">Las citas se publican en tu actividad; el resto de notas son privadas.</p>
                        )}
                        <div className="grid grid-cols-2 gap-2">
                            <button type="button" onClick={() => setStage("done")} className="h-12 rounded-2xl border border-teal/15 font-semibold text-grey/70">
                                Atrás
                            </button>
                            <button
                                type="button"
                                onClick={handleSaveNote}
                                disabled={!noteText.trim() || submitting}
                                className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-teal font-bold text-white disabled:opacity-50"
                            >
                                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                                Guardar
                            </button>
                        </div>
                    </div>
                )}

                {stage === "emotion" && (
                    <div className="space-y-4">
                        <div className="flex flex-wrap gap-2">
                            {EMOTION_OPTIONS.map((opt) => (
                                <button
                                    key={opt.id}
                                    type="button"
                                    onClick={() => setEmotion(opt.id)}
                                    aria-pressed={emotion === opt.id}
                                    className={`rounded-full border px-3.5 py-2 text-sm font-semibold ${emotion === opt.id ? "border-teal bg-teal text-white" : "border-teal/15 text-grey/70"}`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                        <div>
                            <p className="mb-2 text-sm font-semibold text-teal-dark">Intensidad</p>
                            <div className="grid grid-cols-5 gap-2">
                                {[1, 2, 3, 4, 5].map((n) => (
                                    <button
                                        key={n}
                                        type="button"
                                        onClick={() => setIntensity(n)}
                                        aria-pressed={intensity === n}
                                        className={`h-11 rounded-xl text-base font-bold ${intensity === n ? "bg-teal text-white" : "bg-teal/10 text-teal"}`}
                                    >
                                        {n}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <input
                            type="text"
                            value={emotionNote}
                            onChange={(e) => setEmotionNote(e.target.value)}
                            placeholder="¿Por qué? (opcional)"
                            className="h-12 w-full rounded-2xl border border-teal/15 bg-cream/40 px-4 text-base text-teal-dark outline-none focus:border-teal/40 focus:ring-2 focus:ring-teal/10"
                        />
                        <div className="grid grid-cols-2 gap-2">
                            <button type="button" onClick={() => setStage("done")} className="h-12 rounded-2xl border border-teal/15 font-semibold text-grey/70">
                                Atrás
                            </button>
                            <button
                                type="button"
                                onClick={handleSaveEmotion}
                                disabled={submitting}
                                className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-teal font-bold text-white disabled:opacity-50"
                            >
                                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                                Guardar
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
