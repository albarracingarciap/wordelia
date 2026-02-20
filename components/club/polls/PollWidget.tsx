"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { X } from "lucide-react";
// import { Progress } from "@/components/ui/Progress"; // Custom implementation used below
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
    const [isVisible, setIsVisible] = React.useState(true);
    const [optimisticPoll, setOptimisticPoll] = React.useState<PollData | null>(poll);

    React.useEffect(() => {
        setOptimisticPoll(poll);
        // Reset visibility and closing state when poll changes
        setIsVisible(true);
        setIsClosing(false);
    }, [poll]);

    const handleVote = async (optionId: string) => {
        if (!optimisticPoll || isVoting || isClosing || !optimisticPoll.isOpen) return;

        setIsVoting(true);

        const result = await votePoll(optimisticPoll.id, optionId);

        if (result?.error) {
            alert("Error al votar: " + result.error);
        }

        setIsVoting(false);
        router.refresh();
    };

    // This is the "End Vote" action (stops voting, keeps widget visible)
    const handleEndPoll = async () => {
        if (!optimisticPoll) return;
        setIsClosing(true);
        try {
            const { endPoll } = await import("@/app/app/clubs/[id]/actions");
            const result = await endPoll(optimisticPoll.id);
            if (result?.error) {
                alert("Error: " + result.error);
                setIsClosing(false);
            } else {
                // Success - update local state to closed
                setOptimisticPoll(prev => prev ? ({ ...prev, isOpen: false }) : null);
                router.refresh();
            }
        } catch (e) {
            console.error(e);
            setIsClosing(false);
        }
    };

    // This is the "Dismiss" action (X button - removes widget)
    const handleDismissPoll = async () => {
        if (!optimisticPoll) return;
        setIsClosing(true);
        try {
            const { closePoll } = await import("@/app/app/clubs/[id]/actions");
            const result = await closePoll(optimisticPoll.id);
            if (result?.error) {
                alert("Error: " + result.error);
                setIsClosing(false);
            } else {
                // Success - immediately update local state to show "Create Poll" or hide
                setOptimisticPoll(null);
                router.refresh();
            }
        } catch (e) {
            console.error(e);
            setIsClosing(false);
        }
    };

    if (!isVisible) return null;

    if (!optimisticPoll) {
        if (canCreate) {
            return (
                <Card className="border-dashed border-2 border-teal/20 bg-teal/5">
                    <div className="text-center py-4">
                        <h4 className="font-bold text-teal-dark mb-2">¿Próxima lectura?</h4>
                        <p className="text-xs text-grey/60 mb-4 px-2">
                            Lanza una votación para decidir el siguiente libro.
                        </p>
                        <Button variant="outline" size="sm" onClick={onCreateClick}>
                            Crear Votación
                        </Button>
                    </div>
                </Card>
            );
        }
        return null; // Nothing to show for members if no poll
    }

    const hasVoted = !!optimisticPoll.userVoteId;
    const isClosed = !optimisticPoll.isOpen;

    return (
        <Card className="relative group">
            <div className="flex justify-between items-start mb-4 pr-6">
                <h4 className="font-bold text-sm text-grey-dark">{optimisticPoll.question}</h4>
                <div className="flex items-center gap-2">
                    {isClosed ? (
                        <span className="text-[10px] text-coral bg-coral/10 px-2 py-1 rounded-full uppercase tracking-wider font-bold">
                            Finalizada
                        </span>
                    ) : (
                        <span className="text-[10px] text-grey/50 bg-grey/5 px-2 py-1 rounded-full uppercase tracking-wider">
                            {optimisticPoll.totalVotes} votos
                        </span>
                    )}

                    {canCreate && (
                        <button
                            onClick={async () => {
                                if (confirm("¿Quieres eliminar esta encuesta de la vista?")) {
                                    await handleDismissPoll();
                                }
                            }}
                            disabled={isClosing}
                            className="absolute top-3 right-3 text-grey/40 hover:text-coral transition-colors disabled:opacity-50"
                            title="Eliminar encuesta"
                        >
                            <X size={16} />
                        </button>
                    )}
                </div>
            </div>

            <div className="space-y-3">
                {optimisticPoll.options.map((option) => {
                    const percentage = optimisticPoll.totalVotes > 0
                        ? Math.round((option.votes / optimisticPoll.totalVotes) * 100)
                        : 0;
                    const isSelected = optimisticPoll.userVoteId === option.id;
                    const isWinning = percentage > 0 && percentage === Math.max(...optimisticPoll.options.map(o => o.votes > 0 ? (o.votes / optimisticPoll.totalVotes) * 100 : 0));

                    // Always show results if voted OR poll is closed
                    const showResults = hasVoted || isClosed;

                    return (
                        <div key={option.id} className="relative">
                            {showResults ? (
                                // Result View
                                <div className={`relative rounded-lg overflow-hidden ${isSelected ? 'ring-2 ring-teal ring-offset-1' : ''}`}>
                                    <div className="flex justify-between text-xs mb-1 px-1 relative z-10">
                                        <span className={`font-medium ${isWinning ? 'text-teal-dark font-bold' : 'text-grey-dark'}`}>
                                            {option.text} {isSelected && '(Tu voto)'}
                                        </span>
                                        <span className="text-grey/60">{percentage}%</span>
                                    </div>
                                    <div className="h-2 bg-grey/10 w-full rounded-full overflow-hidden">
                                        <div
                                            className={`h-full transition-all duration-500 ${isWinning ? 'bg-teal' : 'bg-grey/40'}`}
                                            style={{ width: `${percentage}%` }}
                                        />
                                    </div>
                                </div>
                            ) : (
                                // Voting View
                                <button
                                    onClick={() => handleVote(option.id)}
                                    disabled={isVoting || isClosing}
                                    className="w-full text-left p-2 rounded-lg border border-grey/20 hover:border-teal hover:bg-teal/5 transition-all group flex justify-between items-center"
                                >
                                    <span className="text-sm text-grey-dark group-hover:text-teal-dark">{option.text}</span>
                                    <div className="w-4 h-4 rounded-full border border-grey/30 group-hover:border-teal"></div>
                                </button>
                            )}
                        </div>
                    );
                })}
            </div>

            {canCreate && !isClosed && (
                <div className="mt-4 pt-3 border-t border-grey/10 text-center">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs text-coral hover:text-coral-dark h-auto py-1"
                        onClick={async () => {
                            if (confirm("¿Seguro que quieres cerrar la votación? Ya no se podrán recibir más votos.")) {
                                await handleEndPoll();
                            }
                        }}
                        disabled={isClosing}
                    >
                        {isClosing ? "Cerrando..." : "Terminar votación"}
                    </Button>
                </div>
            )}
        </Card>
    );
}
