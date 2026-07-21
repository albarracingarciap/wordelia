"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { Card } from "@/components/ui/Card";
import { MessageSquare, Star, BookOpen, Quote, Heart } from "lucide-react";
import { getGlobalActivityFeed, toggleActivityLike, ActivityFeedItem } from "@/components/dashboard/actions";
import { getMySavedActivityIds } from "@/app/app/guardados/actions";
import { SaveButton } from "@/components/social/SaveButton";
import { getHelpfulCommunityReviews, getRecentCommunityReviews, type ReviewWithBook } from "@/app/app/mi-lectura/actions";
import { ReviewCard } from "@/components/reviews/ReviewCard";
import { PeopleDiscover } from "@/components/social/PeopleDiscover";
import Link from "next/link";

const ICONS = {
    review: Star,
    debate: MessageSquare,
    club_post: MessageSquare,
    start_reading: BookOpen,
    quote: Quote,
    note: Quote,
};

const COLORS = {
    review: { bg: "bg-amber-100", text: "text-amber-600" },
    debate: { bg: "bg-blue-100", text: "text-blue-600" },
    club_post: { bg: "bg-indigo-100", text: "text-indigo-600" },
    start_reading: { bg: "bg-teal/20", text: "text-teal-dark" },
    quote: { bg: "bg-purple-100", text: "text-purple-600" },
    note: { bg: "bg-purple-100", text: "text-purple-600" },
};

