"use client";

import * as React from "react";
import { Button } from "../ui/Button";
import { PostCard } from "./PostCard";
import { Chip } from "../ui/Chip";
import { Switch } from "@/components/ui/Switch";
import { getClubPosts, createPost, toggleLike, deletePost, getClubCheckpoints } from "@/app/app/clubs/[id]/actions";
import { useParams, useRouter } from "next/navigation";
import { Avatar } from "@/components/ui/Avatar";

type Checkpoint = { id: string; title: string; start: string; end: string; date?: string };

export function ClubFeed() {
    const params = useParams();
    const router = useRouter();
    const clubId = params.id as string;

    const [posts, setPosts] = React.useState<any[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [showSpoilers, setShowSpoilers] = React.useState(false);
    const [newPostContent, setNewPostContent] = React.useState("");
    const [isPosting, setIsPosting] = React.useState(false);
    const [isSpoilerPost, setIsSpoilerPost] = React.useState(false);
    const [isAnnouncementPost, setIsAnnouncementPost] = React.useState(false);
    const [filter, setFilter] = React.useState<'all' | 'checkpoints' | 'announcements'>('all');

    // Checkpoints
    const [checkpoints, setCheckpoints] = React.useState<Checkpoint[]>([]);
    const [selectedCheckpointId, setSelectedCheckpointId] = React.useState<string>("");

    // Fetch posts
    const loadPosts = React.useCallback(async () => {
        setIsLoading(true);
        const data = await getClubPosts(clubId);
        setPosts(data);
        setIsLoading(false);
    }, [clubId]);

    React.useEffect(() => {
        loadPosts();
        getClubCheckpoints(clubId).then(setCheckpoints);
    }, [loadPosts, clubId]);

    const handleCreatePost = async () => {
        if (!newPostContent.trim()) return;
        setIsPosting(true);

        // Find checkpoint index (1-based position in array) by matching id
        let checkpointIndex: number | undefined = undefined;
        if (selectedCheckpointId) {
            const idx = checkpoints.findIndex(c => c.id === selectedCheckpointId);
            if (idx !== -1) checkpointIndex = idx + 1;
        }

        const result = await createPost(clubId, newPostContent, isSpoilerPost, checkpointIndex, isAnnouncementPost);

        if (result?.error) {
            alert("Error: " + result.error);
        } else {
            setNewPostContent("");
            setIsSpoilerPost(false);
            setIsAnnouncementPost(false);
            setSelectedCheckpointId("");
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
                    likesCount: p.isLiked ? p.likesCount - 1 : p.likesCount + 1
                };
            }
            return p;
        }));
        await toggleLike(postId);
        router.refresh();
    };

    const handleDelete = async (postId: string) => {
        if (!confirm("¿Eliminar este comentario?")) return;
        const result = await deletePost(postId);
        if (result?.success) {
            setPosts(current => current.filter(p => p.id !== postId));
            router.refresh();
        } else {
            alert("No se pudo eliminar.");
        }
    };

    const filteredPosts = posts.filter(post => {
        if (filter === 'announcements') return post.isAnnouncement;
        if (filter === 'checkpoints') return post.checkpointIndex != null;
        return true;
    });

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex gap-2">
                    <Chip label="Todo" active={filter === 'all'} onClick={() => setFilter('all')} />
                    <Chip label="Checkpoints" active={filter === 'checkpoints'} onClick={() => setFilter('checkpoints')} />
                    <Chip label="Anuncios" active={filter === 'announcements'} onClick={() => setFilter('announcements')} />
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-xs text-grey/60">Mostrar spoilers</span>
                    <Switch checked={showSpoilers} onCheckedChange={setShowSpoilers} />
                </div>
            </div>

            {/* Create Post Input */}
            <div className="bg-white p-4 rounded-xl border border-black/5 shadow-sm space-y-3">
                <div className="flex gap-4">
                    <Avatar fallback="YO" className="w-8 h-8 text-xs bg-teal/10 text-teal" />
                    <textarea
                        className="flex-1 bg-transparent border-none resize-none focus:ring-0 text-sm placeholder:text-grey/40 min-h-[60px]"
                        placeholder="Comparte una idea, una pregunta o una sensación..."
                        value={newPostContent}
                        onChange={(e) => setNewPostContent(e.target.value)}
                    />
                </div>

                {/* Checkpoint selector */}
                <div className="border-t border-grey/5 pt-2">
                    {checkpoints.length === 0 ? (
                        <p className="text-xs text-grey/40 italic">No se han definido checkpoints para este libro.</p>
                    ) : (
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-grey/60 shrink-0">Checkpoint:</span>
                            <select
                                value={selectedCheckpointId}
                                onChange={(e) => setSelectedCheckpointId(e.target.value)}
                                className="text-xs text-grey/80 bg-transparent border border-grey/20 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-teal/30 cursor-pointer"
                            >
                                <option value="">Sin checkpoint</option>
                                {checkpoints.map((chk, idx) => (
                                    <option key={chk.id} value={chk.id}>
                                        #{idx + 1} – {chk.title}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>

                <div className="flex justify-between items-center pt-1 border-t border-grey/5">
                    <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2 cursor-pointer text-xs text-grey/60 hover:text-grey-dark">
                            <input
                                type="checkbox"
                                checked={isSpoilerPost}
                                onChange={(e) => setIsSpoilerPost(e.target.checked)}
                                className="rounded text-teal focus:ring-teal/20"
                            />
                            Contiene spoilers
                        </label>

                        <label className="flex items-center gap-2 cursor-pointer text-xs text-grey/60 hover:text-grey-dark">
                            <input
                                type="checkbox"
                                checked={isAnnouncementPost}
                                onChange={(e) => setIsAnnouncementPost(e.target.checked)}
                                className="rounded text-teal focus:ring-teal/20"
                            />
                            Es Anuncio
                        </label>
                    </div>
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleCreatePost}
                        disabled={!newPostContent.trim() || isPosting}
                    >
                        {isPosting ? "Publicando..." : "Publicar"}
                    </Button>
                </div>
            </div>

            <div className="space-y-4">
                {isLoading ? (
                    <div className="text-center py-8 text-grey/40 text-sm">Cargando conversación...</div>
                ) : filteredPosts.length > 0 ? (
                    filteredPosts.map(post => {
                        const checkpointLabel = post.checkpointIndex != null
                            ? checkpoints[post.checkpointIndex - 1]?.title
                                ? `#${post.checkpointIndex} – ${checkpoints[post.checkpointIndex - 1].title}`
                                : `Checkpoint ${post.checkpointIndex}`
                            : undefined;
                        return (
                            <PostCard
                                key={post.id}
                                {...post}
                                checkpointLabel={checkpointLabel}
                                globalShowSpoilers={showSpoilers}
                                onLike={() => handleLike(post.id)}
                                onDelete={post.isAuthor || post.isAnnouncement ? () => handleDelete(post.id) : undefined}
                            />
                        );
                    })
                ) : (
                    <div className="text-center py-8 text-grey/40 text-sm">
                        {filter === 'checkpoints' ? 'No hay posts vinculados a checkpoints.' :
                            filter === 'announcements' ? 'No hay anuncios.' :
                                'Sé el primero en comentar.'}
                    </div>
                )}
            </div>
        </div>
    );
}
