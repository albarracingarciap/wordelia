import Link from "next/link";
import { useParams } from "next/navigation";
import * as React from "react";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import { CheckpointDetailModal } from "./CheckpointDetailModal";
import { TabsContext } from "../ui/Tabs";

interface Checkpoint {
    id: string;
    title: string;
    start: string;
    end: string;
    date?: string; // deadline ISO string e.g. "2026-02-23"
}

function getActiveCheckpoint(checkpoints: Checkpoint[]): { checkpoint: Checkpoint; index: number } | null {
    if (!checkpoints || checkpoints.length === 0) return null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find the first checkpoint whose deadline hasn't passed yet
    for (let i = 0; i < checkpoints.length; i++) {
        const chk = checkpoints[i];
        if (!chk.date) return { checkpoint: chk, index: i }; // No deadline → treat as active
        const deadline = new Date(chk.date);
        deadline.setHours(23, 59, 59, 999);
        if (deadline >= today) return { checkpoint: chk, index: i };
    }

    // All deadlines passed → show last one
    return { checkpoint: checkpoints[checkpoints.length - 1], index: checkpoints.length - 1 };
}

function formatDeadline(dateStr?: string): string {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return `Vence: ${date.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'short' })}`;
}

export function ClubSummary({ club }: { club?: any }) {
    const params = useParams();
    const clubId = params.id;
    const [isCheckpointModalOpen, setIsCheckpointModalOpen] = React.useState(false);
    const tabsContext = React.useContext(TabsContext);

    const handleViewFullPlan = () => {
        if (tabsContext) {
            tabsContext.onChange("checkpoints");
        }
    };

    // Compute active checkpoint from real data
    const checkpoints: Checkpoint[] = club?.currentBook?.checkpoints || [];
    const unitLabel = club?.currentBook?.pace_unit || "p.";
    const activeResult = getActiveCheckpoint(checkpoints);
    const activeCheckpoint = activeResult?.checkpoint || null;
    const activeIndex = activeResult?.index ?? 0;

    // Progress: e.g. start=1, end=45, unit is pages. Show range.
    const progressStart = activeCheckpoint?.start || "1";
    const progressEnd = activeCheckpoint?.end || "?";
    // We calculate progress as position in the checkpoint list (e.g. 1 of 5 = 20%)
    const progressPercent = checkpoints.length > 1
        ? Math.round(((activeIndex) / (checkpoints.length - 1)) * 100)
        : 50;

    const hasCheckpoints = checkpoints.length > 0;

    return (
        <div className="space-y-6">
            {/* Progress Card */}
            <Card className="border-l-4 border-l-teal">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h3 className="font-serif text-lg text-teal-dark font-bold">Dónde estamos</h3>
                        {hasCheckpoints ? (
                            <p className="text-sm text-grey/60">
                                Checkpoint {activeIndex + 1}: {activeCheckpoint?.title}
                            </p>
                        ) : (
                            <p className="text-sm text-grey/40 italic">Sin checkpoints definidos</p>
                        )}
                    </div>
                    {activeCheckpoint?.date && (
                        <span className="text-[10px] uppercase font-bold text-coral bg-coral/5 px-2 py-1 rounded">
                            {formatDeadline(activeCheckpoint.date)}
                        </span>
                    )}
                </div>

                {hasCheckpoints && (
                    <div className="mb-4">
                        <div className="flex justify-between text-xs text-grey mb-1">
                            <span>{unitLabel} {progressStart}</span>
                            <span className="font-bold text-teal">{unitLabel} {progressEnd}</span>
                        </div>
                        <div className="h-2 bg-grey/10 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-teal rounded-full transition-all duration-500"
                                style={{ width: `${Math.max(5, progressPercent)}%` }}
                            />
                        </div>
                        <p className="text-[10px] text-grey/40 mt-1 text-right">
                            Checkpoint {activeIndex + 1} de {checkpoints.length}
                        </p>
                    </div>
                )}

                <div className="flex gap-3">
                    {hasCheckpoints && (
                        <Button size="sm" variant="primary" className="text-xs" onClick={() => setIsCheckpointModalOpen(true)}>
                            Ir al checkpoint
                        </Button>
                    )}
                    <Button size="sm" variant="ghost" className="text-xs" onClick={handleViewFullPlan}>
                        Ver plan completo
                    </Button>
                </div>
            </Card>

            {activeCheckpoint && (
                <CheckpointDetailModal
                    isOpen={isCheckpointModalOpen}
                    onClose={() => setIsCheckpointModalOpen(false)}
                    checkpoint={{
                        title: `Checkpoint ${activeIndex + 1}: ${activeCheckpoint.title}`,
                        range: `${unitLabel} ${progressStart} - ${progressEnd}`,
                        deadline: activeCheckpoint.date
                            ? new Date(activeCheckpoint.date).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })
                            : undefined
                    }}
                />
            )}

            {/* Next Session — still placeholder until sessions table exists */}
            <Card>
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-orange-100/50 text-orange-800 flex flex-col items-center justify-center border border-orange-200">
                        <span className="text-[10px] font-bold uppercase">Dom</span>
                        <span className="text-lg font-bold leading-none">19</span>
                    </div>
                    <div className="flex-1">
                        <h4 className="font-bold text-grey-dark text-sm">Sesión de discusión #1</h4>
                        <p className="text-xs text-grey/60">19:00h · Online · 60 min</p>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        className="text-xs"
                        onClick={() => window.open("https://calendar.google.com/calendar/r/eventedit?text=Sesión+de+discusión+%231+Wordelia&dates=20260219T190000/20260219T200000", "_blank")}
                    >
                        Añadir a calendario
                    </Button>
                </div>
            </Card>

            {/* AI Tools */}
            <div className="space-y-3">
                <h4 className="text-sm font-bold text-grey/40 uppercase tracking-widest pl-1">Recursos</h4>

                {[
                    { title: "ADN del libro", desc: "Temas, símbolos y voz narrativa.", color: "bg-purple-50 text-purple-700" },
                    { title: "Guía de discusión", desc: "Preguntas sugeridas para este tramo.", color: "bg-blue-50 text-blue-700" },
                    { title: "Mapa emocional", desc: "Visualiza la tensión y el ritmo.", color: "bg-pink-50 text-pink-700" },
                ].map((tool, i) => (
                    <button key={i} className="w-full flex items-center justify-between p-3 bg-white border border-black/5 rounded-xl hover:border-teal/30 hover:shadow-sm transition-all text-left group">
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-lg ${tool.color} flex items-center justify-center opacity-80 group-hover:opacity-100 transition-opacity`}>
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                            </div>
                            <div>
                                <div className="font-bold text-sm text-grey-dark">{tool.title}</div>
                                <div className="text-xs text-grey/60">{tool.desc}</div>
                            </div>
                        </div>
                        <svg className="w-4 h-4 text-grey/30 group-hover:text-teal" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                    </button>
                ))}
            </div>
        </div>
    );
}
