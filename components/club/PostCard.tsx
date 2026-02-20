import * as React from "react";
import { SpoilerGuard } from "./SpoilerGuard";
import { Trash2, Heart, MessageCircle, X } from "lucide-react";
import { createReply, toggleLike, deletePost } from "@/app/app/clubs/[id]/actions";
import { useParams, useRouter } from "next/navigation";

interface ReplyData {
    id: string;
    content: string;
    date: string;
    author: { name: string; avatar?: string };
    likesCount: number;
    isLiked: boolean;
    spoilerLevel?: "none" | "mild" | "strict";
    isAuthor?: boolean;
}

interface PostCardProps {
    id: string;
    author: { name: string; avatar?: string };
    date: string;
    content: string;
    spoilerLevel?: "none" | "mild" | "strict";
    repliesCount?: number;
    replies?: ReplyData[];
    likesCount?: number;
    isLiked?: boolean;
    isAnnouncement?: boolean;
    checkpointLabel?: string;
    globalShowSpoilers?: boolean;
    onLike?: () => void;
    onDelete?: () => void;
}

export function PostCard({
    id,
    author,
    date,
    content,
    spoilerLevel = "none",
    repliesCount = 0,
    replies = [],
    likesCount = 0,
    isLiked = false,
    isAnnouncement = false,
    checkpointLabel,
    globalShowSpoilers = false,
    onLike,
    onDelete
}: PostCardProps) {
    const params = useParams();
    const router = useRouter();
    const clubId = params.id as string;

    const [showReplies, setShowReplies] = React.useState(false);
    const [showReplyForm, setShowReplyForm] = React.useState(false);
    const [replyContent, setReplyContent] = React.useState("");
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const [localReplies, setLocalReplies] = React.useState<ReplyData[]>(replies);

    const effectiveSpoilerLevel = globalShowSpoilers ? "none" : spoilerLevel;

    const handleSubmitReply = async () => {
        if (!replyContent.trim()) return;
        setIsSubmitting(true);
        const result = await createReply(clubId, id, replyContent.trim());
        if (result?.error) {
            alert("Error: " + result.error);
        } else {
            // Optimistic update
            setLocalReplies(prev => [...prev, {
                id: Math.random().toString(),
                content: replyContent.trim(),
                date: new Date().toLocaleDateString(),
                author: { name: "Yo" },
                likesCount: 0,
                isLiked: false,
                isAuthor: true,
            }]);
            setReplyContent("");
            setShowReplyForm(false);
            setShowReplies(true);
            router.refresh();
        }
        setIsSubmitting(false);
    };

    const handleDeleteReply = async (replyId: string) => {
        if (!confirm("¿Eliminar esta respuesta?")) return;
        const result = await deletePost(replyId);
        if (result?.success) {
            setLocalReplies(prev => prev.filter(r => r.id !== replyId));
            router.refresh();
        }
    };

    const totalReplies = localReplies.length;

    return (
        <div className={`p-4 rounded-xl border ${isAnnouncement ? 'bg-teal/5 border-teal/20' : 'bg-white border-black/5'}`}>
            {/* Header */}
            <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-cream-dark overflow-hidden relative shrink-0">
                        {author.avatar ? (
                            <img src={author.avatar} alt={author.name} className="object-cover w-full h-full" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-xs font-bold text-grey/40 uppercase">{author.name[0]}</div>
                        )}
                    </div>
                    <div>
                        <div className="text-sm font-bold text-grey-dark flex items-center gap-2">
                            {author.name}
                            {isAnnouncement && <span className="text-[10px] bg-teal text-white px-1.5 py-0.5 rounded font-medium">MOD</span>}
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] text-grey/50">{date}</span>
                            {checkpointLabel && (
                                <span className="text-[10px] bg-teal/10 text-teal px-1.5 py-0.5 rounded-full font-medium">
                                    📍 {checkpointLabel}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {onDelete && (
                    <button onClick={onDelete} className="text-grey/30 hover:text-coral transition-colors p-1" title="Eliminar">
                        <Trash2 size={14} />
                    </button>
                )}
            </div>

            {/* Content */}
            <div className="pl-10">
                <SpoilerGuard level={effectiveSpoilerLevel as any} className="text-sm text-grey leading-relaxed">
                    <p>{content}</p>
                </SpoilerGuard>

                {/* Actions */}
                <div className="flex items-center gap-4 mt-3">
                    <button
                        onClick={onLike}
                        className={`flex items-center gap-1.5 text-xs transition-colors ${isLiked ? 'text-coral' : 'text-grey/60 hover:text-coral'}`}
                    >
                        <Heart size={16} className={isLiked ? "fill-current" : ""} />
                        {likesCount > 0 && <span>{likesCount}</span>}
                    </button>

                    <button
                        onClick={() => { setShowReplyForm(v => !v); setShowReplies(true); }}
                        className="flex items-center gap-1.5 text-xs text-grey/60 hover:text-teal transition-colors"
                    >
                        <MessageCircle size={16} />
                        <span>{totalReplies > 0 ? `${totalReplies} respuesta${totalReplies > 1 ? 's' : ''}` : 'Responder'}</span>
                    </button>

                    {totalReplies > 0 && !showReplies && (
                        <button
                            onClick={() => setShowReplies(true)}
                            className="text-xs text-teal/70 hover:text-teal transition-colors"
                        >
                            Ver respuestas
                        </button>
                    )}
                </div>

                {/* Reply form */}
                {showReplyForm && (
                    <div className="mt-3 flex gap-2 items-start">
                        <textarea
                            className="flex-1 text-xs bg-grey/5 border border-grey/10 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-1 focus:ring-teal/30 placeholder:text-grey/40"
                            placeholder="Escribe una respuesta..."
                            value={replyContent}
                            onChange={(e) => setReplyContent(e.target.value)}
                            rows={2}
                            autoFocus
                            onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSubmitReply(); }}
                        />
                        <div className="flex flex-col gap-1">
                            <button
                                onClick={handleSubmitReply}
                                disabled={!replyContent.trim() || isSubmitting}
                                className="text-xs bg-teal text-white px-3 py-1.5 rounded-lg disabled:opacity-40 hover:bg-teal-dark transition-colors"
                            >
                                {isSubmitting ? "..." : "Enviar"}
                            </button>
                            <button
                                onClick={() => { setShowReplyForm(false); setReplyContent(""); }}
                                className="text-xs text-grey/50 hover:text-grey px-3 py-1.5"
                            >
                                <X size={14} />
                            </button>
                        </div>
                    </div>
                )}

                {/* Replies list */}
                {showReplies && totalReplies > 0 && (
                    <div className="mt-3 space-y-2 border-l-2 border-grey/10 pl-3">
                        {localReplies.map(reply => (
                            <div key={reply.id} className="text-xs">
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-1.5 mb-1">
                                        <div className="w-5 h-5 rounded-full bg-cream-dark overflow-hidden shrink-0">
                                            {reply.author.avatar ? (
                                                <img src={reply.author.avatar} alt={reply.author.name} className="object-cover w-full h-full" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-[8px] font-bold text-grey/40 uppercase">{reply.author.name[0]}</div>
                                            )}
                                        </div>
                                        <span className="font-bold text-grey-dark">{reply.author.name}</span>
                                        <span className="text-grey/40">{reply.date}</span>
                                    </div>
                                    {reply.isAuthor && (
                                        <button onClick={() => handleDeleteReply(reply.id)} className="text-grey/30 hover:text-coral transition-colors p-0.5">
                                            <Trash2 size={11} />
                                        </button>
                                    )}
                                </div>
                                <SpoilerGuard level={(globalShowSpoilers ? "none" : reply.spoilerLevel) as any} className="text-grey/80 leading-relaxed pl-6">
                                    <p>{reply.content}</p>
                                </SpoilerGuard>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
