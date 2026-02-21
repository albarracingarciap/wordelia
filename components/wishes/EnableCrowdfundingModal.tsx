"use client";

import { useState, useTransition } from "react";
import { Dialog, DialogPanel, DialogTitle, Transition } from "@headlessui/react";
import { WishlistItemData } from "@/app/app/wishes/item-actions";
import { Loader2 } from "lucide-react";

interface EnableCrowdfundingModalProps {
    isOpen: boolean;
    onClose: () => void;
    item: WishlistItemData | null;
    onEnable: (targetAmount: number) => Promise<void>;
}

export function EnableCrowdfundingModal({ isOpen, onClose, item, onEnable }: EnableCrowdfundingModalProps) {
    const [amount, setAmount] = useState<string>(item?.price?.toString() || "");
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState("");

    if (!item) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        const numAmount = Number(amount);
        if (numAmount <= 0) {
            setError("La cantidad debe ser mayor que 0.");
            return;
        }

        startTransition(async () => {
            try {
                await onEnable(numAmount);
                onClose();
            } catch (err: any) {
                setError(err.message || "Error al activar bote. Inténtalo de nuevo.");
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
                            Activar Bote 🎁
                        </DialogTitle>

                        <p className="text-sm text-grey/70 mb-6">
                            Permite que varios amigos contribuyan con dinero para comprarte "{item.title}".
                        </p>

                        {error && (
                            <div className="bg-coral/10 text-coral text-sm p-3 rounded-lg border border-coral/20 mb-4">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-grey mb-1">
                                    ¿Cuál es el precio objetivo?
                                </label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        placeholder="Ej: 24.90"
                                        step="0.01"
                                        className="w-full px-4 py-2 border border-grey/20 rounded-lg focus:outline-none focus:border-teal transition-colors pr-8"
                                        disabled={isPending}
                                        required
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-grey/40">€</span>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isPending}
                                className="w-full bg-teal text-white py-3 rounded-xl font-bold hover:bg-opacity-90 transition-all flex items-center justify-center gap-2"
                            >
                                {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Empezar bote"}
                            </button>
                        </form>
                    </DialogPanel>
                </div>
            </Dialog>
        </Transition>
    );
}
