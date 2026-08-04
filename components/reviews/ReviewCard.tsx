"use client";

import { toast } from "@/components/ui/toast";

import Image from "next/image";
import Link from "next/link";
import { BookOpen, Star } from "lucide-react";
import { toggleReviewHelpful, type Review, type ReviewWithBook } from "@/app/app/mi-lectura/actions";
import * as React from "react";

interface ReviewCardProps {
    review: Review | ReviewWithBook;
    compact?: boolean;
    showBook?: boolean;
}

function Stars({ value }: { value: number }) {
    return (
        <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((star) => {
                const active = star <= value;
                return (
                    <Star
                        key={star}
                        size={14}
                        fill={active ? "currentColor" : "none"}
                        className={active ? "text-amber-500" : "text-grey/25"}
                    />
                );
            })}
        </div>
    );
}

function getInitial(name: string) {
    return name.trim().charAt(0).toUpperCase() || "L";
}

function isReviewWithBook(review: Review | ReviewWithBook): review is ReviewWithBook {
    return "book" in review;
}

export function ReviewCard({ review, compact = false, showBook = false }: ReviewCardProps) {
    const hasBook = showBook && isReviewWithBook(review);
    const [showSpoiler, setShowSpoiler] = React.useState(false);
    const [isHelpful, setIsHelpful] = React.useState(Boolean(review.isHelpfulByMe));
    const [helpfulCount, setHelpfulCount] = React.useState(review.helpfulCount || 0);
    const [isPending, startTransition] = React.useTransition();
    const shouldHideContent = review.containsSpoilers && !showSpoiler;
    const metaChips = [
        review.emotionalTone ? `Emocion: ${review.emotionalTone}` : null,
        review.pace ? `Ritmo: ${review.pace}` : null,
        ...(review.tags || []).slice(0, 4).map((tag) => `#${tag}`),
    ].filter(Boolean);

    React.useEffect(() => {
        setIsHelpful(Boolean(review.isHelpfulByMe));
        setHelpfulCount(review.helpfulCount || 0);
    }, [review.helpfulCount, review.isHelpfulByMe]);

    const handleHelpful = () => {
        const nextHelpful = !isHelpful;
        setIsHelpful(nextHelpful);
        setHelpfulCount((current) => nextHelpful ? current + 1 : Math.max(0, current - 1));

        startTransition(async () => {
            const result = await toggleReviewHelpful(review.id);
            if (result?.error) {
                setIsHelpful(isHelpful);
                setHelpfulCount(helpfulCount);
                toast.error(result.error);
                return;
            }

            setIsHelpful(Boolean(result.helpful));
        });
    };

    return (
        <article className="rounded-2xl border border-black/5 bg-white p-4 shadow-sm">
            {hasBook && (
                <Link href={`/app/libros/${review.book.id}`} className="mb-4 flex items-center gap-3 rounded-2xl bg-cream/60 p-2 transition hover:bg-cream">
                    <div className="relative h-14 w-10 shrink-0 overflow-hidden rounded-md bg-teal/10">
                        {review.book.coverUrl ? (
                            <Image src={review.book.coverUrl} alt={review.book.title} fill className="object-cover" />
                        ) : (
                            <div className="flex h-full w-full items-center justify-center text-teal/40">
                                <BookOpen size={18} />
                            </div>
                        )}
                    </div>
                    <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-teal-dark">{review.book.title}</p>
                        {review.book.author && <p className="truncate text-xs text-grey/55">{review.book.author}</p>}
                    </div>
                </Link>
            )}

            <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2">
                    <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full bg-teal/10">
                        {review.user.avatarUrl ? (
                            <Image src={review.user.avatarUrl} alt={review.user.name} fill className="object-cover" />
                        ) : (
                            <div className="flex h-full w-full items-center justify-center text-xs font-bold text-teal">
                                {getInitial(review.user.name)}
                            </div>
                        )}
                    </div>
                    <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-teal-dark">
                            {review.user.name}{review.isMyReview ? " (tu)" : ""}
                        </p>
                        <div className="mt-1 flex flex-wrap items-center gap-2">
                            <Stars value={review.rating} />
                            {review.type === "FIRST_IMPRESSIONS" && (
                                <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-bold text-sky-700">
                                    Primeras impresiones
                                </span>
                            )}
                            {review.containsSpoilers && (
                                <span className="rounded-full bg-coral/10 px-2 py-0.5 text-[10px] font-bold text-coral">
                                    Spoilers
                                </span>
                            )}
                        </div>
                    </div>
                </div>
                <span className="shrink-0 text-xs text-grey/40">{review.date}</span>
            </div>

            {metaChips.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                    {metaChips.map((chip) => (
                        <span key={chip} className="rounded-full bg-cream/80 px-2.5 py-1 text-[11px] font-bold text-grey/60">
                            {chip}
                        </span>
                    ))}
                </div>
            )}

            {review.recommendedFor && (
                <p className="mt-3 rounded-2xl bg-teal/5 px-3 py-2 text-xs font-medium leading-5 text-teal-dark">
                    Para quien busca: {review.recommendedFor}
                </p>
            )}

            {shouldHideContent ? (
                <div className="mt-3 rounded-2xl border border-coral/10 bg-coral/5 px-4 py-3">
                    <p className="text-sm font-medium text-coral">Esta review contiene spoilers.</p>
                    <button
                        type="button"
                        onClick={() => setShowSpoiler(true)}
                        className="mt-2 text-xs font-bold uppercase tracking-widest text-coral underline underline-offset-4"
                    >
                        Mostrar review
                    </button>
                </div>
            ) : (
                <p className={`mt-3 whitespace-pre-wrap text-sm leading-6 text-grey-dark ${compact ? "line-clamp-4" : ""}`}>
                    {review.content}
                </p>
            )}

            <div className="mt-4 flex items-center justify-between border-t border-teal/5 pt-3">
                <button
                    type="button"
                    onClick={handleHelpful}
                    disabled={isPending}
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition ${isHelpful
                        ? "bg-amber-100 text-amber-700"
                        : "bg-cream/70 text-grey/60 hover:bg-amber-50 hover:text-amber-700"
                        }`}
                >
                    <Star size={13} fill={isHelpful ? "currentColor" : "none"} />
                    Util
                    {helpfulCount > 0 && <span>{helpfulCount}</span>}
                </button>
                {helpfulCount >= 3 && (
                    <span className="text-[10px] font-bold uppercase tracking-widest text-amber-600">
                        Destacada
                    </span>
                )}
            </div>
        </article>
    );
}
