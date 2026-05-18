"use client";

import React from "react";
import { AlertCircle, Star } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Review } from "@/app/app/mi-lectura/actions";

interface ReviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    bookId: string;
    bookTitle: string;
    status: string;
    initialReview?: Review | null;
    onSuccess: () => void;
}

const RATING_LABELS: Record<number, string> = {
    1: "No me gustó",
    2: "No me convenció",
    3: "Estuvo bien",
    4: "Muy bueno",
    5: "Me encantó",
};

const EMOTIONAL_TONES = [
    { value: "asombro", label: "Asombro" },
    { value: "tristeza", label: "Tristeza" },
    { value: "alegria", label: "Alegria" },
    { value: "miedo", label: "Miedo" },
    { value: "enojo", label: "Enojo" },
    { value: "empatia", label: "Empatia" },
    { value: "inquietud", label: "Inquietud" },
    { value: "esperanza", label: "Esperanza" },
    { value: "confusion", label: "Confusion" },
    { value: "melancolia", label: "Melancolia" },
];

const PACE_OPTIONS = [
    { value: "lento", label: "Lento" },
    { value: "pausado", label: "Pausado" },
    { value: "agil", label: "Agil" },
    { value: "rapido", label: "Rapido" },
    { value: "irregular", label: "Irregular" },
];

const TAG_OPTIONS = [
    "personajes",
    "mundo",
    "prosa",
    "ritmo",
    "final",
    "emocional",
    "ideas",
    "romance",
    "misterio",
    "clasico",
];

