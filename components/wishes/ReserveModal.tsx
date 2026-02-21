"use client";

import { useState, useTransition } from "react";
import { Dialog, DialogPanel, DialogTitle, Transition } from "@headlessui/react";
import { WishlistItemData } from "@/app/app/wishes/item-actions";
import { Loader2 } from "lucide-react";

interface ReserveModalProps {
    isOpen: boolean;
    onClose: () => void;
    item: WishlistItemData | null;
    onReserve: (name: string) => Promise<void>;
}

export function ReserveModal({ isOpen, onClose, item, onReserve }: ReserveModalProps) {
    const [name, setName] = useState("");
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState("");

    if (!item) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!name.trim()) {
            setError("Por favor, introduce tu nombre.");
            return;
        }

        startTransition(async () => {
            try {
                await onReserve(name.trim());
                setName("");
                onClose();
            } catch (err: any) {
                setError(err.message || "Error al reservar. Inténtalo de nuevo.");
            }
        });
    };

    return (
        <Transition appear show={isOpen}>
            <Dialog as="div" className="relative z-50 focus:outline-none" onClose={() => !isPending && onClose()}>
                <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" aria-hidden="true" />
                <div className="fixed inset-0 flex w-screen items-center justify-center p-4">
                    <DialogPanel className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl border border-teal/10">
                        <DialogTitle as="h3" className="font-serif text-xl font-bold text-teal mb-2">
                            Reservar "{item.title}" 🎁
                        </DialogTitle>

                        <p className="text-sm text-grey/70 mb-6">
                            Reservar un regalo oculta este ítem para los demás amigos, evitando regalos duplicados. El dueño de la lista no lo sabrá.
                        </p>

                        {error && (
                            <div className="bg-coral/10 text-coral text-sm p-3 rounded-lg border border-coral/20 mb-4">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-grey mb-1">
                                    ¿A nombre de quién reservar?
                                </label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Ej: Ana (tu hermana)"
                                    className="w-full px-4 py-2 border border-grey/20 rounded-lg focus:outline-none focus:border-teal transition-colors"
                                    disabled={isPending}
                                    required
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isPending}
                                className="w-full bg-teal text-white py-3 rounded-xl font-bold hover:bg-opacity-90 transition-all flex items-center justify-center gap-2"
                            >
                                {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirmar reserva"}
                            </button>
                        </form>
                    </DialogPanel>
                </div>
            </Dialog>
        </Transition>
    );
}
