"use client";

import React from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Review, getBookReviews } from "@/app/app/mi-lectura/actions";
import Image from "next/image";

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

    // Initial load
    React.useEffect(() => {
        if (isOpen) {
            loadReviews(1, true); // Reset list
        }
    }, [isOpen, bookId]);

    const loadReviews = async (pageNum: number, reset = false) => {
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
    };

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
                        <div key={review.id} className="border-b border-teal/5 pb-6 last:border-0 last:pb-0">
                            {/* Header */}
                            <div className="flex justify-between items-start mb-2">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-teal/10 flex items-center justify-center overflow-hidden">
                                        {review.user.avatarUrl ? (
                                            <Image
                                                src={review.user.avatarUrl}
                                                alt={review.user.name}
                                                width={32}
                                                height={32}
                                                className="object-cover"
                                            />
                                        ) : (
                                            <span className="text-xs font-bold text-teal">{review.user.name[0]?.toUpperCase()}</span>
                                        )}
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-teal-dark">{review.user.name}</p>
                                        <div className="flex items-center gap-2">
                                            <div className="flex">
                                                {[1, 2, 3, 4, 5].map((star) => (
                                                    <svg
                                                        key={star}
                                                        width="12"
                                                        height="12"
                                                        viewBox="0 0 24 24"
                                                        fill={star <= review.rating ? "#F59E0B" : "none"}
                                                        stroke={star <= review.rating ? "#F59E0B" : "#CBD5E1"}
                                                        strokeWidth="1.5"
                                                    >
                                                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                                                    </svg>
                                                ))}
                                            </div>
                                            {review.type === "FIRST_IMPRESSIONS" && (
                                                <span className="text-[10px] bg-sky-100 text-sky-700 px-1.5 py-0.5 rounded-full font-medium">
                                                    Primeras Impresiones
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <span className="text-xs text-grey/40">{review.date}</span>
                            </div>

                            {/* Content */}
                            <p className="text-sm text-grey-dark leading-relaxed whitespace-pre-wrap">
                                {review.content}
                            </p>
                        </div>
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
