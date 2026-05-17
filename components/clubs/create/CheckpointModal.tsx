import * as React from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface Checkpoint {
    id: string;
    title: string;
    start: string;
    end: string;
    date: string;
    questions?: string[];
}

interface CheckpointModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (checkpoint: Checkpoint) => void;
    initialData?: Checkpoint;
    unitLabel: string; // e.g., "p.", "cap.", "%"
}

export function CheckpointModal({ isOpen, onClose, onSave, initialData, unitLabel }: CheckpointModalProps) {
    const [title, setTitle] = React.useState(initialData?.title || "");
    const [start, setStart] = React.useState(initialData?.start || "");
    const [end, setEnd] = React.useState(initialData?.end || "");
    const [date, setDate] = React.useState(initialData?.date || "");
    const [questions, setQuestions] = React.useState<string[]>(initialData?.questions || []);
    const [questionDraft, setQuestionDraft] = React.useState("");

    React.useEffect(() => {
        if (isOpen) {
            setTitle(initialData?.title || "");
            setStart(initialData?.start || "");
            setEnd(initialData?.end || "");
            setDate(initialData?.date || "");
            setQuestions(initialData?.questions || []);
            setQuestionDraft("");
        }
    }, [isOpen, initialData]);

    if (!isOpen) return null;

    const handleSave = () => {
        if (!title || !start || !end) return; // Simple validation
        onSave({
            id: initialData?.id || Math.random().toString(36).substr(2, 9),
            title,
            start,
            end,
            date,
            questions,
        });
        onClose();
    };

    const addQuestion = () => {
        const clean = questionDraft.trim();
        if (!clean) return;
        setQuestions((current) => [...current, clean]);
        setQuestionDraft("");
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-fade-in-up">
                <div className="p-6">
                    <h3 className="text-lg font-serif text-teal mb-4">
                        {initialData ? "Editar Checkpoint" : "Nuevo Checkpoint"}
                    </h3>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-grey-dark mb-1.5">Título</label>
                            <Input
                                placeholder="Ej. El comienzo"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                autoFocus
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-grey-dark mb-1.5">Inicio ({unitLabel})</label>
                                <Input
                                    type="number"
                                    placeholder="0"
                                    value={start}
                                    onChange={(e) => setStart(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-grey-dark mb-1.5">Fin ({unitLabel})</label>
                                <Input
                                    type="number"
                                    placeholder="100"
                                    value={end}
                                    onChange={(e) => setEnd(e.target.value)}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-grey-dark mb-1.5">Fecha límite (Opcional)</label>
                            <Input
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-grey-dark mb-1.5">Preguntas guia</label>
                            <div className="flex gap-2">
                                <Input
                                    placeholder="Ej. Que te ha sorprendido?"
                                    value={questionDraft}
                                    onChange={(e) => setQuestionDraft(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                            e.preventDefault();
                                            addQuestion();
                                        }
                                    }}
                                />
                                <Button type="button" variant="outline" onClick={addQuestion}>+</Button>
                            </div>
                            {questions.length > 0 && (
                                <div className="mt-2 flex flex-wrap gap-2">
                                    {questions.map((question, index) => (
                                        <span key={`${question}-${index}`} className="inline-flex items-center gap-2 rounded-full border border-teal/15 bg-teal/5 px-3 py-1 text-xs font-medium text-teal-dark">
                                            {question}
                                            <button
                                                type="button"
                                                onClick={() => setQuestions((current) => current.filter((_, currentIndex) => currentIndex !== index))}
                                                className="text-grey/40 hover:text-coral"
                                                aria-label="Eliminar pregunta"
                                            >
                                                x
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            )}
                            <p className="mt-1 text-xs text-grey/45">Pulsa Enter para crear cada pregunta.</p>
                        </div>
                    </div>

                    <div className="mt-8 flex justify-end gap-3">
                        <Button variant="ghost" onClick={onClose}>Cancelar</Button>
                        <Button variant="primary" onClick={handleSave}>Guardar</Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
