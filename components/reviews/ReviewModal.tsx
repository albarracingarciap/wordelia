"use client";

import React from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Review } from "@/app/app/mi-lectura/actions";

interface ReviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    bookId: string;
    bookTitle: string;
    status: string; // 'READ' | 'READING' | etc.
    initialReview?: Review | null;
    onSuccess: () => void;
}

export function ReviewModal({ isOpen, onClose, bookId, bookTitle, status, initialReview, onSuccess }: ReviewModalProps) {
    const [rating, setRating] = React.useState(0);
    const [content, setContent] = React.useState("");
    const [isSubmitting, setIsSubmitting] = React.useState(false);

    const isFirstImpressions = status === "READING";
    const title = initialReview
        ? "Editar tu reseña"
        : (isFirstImpressions ? "Primeras impresiones" : "Escribe tu reseña");

    const reviewType = isFirstImpressions ? 'FIRST_IMPRESSIONS' : 'STANDARD';

    React.useEffect(() => {
        if (isOpen) {
            if (initialReview) {
                setRating(initialReview.rating);
                setContent(initialReview.content);
            } else {
                setRating(0);
                setContent("");
            }
        }
    }, [isOpen, initialReview]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const { saveReview } = await import("@/app/app/mi-lectura/actions");
            const result = await saveReview(bookId, rating, content, reviewType);
            if (result.error) {
                alert("Error al guardar: " + result.error);
                return;
            }
            onSuccess();
            onClose();
        } catch (error) {
            console.error(error);
            alert("Ocurrió un error inesperado.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title}>
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <h3 className="font-serif text-lg text-teal-dark mb-1">{bookTitle}</h3>
                    <p className="text-xs text-grey/60 uppercase tracking-wider font-bold">
                        {isFirstImpressions ? "ESTÁS LEYENDO ESTE LIBRO" : "HAS LEÍDO ESTE LIBRO"}
                    </p>
                </div>

                {/* Star Rating */}
                <div className="flex justify-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <button
                            key={star}
                            type="button"
                            onClick={() => setRating(star)}
                            className="transition-transform hover:scale-110 focus:outline-none"
                        >
                            <svg
                                width="32"
                                height="32"
                                viewBox="0 0 24 24"
                                fill={star <= rating ? "#F59E0B" : "none"} // Amber-500 for filled
                                stroke={star <= rating ? "#F59E0B" : "#CBD5E1"} // Slate-300 for empty
                                strokeWidth="1.5"
                                className="transition-colors"
                            >
                                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                            </svg>
                        </button>
                    ))}
                </div>
                <div className="text-center text-xs text-grey/60 h-4">
                    {rating > 0 && (
                        rating === 5 ? "¡Me encantó!" :
                            rating === 4 ? "Muy bueno" :
                                rating === 3 ? "Estuvo bien" :
                                    rating === 2 ? "No me convenció" : "No me gustó"
                    )}
                </div>

                {/* Review Content */}
                <div>
                    <textarea
                        rows={6}
                        className="w-full bg-cream/30 border border-teal/10 rounded-xl px-4 py-3 text-teal-dark placeholder:text-grey/30 text-sm focus:outline-none focus:border-teal/30 focus:bg-white focus:ring-2 focus:ring-teal/5 transition-all resize-none"
                        placeholder={isFirstImpressions
                            ? "¿Qué te está pareciendo hasta ahora? ¿Te enganchó el inicio?"
                            : "¿Qué es lo que más te gustó? ¿A quién se lo recomendarías?"
                        }
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                    />
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-2">
                    <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>Cancelar</Button>
                    <Button type="submit" disabled={rating === 0 || !content.trim() || isSubmitting}>
                        {isSubmitting ? "Guardando..." : "Publicar reseña"}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