export function ComunidadClient() {
    const [feedItems, setFeedItems] = useState<ActivityFeedItem[]>([]);
    const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
    const [recentReviews, setRecentReviews] = useState<ReviewWithBook[]>([]);
    const [helpfulReviews, setHelpfulReviews] = useState<ReviewWithBook[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingReviews, setIsLoadingReviews] = useState(true);

    useEffect(() => {
        const loadFeed = async () => {
            try {
                const [items, reviews, helpful, saved] = await Promise.all([
                    getGlobalActivityFeed(30),
                    getRecentCommunityReviews(4),
                    getHelpfulCommunityReviews(4),
                    getMySavedActivityIds(),
                ]);
                setFeedItems(items);
                setSavedIds(new Set(saved));
                setRecentReviews(reviews);
                setHelpfulReviews(helpful);
            } catch (error) {
                console.error("Failed to load activity feed:", error);
            } finally {
                setIsLoading(false);
                setIsLoadingReviews(false);
            }
        };

        loadFeed();
    }, []);

    const handleToggleLike = async (id: string, e: React.MouseEvent) => {
        e.preventDefault(); // Prevent triggering parent links if any

        // Optimistic UI update
        const originalItems = [...feedItems];
        setFeedItems(currentItems =>
            currentItems.map(item => {
                if (item.id === id) {
                    const isNowLiked = !item.isLikedByMe;
                    return {
                        ...item,
                        isLikedByMe: isNowLiked,
                        likes: isNowLiked ? item.likes + 1 : Math.max(0, item.likes - 1)
                    };
                }
                return item;
            })
        );

        // Server update
        try {
            const result = await toggleActivityLike(id);
            if (!result.success) {
                // Revert on failure
                setFeedItems(originalItems);
                console.error("Failed to toggle like:", result.error);
            }
        } catch (error) {
            // Revert on failure
            setFeedItems(originalItems);
            console.error("Error toggling like:", error);
        }
    };

    return (
        <main className="mx-auto max-w-5xl px-4 py-8 animate-fade-in sm:px-6 lg:px-8">
            <div className="mb-8">
                <h1 className="text-3xl font-serif text-teal-dark mb-2 tracking-tight">Comunidad Wordelia</h1>
                <p className="text-grey/80">Descubre qué están leyendo, opinando y guardando otros lectores.</p>
            </div>

            <section className="mb-8">
                <PeopleDiscover />
            </section>

            <section className="mb-8">
                <div className="mb-3 flex items-center justify-between gap-4">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-grey/45">Reviews</p>
                        <h2 className="font-serif text-2xl text-teal-dark">Opiniones recientes</h2>
                    </div>
                    <Link href="/app/explorar" className="text-sm font-bold text-teal transition hover:text-teal-dark">
                        Explorar libros
                    </Link>
                </div>

                {isLoadingReviews ? (
                    <div className="grid gap-3 md:grid-cols-2">
                        {[1, 2].map((item) => (
                            <div key={item} className="h-56 animate-pulse rounded-2xl bg-white" />
                        ))}
                    </div>
                ) : recentReviews.length > 0 ? (
                    <div className="grid gap-3 md:grid-cols-2">
                        {recentReviews.map((review) => (
                            <ReviewCard key={review.id} review={review} showBook compact />
                        ))}
                    </div>
                ) : (
                    <Card className="border-dashed border-teal/15 bg-white/60 p-6 text-center">
                        <Star className="mx-auto h-10 w-10 text-teal/20" />
                        <p className="mt-3 text-sm font-medium text-grey/60">Aun no hay reviews recientes.</p>
                    </Card>
                )}
            </section>

            <section className="mb-8">
                <div className="mb-3 flex items-center justify-between gap-4">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-grey/45">Reputacion</p>
                        <h2 className="font-serif text-2xl text-teal-dark">Reviews utiles para decidir</h2>
                    </div>
                </div>

                {isLoadingReviews ? (
                    <div className="grid gap-3 md:grid-cols-2">
                        {[1, 2].map((item) => (
                            <div key={item} className="h-56 animate-pulse rounded-2xl bg-white" />
                        ))}
                    </div>
                ) : helpfulReviews.length > 0 ? (
                    <div className="grid gap-3 md:grid-cols-2">
                        {helpfulReviews.map((review) => (
                            <ReviewCard key={`helpful-${review.id}`} review={review} showBook compact />
                        ))}
                    </div>
                ) : (
                    <Card className="border-dashed border-teal/15 bg-white/60 p-6 text-center">
                        <Star className="mx-auto h-10 w-10 text-teal/20" />
                        <p className="mt-3 text-sm font-medium text-grey/60">Marca reviews como utiles y apareceran aqui.</p>
                    </Card>
                )}
            </section>

            <Card className="p-0 overflow-hidden shadow-sm">
                {isLoading ? (
                    <div className="flex flex-col p-6 gap-6">
                        {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} className="animate-pulse flex gap-4 pb-6 border-b border-teal/10 last:border-0 last:pb-0">
                                <div className="w-10 h-10 bg-teal/10 rounded-full shrink-0"></div>
                                <div className="flex-1 space-y-3 py-1">
                                    <div className="h-4 bg-teal/10 rounded w-3/4"></div>
                                    <div className="h-3 bg-teal/5 rounded w-1/2"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : feedItems.length === 0 ? (
                    <div className="text-center py-16">
                        <MessageSquare className="w-12 h-12 text-teal/20 mx-auto mb-4" />
                        <p className="text-grey/60 font-medium">La comunidad está muy tranquila ahora mismo.</p>
                        <p className="text-sm text-grey/40 mt-1">¡Sé el primero en compartir algo!</p>
                    </div>
                ) : (
                    <div className="flex flex-col divide-y divide-teal/5">
                        {feedItems.map((item) => {
                            const Icon = ICONS[item.type as keyof typeof ICONS] || MessageSquare;
                            const colors = COLORS[item.type as keyof typeof COLORS] || { bg: "bg-grey/10", text: "text-grey" };

                            // Determine if content is note-like or quote-like to render with quotes
                            const isQuote = item.type === 'note' || item.type === 'quote';

                            return (
                                <div key={item.id} className="p-6 hover:bg-teal/5 transition-colors">
                                    <div className="flex gap-4">
                                        {/* Avatar/Icon Logic */}
                                        <div className="relative shrink-0 mt-1">
                                            {item.user.avatar ? (
                                                <Image src={item.user.avatar} alt="" width={44} height={44} className="h-11 w-11 rounded-full border-2 border-white object-cover shadow-sm" />
                                            ) : (
                                                <div className="w-11 h-11 rounded-full bg-cream flex items-center justify-center border-2 border-white shadow-sm">
                                                    <span className="text-teal-dark text-lg font-serif font-medium">
                                                        {item.user.name.charAt(0).toUpperCase()}
                                                    </span>
                                                </div>
                                            )}
                                            {/* Action Badge */}
                                            <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full ${colors.bg} flex items-center justify-center border-2 border-white shadow-sm`}>
                                                <Icon className={`w-3 h-3 flex-shrink-0 ${colors.text}`} />
                                            </div>
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            {/* Header */}
                                            <div className="flex justify-between items-start gap-2 mb-1.5">
                                                <p className="text-base text-grey-dark leading-snug">
                                                    <span className="font-semibold text-teal-dark">{item.user.name}</span>
                                                    {" "}
                                                    <span className="text-grey">{item.content}</span>
                                                </p>
                                            </div>

                                            {/* Subtext (The "Meat" of the post) */}
                                            {item.subtext && (
                                                <div className="mt-2.5 mb-3 text-sm text-grey-dark bg-white font-serif tracking-wide border border-teal/10 rounded-xl p-4 shadow-sm relative overflow-hidden group">
                                                    {isQuote && (
                                                        <Quote className="absolute top-2 left-2 w-8 h-8 text-teal/5 -rotate-12 select-none" />
                                                    )}
                                                    <div className="relative z-10 leading-relaxed">
                                                        {isQuote ? `"${item.subtext.replace(/^"|"$/g, '')}"` : item.subtext}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Actions & Footer */}
                                            <div className="mt-3 flex items-center justify-between border-t border-teal/5 pt-3">
                                                <div className="flex items-center gap-4">
                                                    <button
                                                        onClick={(e) => handleToggleLike(item.id, e)}
                                                        className={`group flex items-center gap-1.5 text-sm font-medium transition-all ${item.isLikedByMe
                                                                ? "text-red-500"
                                                                : "text-grey/60 hover:text-red-500"
                                                            }`}
                                                    >
                                                        <div className={`p-1.5 rounded-full transition-colors ${item.isLikedByMe ? "bg-red-50" : "group-hover:bg-red-50/50"}`}>
                                                            <Heart className={`w-4 h-4 ${item.isLikedByMe ? "fill-current" : ""}`} />
                                                        </div>
                                                        <span className="min-w-4">{item.likes > 0 ? item.likes : ''}</span>
                                                    </button>

                                                    {["review", "note", "club_post"].includes(item.type) && (
                                                        <SaveButton itemType="activity" itemId={item.id} initialSaved={savedIds.has(item.id)} />
                                                    )}

                                                    {/* Context Links based on metadata */}
                                                    {item.metadata?.book_id && (
                                                        <Link
                                                            href={`/app/libros/${item.metadata.book_id}`}
                                                            className="text-xs font-semibold uppercase tracking-widest text-teal hover:text-teal-dark transition-colors px-3 py-1.5 rounded-full bg-teal/5 hover:bg-teal/10"
                                                        >
                                                            Ver libro
                                                        </Link>
                                                    )}
                                                    {item.metadata?.club_id && (
                                                        <Link
                                                            href={`/app/clubs/${item.metadata.club_id}`}
                                                            className="text-xs font-semibold uppercase tracking-widest text-indigo-600 hover:text-indigo-800 transition-colors px-3 py-1.5 rounded-full bg-indigo-50 hover:bg-indigo-100"
                                                        >
                                                            Ir al club
                                                        </Link>
                                                    )}
                                                </div>
                                                <span className="text-xs font-medium text-grey/40">{item.time}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </Card>
        </main>
    );
}
