"use client";

import React from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Review, getBookReviews } from "@/app/app/mi-lectura/actions";
import { ReviewCard } from "./ReviewCard";

interface ReviewsListModalProps {
    isOpen: boolean;
    onClose: () => void;
    bookId: string | null;
    bookTitle: string;
}

export function ReviewsListModal({ isOpen, onClose, bookId, bookTitle }: ReviewsListModalProps) {
    const [reviews, setReviews] = React.useState<Review[]>([]);
    const [page, setPage] = React.useState(1);
    const [total, setTotal] = React.useState(0);
    const [isLoading, setIsLoading] = React.useState(false);

    const loadReviews = React.useCallback(async (pageNum: number, reset = false) => {
        if (!bookId) {
            setReviews([]);
            setTotal(0);
            return;
        }

        setIsLoading(true);
        try {
            const result = await getBookReviews(bookId, pageNum, 5);
            if (reset) {
                setReviews(result.reviews);
            } else {
                setReviews(prev => [...prev, ...result.reviews]);
            }
            setTotal(result.total);
            setPage(pageNum);
        } catch (error) {
            console.error("Error loading reviews:", error);
        } finally {
            setIsLoading(false);
        }
    }, [bookId]);

    // Initial load
    React.useEffect(() => {
        if (isOpen) {
            loadReviews(1, true); // Reset list
        }
    }, [isOpen, bookId, loadReviews]);

    const handleLoadMore = () => {
        loadReviews(page + 1);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Reseñas de ${bookTitle}`}>
            <div className="max-h-[60vh] overflow-y-auto pr-2 space-y-6">
                {reviews.length === 0 && !isLoading ? (
                    <div className="text-center py-12 text-grey/40">
                        <p>Aún no hay reseñas para este libro.</p>
                        <p className="text-xs mt-2">¡Sé el primero en opinar!</p>
                    </div>
                ) : (
                    reviews.map((review) => (
                        <ReviewCard key={review.id} review={review} />
                    ))
                )}

                {/* Load More */}
                {reviews.length < total && (
                    <div className="text-center pt-4">
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={handleLoadMore}
                            disabled={isLoading}
                        >
                            {isLoading ? "Cargando..." : "Ver más reseñas"}
                        </Button>
                    </div>
                )}
            </div>
        </Modal>
    );
}
