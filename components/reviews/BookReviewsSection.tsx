"use client";

import * as React from "react";
import { MessageSquare, Star } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { getBookReviewOverview, type BookReviewOverview } from "@/app/app/mi-lectura/actions";
import { ReviewCard } from "./ReviewCard";

interface BookReviewsSectionProps {
    bookId: string | null;
    canReview: boolean;
    reviewButtonLabel: string;
    refreshKey?: number;
    onOpenReview: () => void;
    onOpenAll: () => void;
}

const EMPTY_OVERVIEW: BookReviewOverview = {
    averageRating: 0,
    totalReviews: 0,
    finalReviewsCount: 0,
    firstImpressionsCount: 0,
    distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    featuredReviews: [],
    firstImpressions: [],
};

function RatingDistribution({
    distribution,
    total,
}: {
    distribution: BookReviewOverview["distribution"];
    total: number;
}) {
    return (
        <div className="space-y-1.5">
            {[5, 4, 3, 2, 1].map((rating) => {
                const count = distribution[rating as 1 | 2 | 3 | 4 | 5];
                const percentage = total ? Math.round((count / total) * 100) : 0;

                return (
                    <div key={rating} className="grid grid-cols-[2rem_1fr_2.5rem] items-center gap-2 text-xs text-grey/55">
                        <span className="font-bold text-teal-dark">{rating}</span>
                        <div className="h-2 overflow-hidden rounded-full bg-grey/10">
                            <div className="h-full rounded-full bg-amber-400" style={{ width: `${percentage}%` }} />
                        </div>
                        <span className="text-right">{count}</span>
                    </div>
                );
            })}
        </div>
    );
}

export function BookReviewsSection({
    bookId,
    canReview,
    reviewButtonLabel,
    refreshKey = 0,
    onOpenReview,
    onOpenAll,
}: BookReviewsSectionProps) {
    const [overview, setOverview] = React.useState<BookReviewOverview>(EMPTY_OVERVIEW);
    const [isLoading, setIsLoading] = React.useState(false);

    React.useEffect(() => {
        if (!bookId) {
            setOverview(EMPTY_OVERVIEW);
            return;
        }

        let active = true;
        setIsLoading(true);

        getBookReviewOverview(bookId)
            .then((result) => {
                if (active) setOverview(result);
            })
            .finally(() => {
                if (active) setIsLoading(false);
            });

        return () => {
            active = false;
        };
    }, [bookId, refreshKey]);

    const hasReviews = overview.totalReviews > 0;

    return (
        <section className="mt-12 border-t border-teal/10 pt-8">
            <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div>
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-grey/45">Reviews</p>
                    <h2 className="mt-1 font-serif text-2xl text-teal-dark">Lo que dicen los lectores</h2>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-grey/65">
                        Reseñas finales y primeras impresiones para decidir mejor tu proxima lectura.
                    </p>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                    {canReview && (
                        <Button type="button" size="sm" onClick={onOpenReview}>
                            <MessageSquare size={16} className="mr-2" />
                            {reviewButtonLabel}
                        </Button>
                    )}
                    <Button type="button" size="sm" variant="outline" onClick={onOpenAll} disabled={!bookId}>
                        Leer todas
                    </Button>
                </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-[18rem_1fr]">
                <div className="rounded-3xl border border-black/5 bg-white p-5 shadow-sm">
                    {isLoading ? (
                        <div className="space-y-3">
                            <div className="h-8 w-20 animate-pulse rounded bg-teal/10" />
                            <div className="h-4 w-32 animate-pulse rounded bg-teal/5" />
                            <div className="h-24 animate-pulse rounded-2xl bg-teal/5" />
                        </div>
                    ) : hasReviews ? (
                        <>
                            <div className="flex items-end gap-2">
                                <span className="text-4xl font-bold text-teal-dark">{overview.averageRating.toFixed(1)}</span>
                                <div className="pb-1">
                                    <div className="flex text-amber-500">
                                        <Star size={16} fill="currentColor" />
                                    </div>
                                    <p className="text-xs text-grey/45">{overview.totalReviews} opiniones</p>
                                </div>
                            </div>
                            <div className="mt-5">
                                <RatingDistribution distribution={overview.distribution} total={overview.totalReviews} />
                            </div>
                            <div className="mt-5 grid grid-cols-2 gap-2 text-center">
                                <div className="rounded-2xl bg-cream/70 px-3 py-2">
                                    <p className="text-lg font-bold text-teal-dark">{overview.finalReviewsCount}</p>
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-grey/45">Finales</p>
                                </div>
                                <div className="rounded-2xl bg-sky-50 px-3 py-2">
                                    <p className="text-lg font-bold text-sky-700">{overview.firstImpressionsCount}</p>
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-sky-700/55">En curso</p>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="py-4 text-center">
                            <Star className="mx-auto h-10 w-10 text-teal/20" />
                            <p className="mt-3 text-sm font-bold text-teal-dark">Aun no hay reviews</p>
                            <p className="mt-1 text-xs leading-5 text-grey/50">La primera opinion puede orientar al siguiente lector.</p>
                        </div>
                    )}
                </div>

                <div className="space-y-4">
                    {isLoading ? (
                        <div className="grid gap-3 md:grid-cols-2">
                            {[1, 2].map((item) => (
                                <div key={item} className="h-44 animate-pulse rounded-2xl bg-white" />
                            ))}
                        </div>
                    ) : hasReviews ? (
                        <>
                            {overview.featuredReviews.length > 0 && (
                                <div>
                                    <div className="mb-2 flex items-center justify-between">
                                        <h3 className="text-sm font-bold uppercase tracking-[0.14em] text-teal-dark">Reseñas finales</h3>
                                    </div>
                                    <div className="grid gap-3 md:grid-cols-2">
                                        {overview.featuredReviews.map((review) => (
                                            <ReviewCard key={review.id} review={review} compact />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {overview.firstImpressions.length > 0 && (
                                <div>
                                    <h3 className="mb-2 text-sm font-bold uppercase tracking-[0.14em] text-sky-700">Primeras impresiones</h3>
                                    <div className="grid gap-3 md:grid-cols-2">
                                        {overview.firstImpressions.map((review) => (
                                            <ReviewCard key={review.id} review={review} compact />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="rounded-3xl border border-dashed border-teal/15 bg-white/60 px-5 py-8 text-center">
                            <p className="text-sm text-grey/55">Cuando alguien comparta una reseña, aparecera aqui sin esconderse en un modal.</p>
                            {canReview && (
                                <Button type="button" size="sm" className="mt-4" onClick={onOpenReview}>
                                    Escribir la primera
                                </Button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}
