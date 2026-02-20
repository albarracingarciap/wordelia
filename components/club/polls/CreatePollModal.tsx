"use client";

import * as React from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Plus, X } from "lucide-react";

interface CreatePollModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreate: (question: string, options: string[]) => Promise<void>;
}

export function CreatePollModal({ isOpen, onClose, onCreate }: CreatePollModalProps) {
    const [question, setQuestion] = React.useState("");
    const [options, setOptions] = React.useState(["", ""]);
    const [isSubmitting, setIsSubmitting] = React.useState(false);

    const handleAddOption = () => {
        setOptions([...options, ""]);
    };

    const handleRemoveOption = (index: number) => {
        setOptions(options.filter((_, i) => i !== index));
    };

    const handleOptionChange = (index: number, value: string) => {
        const newOptions = [...options];
        newOptions[index] = value;
        setOptions(newOptions);
    };

    const handleSubmit = async () => {
        if (!question.trim()) return;
        const validOptions = options.filter(o => o.trim());
        if (validOptions.length < 2) return;

        setIsSubmitting(true);
        await onCreate(question, validOptions);
        setIsSubmitting(false);
        onClose();
        // Reset form
        setQuestion("");
        setOptions(["", ""]);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Crear votación">
            <div className="space-y-6">
                <div>
                    <label className="block text-sm font-bold text-grey-dark mb-1.5">Pregunta</label>
                    <Input
                        placeholder="¿Qué leemos la próxima vez?"
                        value={question}
                        onChange={(e) => setQuestion(e.target.value)}
                    />
                </div>

                <div>
                    <label className="block text-sm font-bold text-grey-dark mb-1.5">Opciones</label>
                    <div className="space-y-2">
                        {options.map((option, index) => (
                            <div key={index} className="flex gap-2">
                                <Input
                                    placeholder={`Opción ${index + 1}`}
                                    value={option}
                                    onChange={(e) => handleOptionChange(index, e.target.value)}
                                />
                                {options.length > 2 && (
                                    <button
                                        onClick={() => handleRemoveOption(index)}
                                        className="text-grey/40 hover:text-coral transition-colors"
                                    >
                                        <X size={18} />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="mt-2 text-teal hover:text-teal-dark p-0 h-auto font-normal"
                        onClick={handleAddOption}
                    >
                        <Plus size={16} className="mr-1" /> Añadir opción
                    </Button>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-grey/10">
                    <Button variant="ghost" onClick={onClose}>
                        Cancelar
                    </Button>
                    <Button
                        variant="primary"
                        onClick={handleSubmit}
                        disabled={!question.trim() || options.filter(o => o.trim()).length < 2 || isSubmitting}
                    >
                        {isSubmitting ? "Creando..." : "Lanzar votación"}
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
