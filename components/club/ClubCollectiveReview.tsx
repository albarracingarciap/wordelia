"use client";

import * as React from "react";
import { Clipboard, Quote, Sparkles, Star, UsersRound } from "lucide-react";
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
    ratingDistribution: Record<1 | 2 | 3 | 4 | 5, number>;
    consensus: string | null;
    highlights: string[];
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
    ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    consensus: null,
    highlights: [],
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

function RatingDistribution({
    distribution,
    total,
}: {
    distribution: CollectiveReviewState["ratingDistribution"];
    total: number;
}) {
    return (
        <div className="space-y-1.5">
            {[5, 4, 3, 2, 1].map((rating) => {
                const count = distribution[rating as 1 | 2 | 3 | 4 | 5] || 0;
                const width = total ? Math.round((count / total) * 100) : 0;

                return (
                    <div key={rating} className="grid grid-cols-[1.5rem_1fr_2rem] items-center gap-2 text-xs text-grey/55">
                        <span className="font-bold text-teal-dark">{rating}</span>
                        <div className="h-2 overflow-hidden rounded-full bg-grey/10">
                            <div className="h-full rounded-full bg-amber-400" style={{ width: `${width}%` }} />
                        </div>
                        <span className="text-right">{count}</span>
                    </div>
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
    const [copyMessage, setCopyMessage] = React.useState("");

    const loadReview = React.useCallback(async () => {
        if (!clubId || !clubBookId) return;
        setIsLoading(true);
        const result = await getClubBookCollectiveReview(clubId, clubBookId);
        setState({ ...EMPTY_STATE, ...result } as CollectiveReviewState);
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
            setMessage("Elige una valoracion antes de guardar.");
            return;
        }

        if (conclusion.trim().length < 10) {
            setMessage("Anade una conclusion un poco mas completa.");
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
    const shareText = [
        bookTitle ? `Resena final del club sobre "${bookTitle}"` : "Resena final del club",
        state.averageRating ? `Valoracion media: ${state.averageRating.toFixed(1)}/5 (${state.totalReviews} cierres)` : null,
        state.consensus ? `Consenso: ${state.consensus}` : null,
        state.highlights.length ? `Ideas destacadas: ${state.highlights.join(" · ")}` : null,
    ].filter(Boolean).join("\n");

    const copyShareText = async () => {
        if (!shareText) return;
        try {
            await navigator.clipboard.writeText(shareText);
            setCopyMessage("Resumen copiado.");
        } catch {
            setCopyMessage("No se pudo copiar el resumen.");
        }
    };

    return (
        <Card className="overflow-hidden rounded-3xl border-teal/10 p-0">
            <div className="flex flex-col gap-5">
                <div className="bg-teal-dark px-5 py-6 text-white sm:px-6">
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                        <div className="max-w-2xl">
                            <p className="text-xs font-bold uppercase tracking-[0.16em] text-white/55">Cierre colectivo</p>
                            <h3 className="mt-2 text-2xl font-bold">La resena final del club</h3>
                            <p className="mt-2 text-sm leading-6 text-white/70">
                                Una lectura no termina solo con estrellas: termina con el consenso, las ideas que quedan y las voces del club.
                            </p>
                        </div>
                        <div className="grid grid-cols-2 gap-2 sm:flex">
                            <div className="rounded-2xl bg-white/10 px-4 py-3 text-center">
                                <p className="text-3xl font-bold">{state.averageRating ? state.averageRating.toFixed(1) : "-"}</p>
                                <RatingStars value={Math.round(state.averageRating)} />
                                <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-white/45">Media</p>
                            </div>
                            <div className="rounded-2xl bg-white/10 px-4 py-3 text-center">
                                <p className="text-3xl font-bold">{state.totalReviews}</p>
                                <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-white/45">Cierres</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid gap-4 px-5 sm:px-6 lg:grid-cols-[1fr_18rem]">
                    <div className="rounded-3xl border border-teal/10 bg-teal/5 p-4">
                        <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.14em] text-teal-dark">
                            <Sparkles size={16} />
                            Consenso del club
                        </div>
                        {isLoading ? (
                            <p className="mt-3 text-sm text-grey/45">Cargando consenso...</p>
                        ) : state.consensus ? (
                            <p className="mt-3 text-base leading-7 text-grey-dark">{state.consensus}</p>
                        ) : (
                            <p className="mt-3 text-sm leading-6 text-grey/55">
                                Cuando haya varios cierres, aqui aparecera una conclusion representativa para que el club tenga memoria de lectura.
                            </p>
                        )}

                        {state.highlights.length > 0 && (
                            <div className="mt-4 grid gap-2 sm:grid-cols-2">
                                {state.highlights.map((item) => (
                                    <div key={item} className="rounded-2xl bg-white px-3 py-2 text-sm italic leading-6 text-grey/65">
                                        <Quote size={14} className="mb-1 text-teal/60" />
                                        {item}
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
                            <Button type="button" size="sm" variant="outline" onClick={copyShareText} disabled={!shareText}>
                                <Clipboard size={15} className="mr-2" />
                                Copiar resumen
                            </Button>
                            {copyMessage && <span className="text-xs font-medium text-grey/55">{copyMessage}</span>}
                        </div>
                    </div>

                    <div className="rounded-3xl border border-black/5 bg-white p-4">
                        <p className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-grey/45">Distribucion</p>
                        <RatingDistribution distribution={state.ratingDistribution} total={state.totalReviews} />
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="mx-5 rounded-3xl border border-teal/10 bg-cream/35 p-4 sm:mx-6">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <p className="text-sm font-bold text-teal-dark">Tu cierre de lectura</p>
                            <p className="text-xs text-grey/50">Aporta una conclusion y una idea que merezca quedarse.</p>
                        </div>
                        <RatingStars value={rating} onChange={setRating} interactive />
                    </div>

                    <div className="mt-4 space-y-3">
                        <textarea
                            rows={3}
                            value={conclusion}
                            onChange={(event) => setConclusion(event.target.value)}
                            className="w-full resize-none rounded-2xl border border-teal/10 bg-white px-4 py-3 text-base text-teal-dark placeholder:text-grey/35 focus:border-teal/30 focus:outline-none focus:ring-2 focus:ring-teal/5"
                            placeholder="Que conclusion se lleva el club de esta lectura?"
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

                <div className="px-5 pb-5 sm:px-6 sm:pb-6">
                    <div className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-[0.14em] text-teal-dark">
                        <UsersRound size={16} />
                        Voces del club
                    </div>

                    {isLoading ? (
                        <p className="rounded-2xl border border-dashed border-grey/15 p-4 text-sm text-grey/45">Cargando cierres...</p>
                    ) : topReviews.length ? (
                        <div className="grid gap-3 lg:grid-cols-3">
                            {topReviews.map((review) => (
                                <article key={review.id} className="rounded-2xl border border-black/5 bg-white p-4">
                                    <div>
                                        <p className="text-sm font-bold text-teal-dark">
                                            {review.user.name}{review.isMine ? " (tu)" : ""}
                                        </p>
                                        <RatingStars value={review.rating} />
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
                            Aun no hay cierres. El primero marcara el tono de la resena colectiva.
                        </p>
                    )}
                </div>
            </div>
        </Card>
    );
}
