"use client";

import * as React from "react";
import { MessageSquare, Send, Trash2, Loader2, CornerDownRight, X } from "lucide-react";
import { getActivityComments, addActivityComment, deleteActivityComment, type ActivityComment } from "@/app/app/comunidad/actions";

function Avatar({ name, avatar, size = 28 }: { name: string | null; avatar: string | null; size?: number }) {
    if (avatar) {
        // eslint-disable-next-line @next/next/no-img-element
        return <img src={avatar} alt="" width={size} height={size} className="rounded-full object-cover" style={{ width: size, height: size }} />;
    }
    return (
        <span className="flex items-center justify-center rounded-full bg-cream text-[11px] font-bold text-teal-dark" style={{ width: size, height: size }}>
            {(name || "L").charAt(0).toUpperCase()}
        </span>
    );
}

function fmt(iso: string) {
    return new Date(iso).toLocaleDateString("es-ES", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

export function CommentThread({ activityId, initialCount = 0 }: { activityId: string; initialCount?: number }) {
    const [open, setOpen] = React.useState(false);
    const [comments, setComments] = React.useState<ActivityComment[] | null>(null);
    const [count, setCount] = React.useState(initialCount);
    const [text, setText] = React.useState("");
    const [replyTo, setReplyTo] = React.useState<{ id: string; name: string | null } | null>(null);
    const [busy, setBusy] = React.useState(false);

    const toggle = async () => {
        const next = !open;
        setOpen(next);
        if (next && comments === null) {
            setComments(await getActivityComments(activityId));
        }
    };

    const submit = async () => {
        const t = text.trim();
        if (!t || busy) return;
        setBusy(true);
        const res = await addActivityComment(activityId, t, replyTo?.id ?? null);
        setBusy(false);
        if ("comment" in res) {
            setComments((prev) => [...(prev ?? []), res.comment]);
            setCount((c) => c + 1);
            setText("");
            setReplyTo(null);
        }
    };

    const remove = async (id: string) => {
        setComments((prev) => (prev ? prev.filter((c) => c.id !== id && c.parentId !== id) : prev));
        const res = await deleteActivityComment(id);
        if (!("error" in res)) setCount((c) => Math.max(0, c - 1));
    };

    const topLevel = (comments ?? []).filter((c) => !c.parentId);
    const repliesOf = (id: string) => (comments ?? []).filter((c) => c.parentId === id);

    return (
        <div className="w-full">
            <button
                onClick={toggle}
                className="flex items-center gap-1.5 rounded-full px-2 py-1 text-sm font-medium text-grey/60 transition-colors hover:bg-teal/5 hover:text-teal"
            >
                <MessageSquare className="h-4 w-4" /> {count > 0 ? count : ""} <span className="text-xs">{count === 1 ? "comentario" : count > 1 ? "comentarios" : "Comentar"}</span>
            </button>

            {open && (
                <div className="mt-3 space-y-3 border-t border-teal/5 pt-3">
                    {comments === null ? (
                        <div className="flex justify-center py-3"><Loader2 className="h-4 w-4 animate-spin text-teal" /></div>
                    ) : (
                        topLevel.map((c) => (
                            <div key={c.id} className="space-y-2">
                                <CommentRow c={c} onReply={() => setReplyTo({ id: c.id, name: c.authorName })} onDelete={() => remove(c.id)} />
                                {repliesOf(c.id).length > 0 && (
                                    <div className="ml-8 space-y-2 border-l border-teal/10 pl-3">
                                        {repliesOf(c.id).map((r) => (
                                            <CommentRow key={r.id} c={r} small onDelete={() => remove(r.id)} />
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                    {comments !== null && topLevel.length === 0 && (
                        <p className="text-xs italic text-grey/40">Sé el primero en comentar.</p>
                    )}

                    {/* Input */}
                    <div className="pt-1">
                        {replyTo && (
                            <div className="mb-1.5 flex items-center gap-1.5 text-xs text-grey/50">
                                <CornerDownRight className="h-3.5 w-3.5" /> Respondiendo a {replyTo.name || "el comentario"}
                                <button onClick={() => setReplyTo(null)} className="text-grey/40 hover:text-coral"><X className="h-3 w-3" /></button>
                            </div>
                        )}
                        <div className="flex items-center gap-2">
                            <input
                                value={text}
                                onChange={(e) => setText(e.target.value)}
                                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void submit(); } }}
                                placeholder="Escribe un comentario…"
                                className="flex-1 rounded-full border border-teal/15 bg-white px-3.5 py-2 text-sm focus:border-teal/40 focus:outline-none focus:ring-2 focus:ring-teal/15"
                            />
                            <button onClick={() => void submit()} disabled={!text.trim() || busy} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-teal text-white transition-colors hover:bg-teal-dark disabled:opacity-40">
                                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function CommentRow({ c, onReply, onDelete, small }: { c: ActivityComment; onReply?: () => void; onDelete?: () => void; small?: boolean }) {
    return (
        <div className="flex gap-2.5">
            <Avatar name={c.authorName} avatar={c.authorAvatar} size={small ? 24 : 28} />
            <div className="min-w-0 flex-1">
                <div className="rounded-2xl bg-cream/50 px-3 py-2">
                    <p className="text-xs font-semibold text-teal-dark">{c.authorName}</p>
                    <p className="mt-0.5 whitespace-pre-wrap break-words text-sm text-grey-dark">{c.content}</p>
                </div>
                <div className="mt-1 flex items-center gap-3 pl-1 text-[11px] text-grey/40">
                    <span>{fmt(c.createdAt)}</span>
                    {onReply && <button onClick={onReply} className="font-medium hover:text-teal">Responder</button>}
                    {c.isMine && onDelete && <button onClick={onDelete} className="font-medium hover:text-coral">Borrar</button>}
                </div>
            </div>
        </div>
    );
}
