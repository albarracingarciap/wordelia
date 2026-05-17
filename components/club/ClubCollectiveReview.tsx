"use client";

import * as React from "react";
import { Star, UsersRound } from "lucide-react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import {
    getClubBookCollectiveReview,
    saveClubBookCollectiveReview,
} from "@/app/app/clubs/[id]/actions";

interface CollectiveReview {
    id: string;
    rating: number;
    conclusion: string;
    highlight?: string | null;
    createdAt: string;
    isMine: boolean;
    user: {
        name: string;
        avatarUrl?: string | null;
    };
}

interface CollectiveReviewState {
    reviews: CollectiveReview[];
    myReview: CollectiveReview | null;
    averageRating: number;
    totalReviews: number;
}

interface ClubCollectiveReviewProps {
    clubBookId?: string | null;
    bookId?: string | null;
    bookTitle?: string | null;
}

const EMPTY_STATE: CollectiveReviewState = {
    reviews: [],
    myReview: null,
    averageRating: 0,
    totalReviews: 0,
};

function RatingStars({
    value,
    onChange,
    interactive = false,
}: {
    value: number;
    onChange?: (value: number) => void;
    interactive?: boolean;
}) {
    return (
        <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => {
                const active = star <= value;
                const className = active ? "text-amber-500" : "text-grey/25";

                if (!interactive) {
                    return (
                        <Star
                            key={star}
                            size={18}
                            fill={active ? "currentColor" : "none"}
                            className={className}
                        />
                    );
                }

                return (
                    <button
                        key={star}
                        type="button"
                        onClick={() => onChange?.(star)}
                        className="rounded-full p-1 transition hover:scale-110 focus:outline-none focus:ring-2 focus:ring-teal/20"
                        aria-label={`${star} estrellas`}
                    >
                        <Star
                            size={24}
                            fill={active ? "currentColor" : "none"}
                            className={className}
                        />
                    </button>
                );
            })}
        </div>
    );
}

