import * as React from "react";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { addBookToShelf, getUserShelves, Shelf } from "@/app/app/mi-lectura/actions";
import { createClient } from "@/utils/supabase/client";

interface MoveBookModalProps {
    isOpen: boolean;
    onClose: () => void;
    bookTitle: string;
    bookId: string;
    onMoveComplete?: () => void;
}

const SYSTEM_TARGETS = [
    { id: "READING", label: "Leyendo", detail: "Cambiar estado" },
    { id: "WANT_TO_READ", label: "Por leer", detail: "Cambiar estado" },
    { id: "READ", label: "Leído", detail: "Cambiar estado" },
    { id: "PAUSED", label: "Pausado", detail: "Cambiar estado" },
    { id: "DNF", label: "Abandonado", detail: "Cambiar estado" },
];

type TargetOptionProps = {
    id: string;
    label: string;
    detail: string;
    selectedTarget: string;
    onSelect: (id: string) => void;
};

function TargetOption({ id, label, detail, selectedTarget, onSelect }: TargetOptionProps) {
    const isSelected = selectedTarget === id;

    return (
        <button
            type="button"
            onClick={() => onSelect(id)}
            className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-all ${
                isSelected
                    ? "border-teal/20 bg-teal/10 text-teal"
                    : "border-transparent bg-white text-grey hover:border-teal/10 hover:bg-teal/5"
            }`}
        >
            <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-all ${isSelected ? "border-coral bg-coral" : "border-grey/30 bg-white"}`}>
                {isSelected && <span className="h-2 w-2 rounded-full bg-white" />}
            </span>
            <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold">{label}</span>
                <span className="block text-xs text-grey/50">{detail}</span>
            </span>
        </button>
    );
}

export function MoveBookModal({ isOpen, onClose, bookTitle, bookId, onMoveComplete }: MoveBookModalProps) {
    const [selectedTarget, setSelectedTarget] = React.useState("");
    const [customShelves, setCustomShelves] = React.useState<Shelf[]>([]);
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const [errorMessage, setErrorMessage] = React.useState("");

    React.useEffect(() => {
        if (!isOpen) return;

        setSelectedTarget("");
        setErrorMessage("");
        getUserShelves().then(setCustomShelves);
    }, [isOpen]);

    const handleSave = async () => {
        if (!selectedTarget) return;

        setIsSubmitting(true);
        setErrorMessage("");
        const supabase = createClient();

        try {
            const isSystem = SYSTEM_TARGETS.some((target) => target.id === selectedTarget);

            if (isSystem) {
                const { error } = await supabase
                    .from("user_books")
                    .update({ status: selectedTarget, updated_at: new Date().toISOString() })
                    .eq("book_id", bookId);

                if (error) throw error;
            } else {
                const res = await addBookToShelf(bookId, selectedTarget);
                if (res.error) throw new Error(res.error);
            }

            onMoveComplete?.();
            onClose();
        } catch (error) {
            console.error(error);
            setErrorMessage(error instanceof Error ? error.message : "No hemos podido mover el libro.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Mover libro" className="-translate-y-8 sm:translate-y-0">
            <div className="mb-6">
                <p className="mb-4 text-sm leading-relaxed text-grey/60">
                    Selecciona dónde quieres mover{" "}
                    <span className="font-bold text-teal">{bookTitle}</span>.
                </p>

                <div className="max-h-[42dvh] space-y-4 overflow-y-auto pr-1 hide-scrollbar sm:max-h-72">
                    <section>
                        <p className="mb-2 text-xs font-bold uppercase tracking-widest text-grey/40">Cambiar estado</p>
                        <div className="space-y-2">
                            {SYSTEM_TARGETS.map((target) => (
                                <TargetOption
                                    key={target.id}
                                    id={target.id}
                                    label={target.label}
                                    detail={target.detail}
                                    selectedTarget={selectedTarget}
                                    onSelect={setSelectedTarget}
                                />
                            ))}
                        </div>
                    </section>

                    {customShelves.length > 0 && (
                        <section>
                            <p className="mb-2 text-xs font-bold uppercase tracking-widest text-grey/40">Añadir a colección</p>
                            <div className="space-y-2">
                                {customShelves.map((shelf) => (
                                    <TargetOption
                                        key={shelf.id}
                                        id={shelf.id}
                                        label={shelf.name}
                                        detail={`${shelf.count} libros`}
                                        selectedTarget={selectedTarget}
                                        onSelect={setSelectedTarget}
                                    />
                                ))}
                            </div>
                        </section>
                    )}
                </div>

                {errorMessage && (
                    <p className="mt-3 rounded-lg border border-coral/20 bg-coral/10 px-3 py-2 text-xs font-medium text-coral">
                        {errorMessage}
                    </p>
                )}
            </div>
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
                    Cancelar
                </Button>
                <Button onClick={handleSave} disabled={!selectedTarget || isSubmitting} className="min-w-40">
                    {isSubmitting ? "Guardando..." : "Guardar cambios"}
                </Button>
            </div>
        </Modal>
    );
}