export function ReviewModal({ isOpen, onClose, bookId, bookTitle, status, initialReview, onSuccess }: ReviewModalProps) {
    const [rating, setRating] = React.useState(0);
    const [content, setContent] = React.useState("");
    const [containsSpoilers, setContainsSpoilers] = React.useState(false);
    const [emotionalTone, setEmotionalTone] = React.useState("");
    const [pace, setPace] = React.useState("");
    const [recommendedFor, setRecommendedFor] = React.useState("");
    const [selectedTags, setSelectedTags] = React.useState<string[]>([]);
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const [formError, setFormError] = React.useState("");

    const isFirstImpressions = status === "READING";
    const title = initialReview
        ? "Editar tu reseña"
        : isFirstImpressions ? "Primeras impresiones" : "Escribe tu reseña";
    const reviewType = isFirstImpressions ? "FIRST_IMPRESSIONS" : "STANDARD";

    React.useEffect(() => {
        if (!isOpen) return;

        if (initialReview) {
            setRating(initialReview.rating);
            setContent(initialReview.content);
            setContainsSpoilers(Boolean(initialReview.containsSpoilers));
            setEmotionalTone(initialReview.emotionalTone || "");
            setPace(initialReview.pace || "");
            setRecommendedFor(initialReview.recommendedFor || "");
            setSelectedTags(initialReview.tags || []);
        } else {
            setRating(0);
            setContent("");
            setContainsSpoilers(false);
            setEmotionalTone("");
            setPace("");
            setRecommendedFor("");
            setSelectedTags([]);
        }

        setFormError("");
    }, [isOpen, initialReview]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError("");

        if (rating === 0) {
            setFormError("Elige una puntuación antes de publicar.");
            return;
        }

        if (!content.trim()) {
            setFormError("Escribe unas líneas antes de publicar.");
            return;
        }

        setIsSubmitting(true);

        try {
            const { saveReview } = await import("@/app/app/mi-lectura/actions");
            const result = await saveReview(bookId, rating, content.trim(), reviewType, {
                containsSpoilers,
                emotionalTone: emotionalTone || null,
                pace: pace || null,
                recommendedFor,
                tags: selectedTags,
            });

            if (result.error) {
                setFormError(result.error);
                return;
            }

            onSuccess();
            onClose();
        } catch (error) {
            console.error(error);
            setFormError("No hemos podido guardar la reseña. Inténtalo de nuevo.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const toggleTag = (tag: string) => {
        setSelectedTags((current) => {
            if (current.includes(tag)) return current.filter((item) => item !== tag);
            return [...current, tag].slice(0, 6);
        });
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={title}
            className="max-h-[92dvh] overflow-y-auto overscroll-contain sm:max-h-[calc(100dvh-2rem)]"
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="rounded-2xl border border-teal/10 bg-cream/20 p-4">
                    <h3 className="truncate text-xl font-medium text-teal-dark">{bookTitle}</h3>
                    <p className="mt-1 text-xs font-bold uppercase tracking-widest text-grey/60">
                        {isFirstImpressions ? "Estás leyendo este libro" : "Has leído este libro"}
                    </p>
                </div>

                <div className="space-y-2">
                    <div className="flex justify-center gap-2">
                        {[1, 2, 3, 4, 5].map((star) => {
                            const active = star <= rating;

                            return (
                                <button
                                    key={star}
                                    type="button"
                                    onClick={() => setRating(star)}
                                    className="rounded-full p-1 text-slate-300 transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-teal/20"
                                    aria-label={`${star} estrellas`}
                                >
                                    <Star
                                        className="h-9 w-9 transition-colors"
                                        fill={active ? "#F59E0B" : "none"}
                                        stroke={active ? "#F59E0B" : "currentColor"}
                                        strokeWidth={1.6}
                                    />
                                </button>
                            );
                        })}
                    </div>
                    <div className="h-5 text-center text-sm font-medium text-grey/60">
                        {rating > 0 ? RATING_LABELS[rating] : "Toca para valorar"}
                    </div>
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
                    placeholder={isFirstImpressions
                        ? "¿Qué te está pareciendo hasta ahora? ¿Te enganchó el inicio?"
                        : "¿Qué es lo que más te gustó? ¿A quién se lo recomendarías?"
                    }
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                />

                <div className="grid gap-3 md:grid-cols-2">
                    <label className="space-y-1">
                        <span className="text-xs font-bold uppercase tracking-widest text-grey/50">Emocion principal</span>
                        <select
                            value={emotionalTone}
                            onChange={(event) => setEmotionalTone(event.target.value)}
                            className="h-11 w-full rounded-2xl border border-teal/10 bg-white px-3 text-sm text-teal-dark focus:border-teal/30 focus:outline-none focus:ring-2 focus:ring-teal/5"
                        >
                            <option value="">Sin marcar</option>
                            {EMOTIONAL_TONES.map((tone) => (
                                <option key={tone.value} value={tone.value}>{tone.label}</option>
                            ))}
                        </select>
                    </label>

                    <label className="space-y-1">
                        <span className="text-xs font-bold uppercase tracking-widest text-grey/50">Ritmo</span>
                        <select
                            value={pace}
                            onChange={(event) => setPace(event.target.value)}
                            className="h-11 w-full rounded-2xl border border-teal/10 bg-white px-3 text-sm text-teal-dark focus:border-teal/30 focus:outline-none focus:ring-2 focus:ring-teal/5"
                        >
                            <option value="">Sin marcar</option>
                            {PACE_OPTIONS.map((option) => (
                                <option key={option.value} value={option.value}>{option.label}</option>
                            ))}
                        </select>
                    </label>
                </div>

                <label className="space-y-1 block">
                    <span className="text-xs font-bold uppercase tracking-widest text-grey/50">Lo recomendaria a...</span>
                    <input
                        value={recommendedFor}
                        onChange={(event) => setRecommendedFor(event.target.value)}
                        maxLength={160}
                        className="h-11 w-full rounded-2xl border border-teal/10 bg-white px-4 text-sm text-teal-dark placeholder:text-grey/35 focus:border-teal/30 focus:outline-none focus:ring-2 focus:ring-teal/5"
                        placeholder="Lectores que disfruten de personajes complejos, finales lentos..."
                    />
                </label>

                <div className="space-y-2">
                    <p className="text-xs font-bold uppercase tracking-widest text-grey/50">Etiquetas</p>
                    <div className="flex flex-wrap gap-2">
                        {TAG_OPTIONS.map((tag) => {
                            const active = selectedTags.includes(tag);
                            return (
                                <button
                                    key={tag}
                                    type="button"
                                    onClick={() => toggleTag(tag)}
                                    className={`rounded-full border px-3 py-1.5 text-xs font-bold transition ${active
                                        ? "border-teal bg-teal text-white"
                                        : "border-teal/10 bg-white text-grey/60 hover:border-teal/25 hover:text-teal-dark"
                                        }`}
                                >
                                    {tag}
                                </button>
                            );
                        })}
                    </div>
                </div>

                <label className="flex items-center gap-3 rounded-2xl border border-coral/10 bg-coral/5 px-4 py-3 text-sm font-medium text-grey/70">
                    <input
                        type="checkbox"
                        checked={containsSpoilers}
                        onChange={(event) => setContainsSpoilers(event.target.checked)}
                        className="rounded border-coral/30 text-coral focus:ring-coral/20"
                    />
                    Contiene spoilers
                </label>

                <div className="sticky bottom-0 z-10 -mx-5 grid grid-cols-2 gap-3 border-t border-teal/5 bg-white/95 px-5 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-4 backdrop-blur sm:static sm:mx-0 sm:flex sm:justify-end sm:border-t-0 sm:bg-transparent sm:p-0 sm:pt-2 sm:backdrop-blur-none">
                    <Button type="button" variant="ghost" onClick={onClose} className="h-12 px-4 text-base sm:px-8" disabled={isSubmitting}>
                        Cancelar
                    </Button>
                    <Button type="submit" className="h-12 px-4 text-base sm:min-w-44 sm:px-8" disabled={rating === 0 || !content.trim() || isSubmitting}>
                        {isSubmitting ? "Guardando..." : initialReview ? "Actualizar" : "Publicar"}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
