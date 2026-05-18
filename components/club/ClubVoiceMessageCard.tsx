import * as React from "react";
import { Mic, Pin, Trash2 } from "lucide-react";

interface ClubVoiceMessageCardProps {
    id: string;
    author: { name: string; avatar?: string };
    date: string;
    title?: string | null;
    playbackUrl?: string | null;
    durationSeconds?: number | null;
    checkpointLabel?: string;
    isPinned?: boolean;
    onDelete?: () => void;
    onPin?: () => void;
}

function formatDuration(seconds?: number | null) {
    if (!seconds || seconds <= 0) return null;
    const minutes = Math.floor(seconds / 60);
    const rest = seconds % 60;
    return `${minutes}:${String(rest).padStart(2, "0")}`;
}

export function ClubVoiceMessageCard({
    author,
    date,
    title,
    playbackUrl,
    durationSeconds,
    checkpointLabel,
    isPinned = false,
    onDelete,
    onPin,
}: ClubVoiceMessageCardProps) {
    const duration = formatDuration(durationSeconds);

    return (
        <div className={`rounded-xl border p-4 ${isPinned ? "border-coral/25 bg-coral/5" : "border-black/5 bg-white"}`}>
            <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2">
                    <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full bg-teal/10">
                        {author.avatar ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={author.avatar} alt={author.name} className="h-full w-full object-cover" />
                        ) : (
                            <div className="flex h-full w-full items-center justify-center text-xs font-bold uppercase text-teal">
                                {author.name[0]}
                            </div>
                        )}
                    </div>
                    <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2 text-sm font-bold text-grey-dark">
                            <span className="truncate">{author.name}</span>
                            <span className="rounded bg-teal px-1.5 py-0.5 text-[10px] font-medium text-white">MOD</span>
                            {isPinned && (
                                <span className="rounded bg-coral/10 px-1.5 py-0.5 text-[10px] font-medium text-coral">
                                    Fijado
                                </span>
                            )}
                        </div>
                        <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[10px] text-grey/50">
                            <span>{date}</span>
                            {duration && <span>{duration}</span>}
                            {checkpointLabel && (
                                <span className="rounded-full bg-teal/10 px-1.5 py-0.5 font-medium text-teal">
                                    {checkpointLabel}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex shrink-0 items-center gap-1">
                    {onPin && (
                        <button
                            type="button"
                            onClick={onPin}
                            className="rounded-lg p-1 text-grey/35 transition hover:bg-grey/5 hover:text-coral"
                            title={isPinned ? "Quitar fijado" : "Fijar audio"}
                        >
                            <Pin size={14} className={isPinned ? "fill-current" : ""} />
                        </button>
                    )}
                    {onDelete && (
                        <button
                            type="button"
                            onClick={onDelete}
                            className="rounded-lg p-1 text-grey/35 transition hover:bg-grey/5 hover:text-coral"
                            title="Archivar audio"
                        >
                            <Trash2 size={14} />
                        </button>
                    )}
                </div>
            </div>

            <div className="mt-3 pl-10">
                <div className="mb-2 flex items-center gap-2 text-sm font-bold text-teal-dark">
                    <Mic size={16} className="shrink-0 text-teal" />
                    <span>{title || "Mensaje de voz del moderador"}</span>
                </div>
                {playbackUrl ? (
                    <audio controls preload="none" src={playbackUrl} className="w-full" />
                ) : (
                    <div className="rounded-2xl bg-grey/5 px-3 py-2 text-xs font-medium text-grey/55">
                        No se pudo generar el enlace de reproducción.
                    </div>
                )}
            </div>
        </div>
    );
}
