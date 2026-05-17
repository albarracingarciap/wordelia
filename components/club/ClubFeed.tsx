"use client";

import * as React from "react";
import { Button } from "../ui/Button";
import { PostCard } from "./PostCard";
import { Switch } from "@/components/ui/Switch";
import {
    getClubPosts,
    createPost,
    toggleLike,
    deletePost,
    getClubCheckpoints,
    getMyClubBookProgress,
} from "@/app/app/clubs/[id]/actions";
import { useParams, useRouter } from "next/navigation";
import { Avatar } from "@/components/ui/Avatar";
import { BookOpen, Lock, Megaphone, MessageCircle, Unlock } from "lucide-react";

type Checkpoint = { id: string; title: string; start: string; end: string; date?: string; questions?: string[] };
type FeedArea = "general" | "announcements" | `checkpoint-${number}`;
const EMPTY_CHECKPOINTS: Checkpoint[] = [];

interface ClubFeedProps {
    isAdminOrMod?: boolean;
    checkpoints?: Checkpoint[];
    currentBookId?: string | null;
    targetCheckpointNumber?: number | null;
}

type ClubPost = React.ComponentProps<typeof PostCard> & {
    checkpointIndex?: number | null;
    isAuthor?: boolean;
};

function parseNumber(value?: string | null) {
    const match = String(value || "").match(/\d+/);
    return match ? Number.parseInt(match[0], 10) : null;
}

function getFallbackCheckpoint(checkpoints: Checkpoint[]) {
    if (checkpoints.length === 0) return 0;

    const dated = checkpoints
        .map((checkpoint, index) => ({ checkpoint, index }))
        .filter(({ checkpoint }) => checkpoint.date);

    if (dated.length === 0) return 1;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const next = dated.find(({ checkpoint }) => {
        const date = new Date(checkpoint.date as string);
        date.setHours(0, 0, 0, 0);
        return date >= today;
    });

    return (next?.index ?? dated[dated.length - 1].index) + 1;
}

function getAllowedCheckpoint(checkpoints: Checkpoint[], currentPage?: number | null) {
    if (checkpoints.length === 0) return 0;
    if (!currentPage || currentPage <= 0) return getFallbackCheckpoint(checkpoints);

    let allowed = 0;

    checkpoints.forEach((checkpoint, index) => {
        const start = parseNumber(checkpoint.start);
        const end = parseNumber(checkpoint.end);

        if ((end && currentPage >= end) || (start && currentPage >= start)) {
            allowed = index + 1;
        }
    });

    return Math.max(allowed, 1);
}

function getCheckpointNumber(area: FeedArea) {
    if (!area.startsWith("checkpoint-")) return null;
    const value = Number.parseInt(area.replace("checkpoint-", ""), 10);
    return Number.isFinite(value) ? value : null;
}

