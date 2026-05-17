import * as React from "react";
import { Button } from "@/components/ui/Button";
import { CheckpointEmotionActions } from "./ClubEmotionMap";

interface CheckpointDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    onGoToConversation?: () => void;
    isCompleted?: boolean;
    onComplete?: () => Promise<{ error?: string } | void> | { error?: string } | void;
    onRevert?: () => Promise<{ error?: string } | void> | { error?: string } | void;
    checkpoint: {
        title: string;
        range: string;
        deadline?: string;
        questions?: string[];
    };
    emotionContext?: React.ComponentProps<typeof CheckpointEmotionActions>["context"];
}

export function CheckpointDetailModal({ isOpen, onClose, onGoToConversation, isCompleted = false, onComplete, onRevert, checkpoint, emotionContext }: CheckpointDetailModalProps) {
    const [statusMessage, setStatusMessage] = React.useState<string | null>(null);
    const [completed, setCompleted] = React.useState(isCompleted);
    const [isSaving, setIsSaving] = React.useState(false);

    React.useEffect(() => {
        if (isOpen) {
            setCompleted(isCompleted);
            setStatusMessage(isCompleted ? "Este tramo ya está marcado como completado." : null);
        }
    }, [isOpen, checkpoint.title, isCompleted]);

    const handleComplete = async () => {
        setIsSaving(true);
        setStatusMessage(null);

        try {
            const result = await onComplete?.();
            if (result?.error) {
                setStatusMessage(result.error);
                return;
            }

            setCompleted(true);
            setStatusMessage("Perfecto, dejamos este tramo como completado para seguir avanzando.");
        } catch (error) {
            console.error("Error completing checkpoint:", error);
            setStatusMessage("No hemos podido guardar este checkpoint.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleRevert = async () => {
        if (!completed) {
            setStatusMessage("Sin prisa. Este tramo seguirá esperándote cuando llegues.");
            return;
        }

        setIsSaving(true);
        setStatusMessage(null);

        try {
            const result = await onRevert?.();
            if (result?.error) {
                setStatusMessage(result.error);
                return;
            }

            setCompleted(false);
            setStatusMessage("Listo, dejamos este tramo como pendiente.");
        } catch (error) {
            console.error("Error reverting checkpoint:", error);
            setStatusMessage("No hemos podido marcar este checkpoint como pendiente.");
        } finally {
            setIsSaving(false);
        }
    };

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
                            <Button variant="primary" onClick={handleComplete} disabled={completed || isSaving}>
                                {completed ? "Completado" : isSaving ? "Guardando..." : "Sí, completado"}
                            </Button>
                            <Button variant="outline" onClick={handleRevert} disabled={isSaving}>
                                {completed ? "Marcar como pendiente" : "Aún no"}
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
                                Aún no hay preguntas para este tramo.
                            </p>
                        )}
                    </div>

                    {emotionContext && <CheckpointEmotionActions context={emotionContext} />}

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
