import * as React from "react";
import { Badge } from "@/components/ui/Badge";

interface Checkpoint {
    id: string;
    title: string;
    range: string;
    status: "detailed" | "current" | "upcoming" | "completed";
    dueAt?: string;
    checkins: number;
    posts: number;
}

interface CheckpointsListProps {
    checkpoints: Checkpoint[];
    activeId: string;
    onSelect: (id: string) => void;
}

export function CheckpointsList({ checkpoints, activeId, onSelect }: CheckpointsListProps) {
    return (
        <div className="bg-white rounded-xl border border-black/5 overflow-hidden">
            <div className="p-4 bg-grey/5 border-b border-black/5">
                <h3 className="font-bold text-sm text-grey-dark">Plan de lectura</h3>
            </div>
            <div>
                {checkpoints.map((chk, i) => {
                    const isActive = chk.id === activeId;
                    return (
                        <button
                            key={chk.id}
                            onClick={() => onSelect(chk.id)}
                            className={`w-full text-left p-4 border-b border-black/5 last:border-0 hover:bg-teal/5 transition-colors flex items-start gap-3
                            ${isActive ? 'bg-teal/5 ring-inset ring-2 ring-teal/20' : ''}`}
                        >
                            <div className={`mt-1 w-2 h-2 rounded-full ${chk.status === 'current' ? 'bg-teal' : chk.status === 'completed' ? 'bg-grey/30' : 'bg-grey/10'}`}></div>
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start mb-1">
                                    <span className={`text-sm font-bold ${isActive ? 'text-teal-dark' : 'text-grey-dark'}`}>{chk.title}</span>
                                    {chk.status === 'current' && <Badge variant="brand" size="sm">Actual</Badge>}
                                </div>
                                <div className="text-xs text-grey/60 mb-2">{chk.range}</div>

                                <div className="flex items-center gap-3 text-[10px] text-grey/40 uppercase font-medium">
                                    {chk.dueAt && <span>Vence: {chk.dueAt}</span>}
                                    <span className="flex items-center gap-1">
                                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                        {chk.checkins}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                                        {chk.posts}
                                    </span>
                                </div>
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
