import * as React from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface Checkpoint {
    id: string;
    title: string;
    start: string;
    end: string;
    date: string;
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

    React.useEffect(() => {
        if (isOpen) {
            setTitle(initialData?.title || "");
            setStart(initialData?.start || "");
            setEnd(initialData?.end || "");
            setDate(initialData?.date || "");
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
            date
        });
        onClose();
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
