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
    const [errorMessage, setErrorMessage] = React.useState("");

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        const trimmedName = name.trim();
        if (!trimmedName) return;

        setIsSubmitting(true);
        setErrorMessage("");

        try {
            const res = await createShelf(trimmedName);
            if (res.error) {
                setErrorMessage(res.error);
                return;
            }

            onCreate(trimmedName);
            setName("");
            onClose();
        } catch (error) {
            console.error(error);
            setErrorMessage("No hemos podido crear la estantería. Inténtalo de nuevo.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Crear estantería" className="-translate-y-10 sm:translate-y-0">
            <form onSubmit={handleSubmit}>
                <div className="mb-6">
                    <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-grey/60">
                        Nombre de la estantería
                    </label>
                    <input
                        type="text"
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                        placeholder="Ej. Mis clásicos, Para debatir..."
                        className="w-full rounded-lg border border-teal/10 bg-cream/30 px-4 py-3 text-teal-dark transition-all focus:border-teal/30 focus:bg-white focus:outline-none"
                        autoFocus
                        disabled={isSubmitting}
                    />
                    <p className="mt-2 text-xs text-grey/40">Puedes mover libros aquí cuando quieras.</p>
                    {errorMessage && (
                        <p className="mt-3 rounded-lg border border-coral/20 bg-coral/10 px-3 py-2 text-xs font-medium text-coral">
                            {errorMessage}
                        </p>
                    )}
                </div>
                <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                    <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
                        Cancelar
                    </Button>
                    <Button type="submit" disabled={!name.trim() || isSubmitting} className="min-w-32 sm:min-w-28">
                        {isSubmitting ? "Creando..." : "Crear"}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
