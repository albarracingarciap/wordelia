import * as React from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

interface AgendaBlock {
    id: string;
    title: string;
    duration: string;
    isCurrent?: boolean;
    isCompleted?: boolean;
}

interface SessionAgendaProps {
    blocks: AgendaBlock[];
    status: "scheduled" | "live" | "ended";
}

export function SessionAgenda({ blocks, status }: SessionAgendaProps) {
    return (
        <Card className="h-full flex flex-col">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-serif text-lg font-bold text-teal-dark">Agenda del día</h3>
                {status === 'live' && <span className="text-[10px] uppercase font-bold text-coral animate-pulse">En curso</span>}
            </div>

            <div className="space-y-4 flex-1 overflow-y-auto pr-2">
                {blocks.map((block, i) => (
                    <div
                        key={block.id}
                        className={`relative pl-4 border-l-2 transition-all p-3 rounded-r-lg
                        ${block.isCurrent ? 'border-teal bg-teal/5' : block.isCompleted ? 'border-teal/30 opacity-60' : 'border-grey/10'}`}
                    >
                        <div className={`absolute -left-[5px] top-4 w-2 h-2 rounded-full ${block.isCurrent ? 'bg-teal' : block.isCompleted ? 'bg-teal/50' : 'bg-grey/20'}`}></div>

                        <div className="flex justify-between items-start">
                            <span className={`text-sm font-bold ${block.isCurrent ? 'text-teal-dark' : 'text-grey-dark'}`}>{block.title}</span>
                            <span className="text-xs text-grey/50 font-medium">{block.duration}</span>
                        </div>
                        {block.isCurrent && (
                            <p className="text-xs text-teal/80 mt-1">Estamos aquí. ¡Participa en el chat!</p>
                        )}
                    </div>
                ))}
            </div>

            {status === 'live' && (
                <div className="mt-4 pt-4 border-t border-black/5">
                    <Button variant="ghost" size="sm" className="w-full text-grey/60">
                        Ver preguntas preparadas
                    </Button>
                </div>
            )}
        </Card>
    );
}
