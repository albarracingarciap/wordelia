"use client";

import * as React from "react";
import { CheckpointDetailModal } from "./CheckpointDetailModal";
import { TabsContext } from "../ui/Tabs";

interface Checkpoint {
    id: string;
    title: string;
    start: string;
    end: string;
    date?: string;
    questions?: string[];
}

interface ClubCheckpointsData {
    userRole?: string | null;
    currentBook?: {
        pace_unit?: string | null;
        checkpoints?: Checkpoint[] | null;
        book?: {
            title?: string | null;
        } | null;
    } | null;
}

type CheckpointStatus = "completed" | "current" | "upcoming";

function getCheckpointStatus(chk: Checkpoint, index: number, allCheckpoints: Checkpoint[]): CheckpointStatus {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (!chk.date) {
        const hasAnyDate = allCheckpoints.some((checkpoint) => checkpoint.date);
        return !hasAnyDate && index === 0 ? "current" : "upcoming";
    }

    const deadline = new Date(chk.date);
    deadline.setHours(23, 59, 59, 999);

    if (deadline < today) return "completed";

    const previousCompleted = allCheckpoints.slice(0, index).every((checkpoint) => {
        if (!checkpoint.date) return false;
        const previousDeadline = new Date(checkpoint.date);
        previousDeadline.setHours(23, 59, 59, 999);
        return previousDeadline < today;
    });

    return previousCompleted ? "current" : "upcoming";
}

function formatCheckpointDate(date: string) {
    return new Date(date).toLocaleDateString("es-ES", {
        day: "numeric",
        month: "short",
    });
}

