import * as React from "react";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { createShelf } from "@/app/app/mi-lectura/actions";

interface CreateShelfModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreate: (name: string) => void;
}

export function CreateShelfModal({ isOpen, onClose, onCreate }: CreateShelfModalProps) {
    const [name, setName] = React.useState("");
    const [isSubmitting, setIsSubmitting] = React.useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (name.trim()) {
            setIsSubmitting(true);
            try {
                const res = await createShelf(name);
                if (res.error) {
                    alert("Error: " + res.error);
                } else {
                    onCreate(name);
                    setName("");
                    onClose();
                }
            } catch (error) {
                console.error(error);
            } finally {
                setIsSubmitting(false);
            }
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Crear estantería">
            <form onSubmit={handleSubmit}>
                <div className="mb-6">
                    <label className="block text-xs font-bold text-grey/60 uppercase tracking-widest mb-2">
                        Nombre de la estantería
                    </label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Ej. Mis clásicos, Para debatir..."
                        className="w-full bg-cream/30 border border-teal/10 rounded-lg px-4 py-2 text-teal-dark focus:outline-none focus:border-teal/30 focus:bg-white transition-all"
                        autoFocus
                        disabled={isSubmitting}
                    />
                    <p className="text-xs text-grey/40 mt-2">Puedes mover libros aquí cuando quieras.</p>
                </div>
                <div className="flex justify-end gap-3">
                    <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>Cancelar</Button>
                    <Button type="submit" disabled={!name.trim() || isSubmitting}>
                        {isSubmitting ? "Creando..." : "Crear"}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
