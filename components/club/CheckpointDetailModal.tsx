import * as React from "react";
import { Button } from "@/components/ui/Button";

interface CheckpointDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    onGoToConversation?: () => void;
    checkpoint: {
        title: string;
        range: string;
        deadline?: string;
        questions?: string[];
    };
}

export function CheckpointDetailModal({ isOpen, onClose, onGoToConversation, checkpoint }: CheckpointDetailModalProps) {
    const [statusMessage, setStatusMessage] = React.useState<string | null>(null);

    React.useEffect(() => {
        if (isOpen) setStatusMessage(null);
    }, [isOpen, checkpoint.title]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in-up">
                <div className="bg-teal/5 p-6 border-b border-teal/10 flex justify-between items-start">
                    <div>
                        <span className="block text-xs font-bold text-teal uppercase tracking-widest mb-1">Checkpoint actual</span>
                        <h2 className="text-2xl text-teal-dark font-bold">{checkpoint.title}</h2>
                        <p className="text-sm text-grey/60 mt-1">{checkpoint.range}</p>
                    </div>
                    <button onClick={onClose} className="text-grey/40 hover:text-coral transition-colors" aria-label="Cerrar">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    <div className="bg-[#FAF9F6] rounded-xl p-4 border border-black/5">
                        <h3 className="font-bold text-sm text-grey-dark mb-3">Has llegado a este punto?</h3>
                        <div className="grid gap-2 sm:grid-cols-2">
                            <Button variant="primary" onClick={() => setStatusMessage("Perfecto, dejamos este tramo como completado para seguir avanzando.")}>
                                Si, completado
                            </Button>
                            <Button variant="outline" onClick={() => setStatusMessage("Sin prisa. Este tramo seguira esperandote cuando llegues.")}>
                                Aun no
                            </Button>
                        </div>
                        {statusMessage && (
                            <p className="mt-3 rounded-2xl bg-white px-4 py-3 text-sm font-medium leading-6 text-teal-dark">
                                {statusMessage}
                            </p>
                        )}
                    </div>

                    <div>
                        <h3 className="font-bold text-sm text-grey-dark mb-3">Preguntas guia</h3>
                        {checkpoint.questions?.length ? (
                            <div className="space-y-3">
                                {checkpoint.questions.map((question, index) => (
                                    <div key={`${question}-${index}`} className="p-3 bg-white border border-grey/10 rounded-lg text-sm text-grey/70">
                                        {question}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="p-3 bg-white border border-grey/10 rounded-lg text-sm text-grey/50">
                                Aun no hay preguntas para este tramo.
                            </p>
                        )}
                    </div>

                    <div className="pt-2">
                        <Button
                            variant="secondary"
                            className="w-full"
                            onClick={() => {
                                onClose();
                                onGoToConversation?.();
                            }}
                        >
                            Ir a la conversacion
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
