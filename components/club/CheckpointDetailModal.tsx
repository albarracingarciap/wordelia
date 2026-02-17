import * as React from "react";
import { Button } from "@/components/ui/Button";

interface CheckpointDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    checkpoint: {
        title: string;
        range: string;
        deadline?: string;
    };
}

export function CheckpointDetailModal({ isOpen, onClose, checkpoint }: CheckpointDetailModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in-up">
                <div className="bg-teal/5 p-6 border-b border-teal/10 flex justify-between items-start">
                    <div>
                        <span className="block text-xs font-bold text-teal uppercase tracking-widest mb-1">Checkpoint Actual</span>
                        <h2 className="font-serif text-2xl text-teal-dark font-bold">{checkpoint.title}</h2>
                        <p className="text-sm text-grey/60 mt-1">{checkpoint.range}</p>
                    </div>
                    <button onClick={onClose} className="text-grey/40 hover:text-coral transition-colors">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Status Interaction */}
                    <div className="bg-[#FAF9F6] rounded-xl p-4 border border-black/5">
                        <h3 className="font-bold text-sm text-grey-dark mb-3">¿Has llegado a este punto?</h3>
                        <div className="flex gap-2">
                            <Button variant="primary" className="flex-1" onClick={() => alert("¡Marcado como leído!")}>
                                ✅ Sí, completado
                            </Button>
                            <Button variant="outline" className="flex-1" onClick={() => alert("Ánimo, ¡tú puedes!")}>
                                🐢 Aún no
                            </Button>
                        </div>
                    </div>

                    {/* Discussion Guide Mockup */}
                    <div>
                        <h3 className="font-bold text-sm text-grey-dark mb-3 flex items-center gap-2">
                            <span>Guía de discusión (IA)</span>
                            <span className="text-[10px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">Beta</span>
                        </h3>
                        <div className="space-y-3">
                            <div className="p-3 bg-white border border-grey/10 rounded-lg text-sm text-grey/70">
                                💭 ¿Qué opinas de la decisión que toma el protagonista en la página 30?
                            </div>
                            <div className="p-3 bg-white border border-grey/10 rounded-lg text-sm text-grey/70">
                                🔎 El símbolo de los gusanos de seda representa...
                            </div>
                        </div>
                        <Button variant="ghost" className="w-full mt-2 text-xs text-teal">Ver todas las preguntas</Button>
                    </div>

                    <div className="pt-2">
                        <Button variant="secondary" className="w-full" onClick={onClose}>Ir a la conversación</Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
