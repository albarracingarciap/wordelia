"use client";

import { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/Card";
import Link from "next/link";
import { Star, MessageSquare, Quote, Heart, BookOpen, User, Users } from "lucide-react";
import { getGlobalActivityFeed, getFollowingActivityFeed, toggleActivityLike, ActivityFeedItem } from "./actions";
import { getMySavedActivityIds } from "@/app/app/guardados/actions";
import { SaveButton } from "@/components/social/SaveButton";
import { FollowingReadingStrip } from "./FollowingReadingStrip";

type FeedTab = "siguiendo" | "comunidad";

// Optional mapping for icons based on activity type
const typeToIcon = (type: string) => {
    switch (type) {
        case "review": return { icon: Star, color: "text-yellow-500", bg: "bg-yellow-500/10" };
        case "debate": return { icon: MessageSquare, color: "text-blue-500", bg: "bg-blue-500/10" };
        case "start_reading": return { icon: BookOpen, color: "text-teal", bg: "bg-teal/10" };
        case "quote": return { icon: Quote, color: "text-purple-500", bg: "bg-purple-500/10" };
        default: return { icon: BookOpen, color: "text-grey", bg: "bg-grey/10" };
    }
};

export function ActivityFeed() {
    const [feedItems, setFeedItems] = useState<ActivityFeedItem[]>([]);
    const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
    const [isLoading, setIsLoading] = useState(true);
    const [tab, setTab] = useState<FeedTab>("comunidad");

    const loadFeed = useCallback(async () => {
        setIsLoading(true);
        try {
            const [items, saved] = await Promise.all([
                tab === "siguiendo" ? getFollowingActivityFeed(15) : getGlobalActivityFeed(10),
                getMySavedActivityIds(),
            ]);
            setFeedItems(items);
            setSavedIds(new Set(saved));
        } catch (error) {
            console.error("Failed to load activity feed:", error);
        } finally {
            setIsLoading(false);
        }
    }, [tab]);

    useEffect(() => {
        loadFeed();
    }, [loadFeed]);

    const handleToggleLike = async (id: string, e: React.MouseEvent) => {
        e.preventDefault(); // Prevent triggering any potential parent link

        // Optimistic UI update
        setFeedItems(prevItems =>
            prevItems.map(item => {
                if (item.id === id) {
                    const willBeLiked = !item.isLikedByMe;
                    return {
                        ...item,
                        isLikedByMe: willBeLiked,
                        likes: item.likes + (willBeLiked ? 1 : -1)
                    };
                }
                return item;
            })
        );

        // Server update
        try {
            const result = await toggleActivityLike(id);
            if (!result.success && result.error === "Unauthorized") {
                // Ignore, or redirect to login depending on requirements
            } else if (!result.success) {
                // Revert optimistic update
                console.error("Failed to toggle like:", result.error);
                loadFeed();
            }
        } catch (error) {
            console.error("Error toggling like:", error);
        }
    };

    return (
        <Card className="bg-white border-teal/10 overflow-hidden flex flex-col h-full max-h-[500px]">
            <div className="p-2 border-b border-teal/5 bg-cream/30 sticky top-0 z-10 flex items-center gap-1">
                {(["siguiendo", "comunidad"] as FeedTab[]).map((t) => (
                    <button
                        key={t}
                        onClick={() => setTab(t)}
                        className={`flex-1 rounded-lg px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-colors ${
                            tab === t ? "bg-teal text-white" : "text-grey/50 hover:bg-teal/5 hover:text-teal"
                        }`}
                    >
                        {t === "siguiendo" ? "Siguiendo" : "Comunidad"}
                    </button>
                ))}
            </div>

            {tab === "siguiendo" && <FollowingReadingStrip />}

            <div className="overflow-y-auto custom-scrollbar flex-1 p-0">
                {isLoading ? (
                    <div className="p-8 text-center text-sm text-grey/50">Cargando actividad...</div>
                ) : feedItems.length === 0 ? (
                    tab === "siguiendo" ? (
                        <div className="p-8 text-center text-sm text-grey/50">
                            <Users className="mx-auto mb-2 h-6 w-6 opacity-40" />
                            Sigue a lectores para ver aquí lo que leen y reseñan.
                        </div>
                    ) : (
                        <div className="p-8 text-center text-sm text-grey/50">
                            La comunidad está muy tranquila ahora mismo.<br />
                            ¡Sé el primero en compartir algo!
                        </div>
                    )
                ) : (
                    <div className="divide-y divide-teal/5">
                        {feedItems.map((item) => {
                            const { icon: Icon, color, bg } = typeToIcon(item.type);

                            return (
                                <div key={item.id} className="p-4 hover:bg-cream/20 transition-colors group cursor-pointer">
                                    <div className="flex gap-3">
                                        {/* Avatar/Icon logic */}
                                        <div className={`shrink-0 w-8 h-8 rounded-full ${bg} flex items-center justify-center`}>
                                            <Icon className={`w-4 h-4 ${color}`} />
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            {/* Header: User + Action */}
                                            <p className="text-sm text-grey-dark leading-tight">
                                                <span className="font-semibold text-teal-dark flex items-center gap-1 inline-flex">
                                                    {item.user.avatar ? (
                                                        <img src={item.user.avatar} alt="" className="w-4 h-4 rounded-full" />
                                                    ) : (
                                                        <User className="w-3 h-3 opacity-50" />
                                                    )}
                                                    {item.user.name}
                                                </span>
                                                {" "}
                                                <span className="text-grey/70">{item.content}</span>
                                            </p>

                                            {/* Optional Subtext (quote, snippet, etc) */}
                                            {item.subtext && (
                                                <p className="mt-1.5 text-xs text-grey italic line-clamp-2 border-l-2 border-teal/20 pl-2">
                                                    {item.subtext}
                                                </p>
                                            )}

                                            {/* Footer: Time + Interactions */}
                                            <div className="mt-2 flex items-center justify-between">
                                                <span className="text-[10px] text-grey/40">{item.time}</span>

                                                <div className="flex items-center gap-1">
                                                    {["review", "note", "club_post"].includes(item.type) && (
                                                        <SaveButton itemType="activity" itemId={item.id} initialSaved={savedIds.has(item.id)} />
                                                    )}
                                                    <button
                                                        onClick={(e) => handleToggleLike(item.id, e)}
                                                        className={`flex items-center gap-1 text-[11px] font-medium transition-colors px-2 py-1 rounded-full ${item.isLikedByMe
                                                            ? "text-red-500 bg-red-50"
                                                            : "text-grey/40 hover:text-red-500 hover:bg-red-50/50"
                                                            }`}
                                                    >
                                                        <Heart className={`w-3 h-3 ${item.isLikedByMe ? "fill-current" : ""}`} />
                                                        <span>{item.likes}</span>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            <div className="p-3 border-t border-teal/5 text-center bg-cream/10">
                <Link href="/app/comunidad" className="text-[11px] font-semibold text-teal hover:text-teal-dark uppercase tracking-widest transition-colors block w-full">
                    Ver más actividad
                </Link>
            </div>
        </Card>
    );
}