export function ClubCheckpoints({
    club,
    onOpenConversationCheckpoint,
}: {
    club?: ClubCheckpointsData;
    onOpenConversationCheckpoint?: (checkpointNumber: number) => void;
}) {
    const tabsContext = React.useContext(TabsContext);
    const [selectedCheckpoint, setSelectedCheckpoint] = React.useState<{ checkpoint: Checkpoint; index: number } | null>(null);

    const checkpoints = club?.currentBook?.checkpoints || [];
    const unitLabel = club?.currentBook?.pace_unit || "p.";
    const bookTitle = club?.currentBook?.book?.title;

    if (!club) {
        return (
            <div className="py-12 text-center text-grey/40 text-sm">
                Cargando plan de lectura...
            </div>
        );
    }

    if (checkpoints.length === 0) {
        return (
            <div className="py-12 text-center space-y-3 border-2 border-dashed border-grey/10 rounded-xl">
                <p className="text-grey/50">No se ha definido un plan de lectura todavia.</p>
                {(club.userRole === "admin" || club.userRole === "moderator") && (
                    <p className="text-xs text-grey/40">
                        Puedes crear checkpoints desde la pestana{" "}
                        <button
                            onClick={() => tabsContext?.onChange("manage")}
                            className="text-teal underline underline-offset-2"
                        >
                            Gestionar
                        </button>.
                    </p>
                )}
            </div>
        );
    }

    const statuses = checkpoints.map((checkpoint, index) => getCheckpointStatus(checkpoint, index, checkpoints));
    const completedCount = statuses.filter((status) => status === "completed").length;

    return (
        <div className="space-y-6">
            <div className="bg-white rounded-xl border border-black/5 p-4 flex items-center justify-between">
                <div>
                    <p className="text-xs text-grey/50 uppercase tracking-widest font-bold mb-1">Plan de lectura</p>
                    <p className="text-sm text-grey-dark font-medium">
                        {bookTitle && <span className="text-teal">{bookTitle} - </span>}
                        {completedCount} de {checkpoints.length} checkpoints completados
                    </p>
                </div>
                <div className="flex gap-1">
                    {checkpoints.map((_, index) => {
                        const status = statuses[index];
                        return (
                            <div
                                key={index}
                                className={`h-1.5 w-6 rounded-full transition-all ${status === "completed"
                                    ? "bg-teal"
                                    : status === "current"
                                        ? "bg-teal/50"
                                        : "bg-grey/15"
                                    }`}
                            />
                        );
                    })}
                </div>
            </div>

            <div className="relative">
                <div className="absolute left-[19px] top-6 bottom-6 w-0.5 bg-grey/10 z-0" />

                <div className="space-y-3 relative z-10">
                    {checkpoints.map((checkpoint, index) => {
                        const status = statuses[index];
                        const isCurrent = status === "current";
                        const isCompleted = status === "completed";

                        return (
                            <button
                                key={checkpoint.id}
                                onClick={() => setSelectedCheckpoint({ checkpoint, index })}
                                className={`w-full flex items-start gap-4 p-4 rounded-xl border text-left transition-all group ${isCurrent
                                    ? "bg-teal/5 border-teal/25 shadow-sm hover:shadow-md"
                                    : isCompleted
                                        ? "bg-white border-black/5 opacity-70 hover:opacity-100"
                                        : "bg-white border-black/5 hover:border-grey/20"
                                    }`}
                            >
                                <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 border-2 font-bold text-sm transition-all ${isCurrent
                                    ? "bg-teal border-teal text-white shadow-md shadow-teal/20"
                                    : isCompleted
                                        ? "bg-teal/10 border-teal/30 text-teal"
                                        : "bg-white border-grey/20 text-grey/40"
                                    }`}
                                >
                                    {isCompleted ? (
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                        </svg>
                                    ) : (
                                        index + 1
                                    )}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-0.5">
                                        <span className={`text-[10px] font-bold uppercase tracking-widest ${isCurrent
                                            ? "text-teal"
                                            : isCompleted
                                                ? "text-teal/50"
                                                : "text-grey/40"
                                            }`}
                                        >
                                            {isCurrent ? "Actual" : isCompleted ? "Completado" : `Checkpoint ${index + 1}`}
                                        </span>
                                    </div>
                                    <h4 className={`font-bold text-sm leading-tight mb-1 ${isCurrent ? "text-teal-dark" : "text-grey-dark"}`}>
                                        {checkpoint.title}
                                    </h4>
                                    <p className="text-xs text-grey/60">
                                        {unitLabel} {checkpoint.start} - {checkpoint.end}
                                        {!!checkpoint.questions?.length && (
                                            <span className="ml-2 text-teal/70">
                                                - {checkpoint.questions.length} preguntas
                                            </span>
                                        )}
                                        {checkpoint.date && (
                                            <span className={`ml-2 ${isCurrent ? "text-coral font-medium" : ""}`}>
                                                - {formatCheckpointDate(checkpoint.date)}
                                            </span>
                                        )}
                                    </p>
                                </div>

                                <svg
                                    className={`w-4 h-4 shrink-0 mt-1 transition-colors ${isCurrent ? "text-teal" : "text-grey/20 group-hover:text-grey/40"}`}
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </button>
                        );
                    })}
                </div>
            </div>

            {selectedCheckpoint && (
                <CheckpointDetailModal
                    isOpen={!!selectedCheckpoint}
                    onClose={() => setSelectedCheckpoint(null)}
                    onGoToConversation={() => {
                        if (onOpenConversationCheckpoint) {
                            onOpenConversationCheckpoint(selectedCheckpoint.index + 1);
                            return;
                        }

                        tabsContext?.onChange("feed");
                    }}
                    checkpoint={{
                        title: `Checkpoint ${selectedCheckpoint.index + 1}: ${selectedCheckpoint.checkpoint.title}`,
                        range: `${unitLabel} ${selectedCheckpoint.checkpoint.start} - ${selectedCheckpoint.checkpoint.end}`,
                        deadline: selectedCheckpoint.checkpoint.date
                            ? new Date(selectedCheckpoint.checkpoint.date).toLocaleDateString("es-ES", {
                                weekday: "long",
                                day: "numeric",
                                month: "long",
                            })
                            : undefined,
                        questions: selectedCheckpoint.checkpoint.questions || [],
                    }}
                />
            )}
        </div>
    );
}
