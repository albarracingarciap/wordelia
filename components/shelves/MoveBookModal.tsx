import * as React from "react";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { addBookToShelf, getUserShelves, startReadingBook, Shelf } from "@/app/app/mi-lectura/actions";
import { createClient } from "@/utils/supabase/client";

interface MoveBookModalProps {
    isOpen: boolean;
    onClose: () => void;
    bookTitle: string;
    bookId: string; // Passed from parent
    onMoveComplete?: () => void;
}

export function MoveBookModal({ isOpen, onClose, bookTitle, bookId, onMoveComplete }: MoveBookModalProps) {
    const [selectedTarget, setSelectedTarget] = React.useState<string>("");
    const [customShelves, setCustomShelves] = React.useState<Shelf[]>([]);
    const [isSubmitting, setIsSubmitting] = React.useState(false);

    // System statuses
    const SYSTEM_TARGETS = [
        { id: "READING", label: "Leyendo (Estado)" },
        { id: "WANT_TO_READ", label: "Por leer (Estado)" },
        { id: "READ", label: "Leído (Estado)" },
        { id: "PAUSED", label: "Pausado (Estado)" },
        { id: "DNF", label: "Abandonado (Estado)" },
    ];

    React.useEffect(() => {
        if (isOpen) {
            // Load custom shelves
            getUserShelves().then(setCustomShelves);
        }
    }, [isOpen]);

    const handleSave = async () => {
        if (!selectedTarget) return;
        setIsSubmitting(true);
        const supabase = createClient();

        try {
            // Check if system target or custom shelf
            const isSystem = SYSTEM_TARGETS.find(t => t.id === selectedTarget);

            if (isSystem) {
                // Update Status
                const { error } = await supabase
                    .from("user_books")
                    .update({ status: selectedTarget, updated_at: new Date().toISOString() })
                    .eq("book_id", bookId);

                if (error) throw error;

            } else {
                // Add to Custom Shelf (Lists)
                const res = await addBookToShelf(bookId, selectedTarget);
                if (res.error) throw new Error(res.error);
            }

            if (onMoveComplete) onMoveComplete();
            onClose();
        } catch (error: any) {
            alert("Error al mover el libro: " + error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Mover a...">
            <div className="mb-6">
                <p className="text-sm text-grey/60 mb-4">
                    Selecciona dónde quieres mover <span className="font-bold text-teal">{bookTitle}</span>
                </p>

                <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                    <p className="text-xs font-bold text-grey/40 uppercase tracking-widest mb-1 mt-2">Cambiar Estado</p>
                    {SYSTEM_TARGETS.map((target) => (
                        <label key={target.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-cream/50 cursor-pointer transition-colors border border-transparent hover:border-teal/5">
                            <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${selectedTarget === target.id ? "border-coral bg-coral" : "border-grey/30 bg-white"}`}>
                                {selectedTarget === target.id && <div className="w-2 h-2 rounded-full bg-white" />}
                            </div>
                            <input
                                type="radio"
                                name="target"
                                value={target.id}
                                checked={selectedTarget === target.id}
                                onChange={() => setSelectedTarget(target.id)}
                                className="hidden"
                            />
                            <span className={`text-sm ${selectedTarget === target.id ? "text-teal font-medium" : "text-grey"}`}>{target.label}</span>
                        </label>
                    ))}

                    {customShelves.length > 0 && (
                        <>
                            <p className="text-xs font-bold text-grey/40 uppercase tracking-widest mb-1 mt-4">Añadir a Colección</p>
                            {customShelves.map((shelf) => (
                                <label key={shelf.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-cream/50 cursor-pointer transition-colors border border-transparent hover:border-teal/5">
                                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${selectedTarget === shelf.id ? "border-coral bg-coral" : "border-grey/30 bg-white"}`}>
                                        {selectedTarget === shelf.id && <div className="w-2 h-2 rounded-full bg-white" />}
                                    </div>
                                    <input
                                        type="radio"
                                        name="target"
                                        value={shelf.id}
                                        checked={selectedTarget === shelf.id}
                                        onChange={() => setSelectedTarget(shelf.id)}
                                        className="hidden"
                                    />
                                    <span className={`text-sm ${selectedTarget === shelf.id ? "text-teal font-medium" : "text-grey"}`}>{shelf.name}</span>
                                </label>
                            ))}
                        </>
                    )}
                </div>
            </div>
            <div className="flex justify-end gap-3">
                <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>Cancelar</Button>
                <Button onClick={handleSave} disabled={!selectedTarget || isSubmitting}>
                    {isSubmitting ? "Guardando..." : "Guardar cambios"}
                </Button>
            </div>
        </Modal>
    );
}