export function ClubFeed({
    isAdminOrMod = false,
    checkpoints: initialCheckpoints = EMPTY_CHECKPOINTS,
    currentBookId,
    targetCheckpointNumber,
}: ClubFeedProps) {
    const params = useParams();
    const router = useRouter();
    const clubId = params.id as string;

    const [posts, setPosts] = React.useState<ClubPost[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [showSpoilers, setShowSpoilers] = React.useState(false);
    const [newPostContent, setNewPostContent] = React.useState("");
    const [isPosting, setIsPosting] = React.useState(false);
    const [isSpoilerPost, setIsSpoilerPost] = React.useState(false);
    const [isAnnouncementPost, setIsAnnouncementPost] = React.useState(false);
    const [activeArea, setActiveArea] = React.useState<FeedArea>("general");
    const [checkpoints, setCheckpoints] = React.useState<Checkpoint[]>(initialCheckpoints);
    const [currentPage, setCurrentPage] = React.useState<number | null>(null);
    const [unlockedCheckpoints, setUnlockedCheckpoints] = React.useState<Set<number>>(new Set());

    const storageKey = React.useMemo(() => `wordelia:club:${clubId}:spoiler-unlocks`, [clubId]);
    const selectedCheckpointNumber = getCheckpointNumber(activeArea);
    const allowedCheckpoint = React.useMemo(
        () => getAllowedCheckpoint(checkpoints, currentPage),
        [checkpoints, currentPage]
    );
    const selectedCheckpoint = selectedCheckpointNumber ? checkpoints[selectedCheckpointNumber - 1] : null;
    const isFutureCheckpoint =
        selectedCheckpointNumber != null &&
        selectedCheckpointNumber > allowedCheckpoint &&
        !unlockedCheckpoints.has(selectedCheckpointNumber);
    const isAnnouncementArea = activeArea === "announcements";
    const canPostInArea = !isFutureCheckpoint && (!isAnnouncementArea || isAdminOrMod);

    const loadPosts = React.useCallback(async () => {
        setIsLoading(true);
        const data = await getClubPosts(clubId);
        setPosts(data as ClubPost[]);
        setIsLoading(false);
    }, [clubId]);

    React.useEffect(() => {
        loadPosts();
    }, [loadPosts]);

    React.useEffect(() => {
        if (initialCheckpoints.length > 0) {
            setCheckpoints(initialCheckpoints);
            return;
        }

        getClubCheckpoints(clubId).then(setCheckpoints);
    }, [clubId, initialCheckpoints]);

    React.useEffect(() => {
        getMyClubBookProgress(currentBookId).then((progress) => {
            setCurrentPage(progress?.currentPage ?? null);
        });
    }, [currentBookId]);

    React.useEffect(() => {
        if (!targetCheckpointNumber || targetCheckpointNumber < 1) return;
        setActiveArea(`checkpoint-${targetCheckpointNumber}` as FeedArea);
    }, [targetCheckpointNumber]);

    React.useEffect(() => {
        try {
            const raw = window.localStorage.getItem(storageKey);
            const values = raw ? JSON.parse(raw) : [];
            if (Array.isArray(values)) {
                setUnlockedCheckpoints(new Set(values.filter((value) => Number.isFinite(value))));
            }
        } catch {
            setUnlockedCheckpoints(new Set());
        }
    }, [storageKey]);

    const unlockCheckpoint = (checkpointNumber: number) => {
        setUnlockedCheckpoints((current) => {
            const next = new Set(current);
            next.add(checkpointNumber);
            window.localStorage.setItem(storageKey, JSON.stringify(Array.from(next)));
            return next;
        });
    };

    const handleCreatePost = async () => {
        if (!newPostContent.trim() || !canPostInArea) return;
        setIsPosting(true);

        const checkpointIndex = selectedCheckpointNumber ?? undefined;
        const postAsAnnouncement = isAnnouncementArea || isAnnouncementPost;
        const result = await createPost(clubId, newPostContent, isSpoilerPost, checkpointIndex, postAsAnnouncement);

        if (result?.error) {
            alert("Error: " + result.error);
        } else {
            setNewPostContent("");
            setIsSpoilerPost(false);
            setIsAnnouncementPost(false);
            loadPosts();
            router.refresh();
        }
        setIsPosting(false);
    };

    const handleLike = async (postId: string) => {
        setPosts(current => current.map(p => {
            if (p.id === postId) {
                return {
                    ...p,
                    isLiked: !p.isLiked,
                    likesCount: p.isLiked ? (p.likesCount || 0) - 1 : (p.likesCount || 0) + 1
                };
            }
            return p;
        }));
        await toggleLike(postId);
        router.refresh();
    };

    const handleDelete = async (postId: string) => {
        if (!confirm("Eliminar este comentario?")) return;
        const result = await deletePost(postId);
        if (result?.success) {
            setPosts(current => current.filter(p => p.id !== postId));
            router.refresh();
        } else {
            alert("No se pudo eliminar.");
        }
    };

    const filteredPosts = posts.filter(post => {
        if (activeArea === "announcements") return post.isAnnouncement;
        if (activeArea === "general") return !post.isAnnouncement && post.checkpointIndex == null;
        return post.checkpointIndex === selectedCheckpointNumber;
    });

    const contextLabel = activeArea === "announcements"
        ? "Avisos del club"
        : selectedCheckpointNumber
            ? `Tramo ${selectedCheckpointNumber}${selectedCheckpoint?.title ? ` - ${selectedCheckpoint.title}` : ""}`
            : "General sin spoilers";

    const emptyText = activeArea === "announcements"
        ? "No hay avisos todavía."
        : selectedCheckpointNumber
            ? "Aun no hay conversacion en este tramo."
            : "Abre una conversacion sin spoilers para todo el club.";

    const handleUseQuestion = (question: string) => {
        setNewPostContent((current) => {
            const prefix = `Pregunta: ${question}\n\n`;
            return current.trim() ? `${current}\n\n${prefix}` : prefix;
        });
        setIsSpoilerPost(true);
    };

    return (
        <div className="space-y-5">
            <div className="rounded-3xl border border-black/5 bg-white p-3 shadow-sm">
                <div className="flex gap-2 overflow-x-auto pb-1">
                    <button
                        type="button"
                        onClick={() => setActiveArea("general")}
                        className={`flex shrink-0 items-center gap-2 rounded-2xl px-4 py-3 text-sm font-bold transition ${activeArea === "general"
                            ? "bg-teal text-white shadow-sm"
                            : "bg-cream/70 text-grey/70 hover:text-teal-dark"
                            }`}
                    >
                        <MessageCircle size={16} />
                        General
                    </button>

                    {checkpoints.map((checkpoint, index) => {
                        const checkpointNumber = index + 1;
                        const locked = checkpointNumber > allowedCheckpoint && !unlockedCheckpoints.has(checkpointNumber);
                        const area = `checkpoint-${checkpointNumber}` as FeedArea;

                        return (
                            <button
                                key={checkpoint.id}
                                type="button"
                                onClick={() => setActiveArea(area)}
                                className={`flex min-w-[145px] shrink-0 items-center gap-2 rounded-2xl px-4 py-3 text-left text-sm font-bold transition ${activeArea === area
                                    ? "bg-teal text-white shadow-sm"
                                    : "bg-cream/70 text-grey/70 hover:text-teal-dark"
                                    }`}
                            >
                                {locked ? <Lock size={15} /> : <BookOpen size={15} />}
                                <span className="truncate">
                                    Tramo {checkpointNumber}
                                </span>
                            </button>
                        );
                    })}

                    <button
                        type="button"
                        onClick={() => setActiveArea("announcements")}
                        className={`flex shrink-0 items-center gap-2 rounded-2xl px-4 py-3 text-sm font-bold transition ${activeArea === "announcements"
                            ? "bg-teal text-white shadow-sm"
                            : "bg-cream/70 text-grey/70 hover:text-teal-dark"
                            }`}
                    >
                        <Megaphone size={16} />
                        Avisos
                    </button>
                </div>

                <div className="mt-3 flex flex-col gap-3 border-t border-grey/10 pt-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-grey/40">Conversacion</p>
                        <p className="text-sm font-bold text-teal-dark">{contextLabel}</p>
                    </div>
                    <label className="flex items-center justify-between gap-3 text-xs font-bold text-grey/55 sm:justify-start">
                        Mostrar spoilers marcados
                        <Switch checked={showSpoilers} onCheckedChange={setShowSpoilers} />
                    </label>
                </div>
            </div>

            {isFutureCheckpoint ? (
                <div className="rounded-3xl border border-teal/10 bg-white p-6 text-center shadow-sm">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-teal/10 text-teal">
                        <Lock size={24} />
                    </div>
                    <h3 className="mt-4 text-xl font-bold text-teal-dark">Tramo protegido</h3>
                    <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-grey/65">
                        Este hilo puede contener detalles de una parte que aun no has alcanzado. Puedes desbloquearlo si quieres leer bajo tu responsabilidad.
                    </p>
                    <Button
                        type="button"
                        variant="outline"
                        className="mt-5 w-full sm:w-auto"
                        onClick={() => selectedCheckpointNumber && unlockCheckpoint(selectedCheckpointNumber)}
                    >
                        <Unlock size={16} className="mr-2" />
                        Desbloquear tramo
                    </Button>
                </div>
            ) : (
                <div className="rounded-3xl border border-black/5 bg-white p-4 shadow-sm space-y-3">
                    {selectedCheckpointNumber && (
                        <div className="rounded-3xl border border-teal/10 bg-teal/5 p-4">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-teal-dark/55">
                                        Preguntas guia
                                    </p>
                                    <h3 className="mt-1 text-base font-bold text-teal-dark">
                                        Activa la conversacion del tramo
                                    </h3>
                                </div>
                                <BookOpen size={18} className="mt-1 shrink-0 text-teal/70" />
                            </div>

                            {selectedCheckpoint?.questions?.length ? (
                                <div className="mt-3 grid gap-2">
                                    {selectedCheckpoint.questions.map((question, index) => (
                                        <button
                                            key={`${selectedCheckpoint.id}-question-${index}`}
                                            type="button"
                                            onClick={() => handleUseQuestion(question)}
                                            className="rounded-2xl border border-teal/10 bg-white px-4 py-3 text-left text-sm font-medium leading-6 text-grey/75 transition hover:border-teal/30 hover:text-teal-dark"
                                        >
                                            {question}
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <p className="mt-3 rounded-2xl bg-white px-4 py-3 text-sm leading-6 text-grey/55">
                                    Aun no hay preguntas guia para este tramo.
                                    {isAdminOrMod ? " Puedes anadirlas desde Gestionar > Plan de lectura." : ""}
                                </p>
                            )}
                        </div>
                    )}

                    <div className="flex gap-4">
                        <Avatar fallback="YO" className="w-8 h-8 text-xs bg-teal/10 text-teal" />
                        <textarea
                            className="flex-1 bg-transparent border-none resize-none focus:ring-0 text-sm placeholder:text-grey/40 min-h-[66px]"
                            placeholder={
                                activeArea === "general"
                                    ? "Comparte una idea sin spoilers para todo el club..."
                                    : activeArea === "announcements"
                                        ? "Publica un aviso para el club..."
                                        : "Comenta este tramo de lectura..."
                            }
                            value={newPostContent}
                            onChange={(e) => setNewPostContent(e.target.value)}
                            disabled={!canPostInArea}
                        />
                    </div>

                    {!canPostInArea && (
                        <p className="rounded-2xl bg-coral/5 px-3 py-2 text-xs font-medium text-coral">
                            Solo moderadores y administradores pueden publicar avisos del club.
                        </p>
                    )}

                    {selectedCheckpointNumber && (
                        <p className="rounded-2xl bg-teal/5 px-3 py-2 text-xs text-teal-dark/70">
                            Este comentario quedara asociado al tramo {selectedCheckpointNumber}. Los lectores que no hayan llegado aun veran el hilo protegido.
                        </p>
                    )}

                    <div className="flex flex-col gap-3 border-t border-grey/10 pt-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex flex-wrap items-center gap-4">
                            <label className="flex items-center gap-2 cursor-pointer text-xs text-grey/60 hover:text-grey-dark">
                                <input
                                    type="checkbox"
                                    checked={isSpoilerPost}
                                    onChange={(e) => setIsSpoilerPost(e.target.checked)}
                                    className="rounded text-teal focus:ring-teal/20"
                                />
                                Contiene spoilers
                            </label>

                            {isAdminOrMod && activeArea !== "announcements" && (
                                <label className="flex items-center gap-2 cursor-pointer text-xs text-grey/60 hover:text-grey-dark">
                                    <input
                                        type="checkbox"
                                        checked={isAnnouncementPost}
                                        onChange={(e) => setIsAnnouncementPost(e.target.checked)}
                                        className="rounded text-teal focus:ring-teal/20"
                                    />
                                    Publicar como aviso del club
                                </label>
                            )}
                        </div>
                        <Button
                            size="sm"
                            variant="primary"
                            onClick={handleCreatePost}
                            disabled={!newPostContent.trim() || isPosting || !canPostInArea}
                            className="w-full sm:w-auto"
                        >
                            {isPosting ? "Publicando..." : "Publicar"}
                        </Button>
                    </div>
                </div>
            )}

            <div className="space-y-4">
                {isLoading ? (
                    <div className="text-center py-8 text-grey/40 text-sm">Cargando conversacion...</div>
                ) : filteredPosts.length > 0 && !isFutureCheckpoint ? (
                    filteredPosts.map(post => {
                        const checkpointLabel = post.checkpointIndex != null
                            ? checkpoints[post.checkpointIndex - 1]?.title
                                ? `Tramo ${post.checkpointIndex} - ${checkpoints[post.checkpointIndex - 1].title}`
                                : `Tramo ${post.checkpointIndex}`
                            : undefined;
                        return (
                            <PostCard
                                key={post.id}
                                {...post}
                                checkpointLabel={checkpointLabel}
                                globalShowSpoilers={showSpoilers}
                                onLike={() => handleLike(post.id)}
                                onDelete={post.isAuthor || isAdminOrMod ? () => handleDelete(post.id) : undefined}
                            />
                        );
                    })
                ) : !isFutureCheckpoint ? (
                    <div className="rounded-3xl border border-dashed border-teal/15 bg-white/50 px-5 py-8 text-center text-sm text-grey/45">
                        {emptyText}
                    </div>
                ) : null}
            </div>
        </div>
    );
}