export function ClubCollectiveReview({ clubBookId, bookId, bookTitle }: ClubCollectiveReviewProps) {
    const params = useParams();
    const clubId = params.id as string;
    const [state, setState] = React.useState<CollectiveReviewState>(EMPTY_STATE);
    const [rating, setRating] = React.useState(0);
    const [conclusion, setConclusion] = React.useState("");
    const [highlight, setHighlight] = React.useState("");
    const [isLoading, setIsLoading] = React.useState(true);
    const [isSaving, setIsSaving] = React.useState(false);
    const [message, setMessage] = React.useState<string | null>(null);

    const loadReview = React.useCallback(async () => {
        if (!clubId || !clubBookId) return;
        setIsLoading(true);
        const result = await getClubBookCollectiveReview(clubId, clubBookId);
        setState(result as CollectiveReviewState);
        setIsLoading(false);
    }, [clubId, clubBookId]);

    React.useEffect(() => {
        loadReview();
    }, [loadReview]);

    React.useEffect(() => {
        if (!state.myReview) return;
        setRating(state.myReview.rating);
        setConclusion(state.myReview.conclusion);
        setHighlight(state.myReview.highlight || "");
    }, [state.myReview]);

    if (!clubBookId || !bookId) return null;

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setMessage(null);

        if (rating < 1) {
            setMessage("Elige una valoración antes de guardar.");
            return;
        }

        if (conclusion.trim().length < 10) {
            setMessage("Añade una conclusión un poco más completa.");
            return;
        }

        setIsSaving(true);
        const result = await saveClubBookCollectiveReview(clubId, clubBookId, bookId, {
            rating,
            conclusion,
            highlight,
        });
        setIsSaving(false);

        if (result?.error) {
            setMessage(result.error);
            return;
        }

        setMessage("Tu cierre se ha guardado.");
        await loadReview();
    };

    const topReviews = state.reviews.slice(0, 3);

    return (
        <Card className="rounded-3xl">
            <div className="flex flex-col gap-5">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-[0.14em] text-grey/45">Cierre colectivo</p>
                        <h3 className="mt-2 text-2xl font-bold text-teal-dark">Reseña final del club</h3>
                        <p className="mt-2 text-sm leading-6 text-grey/65">
                            Cuando terminéis {bookTitle ? <strong>{bookTitle}</strong> : "el libro"}, recoged valoración, conclusiones y una idea que merezca quedarse.
                        </p>
                    </div>
                    <div className="rounded-2xl bg-cream px-4 py-3 text-center">
                        <p className="text-2xl font-bold text-teal-dark">
                            {state.averageRating ? state.averageRating.toFixed(1) : "-"}
                        </p>
                        <RatingStars value={Math.round(state.averageRating)} />
                        <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-grey/45">
                            {state.totalReviews} cierres
                        </p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="rounded-3xl border border-teal/10 bg-cream/35 p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <p className="text-sm font-bold text-teal-dark">Tu valoración</p>
                            <p className="text-xs text-grey/50">Puedes editarla cuando quieras.</p>
                        </div>
                        <RatingStars value={rating} onChange={setRating} interactive />
                    </div>

                    <div className="mt-4 space-y-3">
                        <textarea
                            rows={3}
                            value={conclusion}
                            onChange={(event) => setConclusion(event.target.value)}
                            className="w-full resize-none rounded-2xl border border-teal/10 bg-white px-4 py-3 text-base text-teal-dark placeholder:text-grey/35 focus:border-teal/30 focus:outline-none focus:ring-2 focus:ring-teal/5"
                            placeholder="¿Qué conclusión se lleva el club de esta lectura?"
                        />
                        <input
                            value={highlight}
                            onChange={(event) => setHighlight(event.target.value)}
                            className="w-full rounded-2xl border border-teal/10 bg-white px-4 py-3 text-base text-teal-dark placeholder:text-grey/35 focus:border-teal/30 focus:outline-none focus:ring-2 focus:ring-teal/5"
                            placeholder="Idea, cita o aprendizaje destacado (opcional)"
                        />
                    </div>

                    {message && (
                        <p className="mt-3 rounded-2xl bg-white px-4 py-3 text-sm font-medium text-coral">
                            {message}
                        </p>
                    )}

                    <Button type="submit" className="mt-4 w-full sm:w-auto" disabled={isSaving}>
                        {isSaving ? "Guardando..." : state.myReview ? "Actualizar cierre" : "Guardar mi cierre"}
                    </Button>
                </form>

                <div>
                    <div className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-[0.14em] text-teal-dark">
                        <UsersRound size={16} />
                        Conclusiones del club
                    </div>

                    {isLoading ? (
                        <p className="rounded-2xl border border-dashed border-grey/15 p-4 text-sm text-grey/45">Cargando cierres...</p>
                    ) : topReviews.length ? (
                        <div className="space-y-3">
                            {topReviews.map((review) => (
                                <article key={review.id} className="rounded-2xl border border-black/5 bg-white p-4">
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <p className="text-sm font-bold text-teal-dark">
                                                {review.user.name}{review.isMine ? " (tú)" : ""}
                                            </p>
                                            <RatingStars value={review.rating} />
                                        </div>
                                    </div>
                                    <p className="mt-3 text-sm leading-6 text-grey/70">{review.conclusion}</p>
                                    {review.highlight && (
                                        <p className="mt-3 rounded-2xl bg-cream px-4 py-3 text-sm italic leading-6 text-grey/65">
                                            {review.highlight}
                                        </p>
                                    )}
                                </article>
                            ))}
                        </div>
                    ) : (
                        <p className="rounded-2xl border border-dashed border-grey/15 p-4 text-sm text-grey/45">
                            Aún no hay cierres. El primero marcará el tono de la reseña colectiva.
                        </p>
                    )}
                </div>
            </div>
        </Card>
    );
}
