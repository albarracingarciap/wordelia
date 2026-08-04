"use client";

import { toast } from "@/components/ui/toast";

import { useState } from "react";
import { Star, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { saveReview } from "@/app/app/libros/actions";
import { useRouter } from "next/navigation";

interface ReviewModalProps {
    bookId: string;
    bookTitle: string;
    isOpen: boolean;
    onClose: () => void;
    initialRating?: number;
    initialReview?: string;
}

export function ReviewModal({ bookId, bookTitle, isOpen, onClose, initialRating = 0, initialReview = "" }: ReviewModalProps) {
    const [rating, setRating] = useState(initialRating);
    const [review, setReview] = useState(initialReview);
    const [loading, setLoading] = useState(false);
    const [hoverRating, setHoverRating] = useState(0);

    const router = useRouter();

    if (!isOpen) return null;

    const handleSubmit = async () => {
        if (rating === 0) {
            toast.error("Por favor, selecciona una valoración (estrellas).");
            return;
        }

        setLoading(true);
        try {
            const result = await saveReview(bookId, rating, review);
            if (result.success) {
                onClose();
                // Optional: Trigger a refresh or toast
            } else {
                toast.error(result.error ?? "No se pudo enviar la reseña.");
            }
        } catch (e) {
            toast.error("Error al enviar la reseña.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-teal-dark/60 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-grey/10">
                    <h3 className="font-serif text-lg text-teal-dark truncate pr-4">Reseñar "{bookTitle}"</h3>
                    <button onClick={onClose} className="text-grey/40 hover:text-grey-dark transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-6">
                    {/* Stars */}
                    <div className="flex flex-col items-center gap-2">
                        <div className="flex gap-1" onMouseLeave={() => setHoverRating(0)}>
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    type="button"
                                    className="p-1 focus:outline-none transition-transform hover:scale-110"
                                    onClick={() => setRating(star)}
                                    onMouseEnter={() => setHoverRating(star)}
                                >
                                    <Star
                                        size={32}
                                        className={`${star <= (hoverRating || rating)
                                                ? "fill-orange-400 text-orange-400"
                                                : "fill-transparent text-grey/20"
                                            } transition-colors duration-200`}
                                    />
                                </button>
                            ))}
                        </div>
                        <span className="text-sm font-medium text-grey/60">
                            {hoverRating || rating ? (
                                ["Odiado", "No me gustó", "Regular", "Me gustó", "¡Me encantó!"][(hoverRating || rating) - 1]
                            ) : (
                                "Toca las estrellas para valorar"
                            )}
                        </span>
                    </div>

                    {/* Text Area */}
                    <textarea
                        className="w-full h-32 p-3 bg-grey/5 rounded-xl border border-transparent focus:border-teal/30 focus:bg-white focus:ring-2 focus:ring-teal/10 transition-all resize-none text-sm placeholder:text-grey/40"
                        placeholder="Escribe tu opinión sobre el libro... (opcional)"
                        value={review}
                        onChange={(e) => setReview(e.target.value)}
                    />
                </div>

                {/* Footer */}
                <div className="p-4 bg-cream/30 flex gap-3 justify-end border-t border-grey/10">
                    <Button variant="ghost" onClick={onClose} disabled={loading}>
                        Cancelar
                    </Button>
                    <Button onClick={handleSubmit} isLoading={loading} disabled={rating === 0}>
                        Publicar reseña
                    </Button>
                </div>
            </div>
        </div>
    );
}
