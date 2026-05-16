"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { votePoll } from "@/app/app/clubs/[id]/actions";

interface PollOption {
    id: string;
    text: string;
    votes: number;
}

interface PollData {
    id: string;
    question: string;
    options: PollOption[];
    userVoteId: string | null;
    totalVotes: number;
    isOpen: boolean;
}

interface PollWidgetProps {
    poll: PollData | null;
    canCreate: boolean;
    onCreateClick: () => void;
}

export function PollWidget({ poll, canCreate, onCreateClick }: PollWidgetProps) {
    const router = useRouter();
    const [isVoting, setIsVoting] = React.useState(false);
    const [isClosing, setIsClosing] = React.useState(false);
    const [showEndConfirm, setShowEndConfirm] = React.useState(false);
    const [actionError, setActionError] = React.useState<string | null>(null);
    const [optimisticPoll, setOptimisticPoll] = React.useState<PollData | null>(poll);

    React.useEffect(() => {
        setOptimisticPoll(poll);
        setIsClosing(false);
        setShowEndConfirm(false);
        setActionError(null);
    }, [poll]);

    const handleVote = async (optionId: string) => {
        if (!optimisticPoll || isVoting || isClosing || !optimisticPoll.isOpen) return;

        setIsVoting(true);
        setActionError(null);

        const result = await votePoll(optimisticPoll.id, optionId);
        if (result?.error) {
            setActionError("No se ha podido registrar tu voto. Inténtalo de nuevo.");
        }

        setIsVoting(false);
        router.refresh();
    };

    const handleEndPoll = async () => {
        if (!optimisticPoll) return;
        setIsClosing(true);
        setActionError(null);

        try {
            const { endPoll } = await import("@/app/app/clubs/[id]/actions");
            const result = await endPoll(optimisticPoll.id);

            if (result?.error) {
                setActionError("No se ha podido cerrar la votación. Inténtalo de nuevo.");
                setIsClosing(false);
                return;
            }

            setOptimisticPoll(prev => prev ? ({ ...prev, isOpen: false }) : null);
            setShowEndConfirm(false);
            router.refresh();
        } catch (error) {
            console.error(error);
            setActionError("No se ha podido cerrar la votación. Inténtalo de nuevo.");
            setIsClosing(false);
        }
    };

    if (!optimisticPoll) {
        if (canCreate) {
            return (
                <Card className="rounded-3xl border-2 border-dashed border-teal/20 bg-teal/5">
                    <div className="py-4 text-center">
                        <h4 className="mb-2 font-bold text-teal-dark">¿Próxima lectura?</h4>
                        <p className="mb-4 px-2 text-xs text-grey/60">
                            Lanza una votación para decidir el siguiente libro.
                        </p>
                        <Button variant="outline" size="sm" onClick={onCreateClick}>
                            Crear votación
                        </Button>
                    </div>
                </Card>
            );
        }
        return null;
    }

    const hasVoted = !!optimisticPoll.userVoteId;
    const isClosed = !optimisticPoll.isOpen;
    const winningPercentage = Math.max(
        ...optimisticPoll.options.map(option =>
            optimisticPoll.totalVotes > 0 ? (option.votes / optimisticPoll.totalVotes) * 100 : 0
        )
    );

    return (
        <>
            <Card className="relative rounded-3xl">
                <div className="mb-4 flex items-start justify-between gap-3">
                    <h4 className="text-base font-bold leading-snug text-teal-dark">{optimisticPoll.question}</h4>
                    <div className="flex shrink-0 items-center gap-2">
                        {isClosed ? (
                            <span className="rounded-full bg-coral/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-coral">
                                Finalizada
                            </span>
                        ) : (
                            <span className="rounded-full bg-grey/5 px-2 py-1 text-[10px] uppercase tracking-wider text-grey/50">
                                {optimisticPoll.totalVotes} votos
                            </span>
                        )}
                    </div>
                </div>

                {actionError && (
                    <p className="mb-4 rounded-2xl bg-coral/10 px-4 py-3 text-sm font-bold text-coral">
                        {actionError}
                    </p>
                )}

                <div className="space-y-4">
                    {optimisticPoll.options.map((option) => {
                        const percentage = optimisticPoll.totalVotes > 0
                            ? Math.round((option.votes / optimisticPoll.totalVotes) * 100)
                            : 0;
                        const isSelected = optimisticPoll.userVoteId === option.id;
                        const isWinning = percentage > 0 && percentage === winningPercentage;
                        const showResults = hasVoted || isClosed;

                        return (
                            <div key={option.id} className="relative">
                                {showResults ? (
                                    <div className={`relative rounded-2xl border border-transparent p-2 ${isSelected ? "border-teal bg-teal/5 ring-2 ring-teal/10" : ""}`}>
                                        <div className="relative z-10 mb-2 flex items-start justify-between gap-3 text-sm">
                                            <span className={`font-bold leading-snug ${isWinning ? "text-teal-dark" : "text-grey-dark"}`}>
                                                {option.text}
                                                {isSelected && <span className="ml-1 text-xs font-bold text-teal">(Tu voto)</span>}
                                            </span>
                                            <span className="shrink-0 text-grey/60">{percentage}%</span>
                                        </div>
                                        <div className="h-2.5 w-full overflow-hidden rounded-full bg-grey/10">
                                            <div
                                                className={`h-full transition-all duration-500 ${isWinning ? "bg-teal" : "bg-grey/40"}`}
                                                style={{ width: `${percentage}%` }}
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => handleVote(option.id)}
                                        disabled={isVoting || isClosing}
                                        className="group flex w-full items-center justify-between gap-3 rounded-2xl border border-grey/15 p-3 text-left transition-all hover:border-teal hover:bg-teal/5"
                                    >
                                        <span className="text-sm font-bold leading-snug text-grey-dark group-hover:text-teal-dark">{option.text}</span>
                                        <div className="h-5 w-5 shrink-0 rounded-full border border-grey/30 group-hover:border-teal" />
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>

                {canCreate && !isClosed && (
                    <div className="mt-4 border-t border-grey/10 pt-3 text-center">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-auto py-1 text-xs text-coral hover:text-coral-dark"
                            onClick={() => setShowEndConfirm(true)}
                            disabled={isClosing}
                        >
                            {isClosing ? "Cerrando..." : "Terminar votación"}
                        </Button>
                    </div>
                )}
            </Card>

            <Modal
                isOpen={showEndConfirm}
                onClose={() => !isClosing && setShowEndConfirm(false)}
                title="Terminar votación"
                size="sm"
            >
                <div className="space-y-5">
                    <p className="text-sm leading-relaxed text-grey/70">
                        Al cerrar la votación ya no se podrán recibir más votos. Los resultados quedarán visibles en el histórico del club.
                    </p>
                    <div className="grid gap-3 sm:flex sm:justify-end">
                        <Button
                            variant="ghost"
                            onClick={() => setShowEndConfirm(false)}
                            disabled={isClosing}
                            className="w-full sm:w-auto"
                        >
                            Cancelar
                        </Button>
                        <Button
                            variant="primary"
                            onClick={handleEndPoll}
                            disabled={isClosing}
                            className="w-full sm:w-auto"
                        >
                            {isClosing ? "Cerrando..." : "Terminar votación"}
                        </Button>
                    </div>
                </div>
            </Modal>
        </>
    );
}
