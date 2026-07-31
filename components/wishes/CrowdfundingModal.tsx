"use client";

import { useState, useTransition } from "react";
import { Dialog, DialogPanel, DialogTitle, Transition } from "@headlessui/react";
import { WishlistItemData } from "@/app/app/wishes/item-actions";
import { Loader2 } from "lucide-react";

interface CrowdfundingModalProps {
    isOpen: boolean;
    onClose: () => void;
    item: WishlistItemData | null;
    onContribute: (amount: number, note?: string, anonymous?: boolean) => Promise<void>;
}

export function CrowdfundingModal({ isOpen, onClose, item, onContribute }: CrowdfundingModalProps) {
    const [amount, setAmount] = useState<string>("10");
    const [note, setNote] = useState("");
    const [anonymous, setAnonymous] = useState(false);
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState("");

    if (!item || !item.crowdfunding) return null;

    const remaining = item.crowdfunding.target - item.crowdfunding.collected;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        const numAmount = Number(amount);
        if (numAmount <= 0) {
            setError("La cantidad debe ser mayor que 0.");
            return;
        }
        if (numAmount > remaining) {
            setError(`La cantidad máxima restante es ${remaining.toFixed(2)}€.`);
            return;
        }

        startTransition(async () => {
            try {
                await onContribute(numAmount, note.trim() || undefined, anonymous);
                onClose();
            } catch (err: any) {
                setError(err.message || "Error al contribuir. Inténtalo de nuevo.");
            }
        });
    };

    return (
        <Transition appear show={isOpen}>
            <Dialog as="div" className="relative z-50 focus:outline-none" onClose={() => !isPending && onClose()}>
                <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" aria-hidden="true" />
                <div className="fixed inset-0 flex w-screen items-center justify-center p-4">
                    <DialogPanel className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl border border-teal/10">
                        <DialogTitle as="h3" className="font-serif text-xl font-bold text-teal mb-4">
                            Contribuir a "{item.title}" 🎁
                        </DialogTitle>

                        <div className="mb-6 space-y-2">
                            <div className="flex justify-between text-sm mb-1">
                                <span className="text-grey/60">Recaudado</span>
                                <span className="font-bold text-teal">{item.crowdfunding.collected.toFixed(2)}€ <span className="text-grey/40 font-normal">de {item.crowdfunding.target}€</span></span>
                            </div>
                            <div className="h-2 w-full bg-grey/10 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-teal transition-all duration-500"
                                    style={{ width: `${(item.crowdfunding.collected / item.crowdfunding.target) * 100}%` }}
                                />
                            </div>
                            <p className="text-xs text-grey/60 text-right">Faltan {remaining.toFixed(2)}€</p>
                        </div>

                        {error && (
                            <div className="bg-coral/10 text-coral text-sm p-3 rounded-lg border border-coral/20 mb-4">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <label className="block text-sm font-medium text-grey">¿Cuánto quieres aportar?</label>
                            <div className="flex gap-2">
                                {[5, 10, 20, 50].map(val => {
                                    const disabled = val > remaining;
                                    return (
                                        <button
                                            key={val}
                                            type="button"
                                            disabled={disabled || isPending}
                                            onClick={() => setAmount(val.toString())}
                                            className={`flex-1 py-2 rounded-lg border text-sm font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed ${Number(amount) === val ? "bg-teal text-white border-teal" : "bg-white text-grey border-grey/20 hover:border-teal/50"}`}
                                        >
                                            {val}€
                                        </button>
                                    );
                                })}
                            </div>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-grey/40">Other:</span>
                                <input
                                    type="number"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    className="w-full pl-16 pr-4 py-2 border border-grey/20 rounded-lg focus:outline-none focus:border-teal transition-colors"
                                    min="1"
                                    max={remaining}
                                    step="0.01"
                                    disabled={isPending}
                                    required
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-grey/40">€</span>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-grey mb-1">Nota (opcional)</label>
                                <textarea
                                    value={note}
                                    onChange={(e) => setNote(e.target.value)}
                                    rows={2}
                                    maxLength={200}
                                    placeholder="Un mensaje para acompañar tu aportación…"
                                    disabled={isPending}
                                    className="w-full resize-none rounded-lg border border-grey/20 px-4 py-2 text-sm focus:border-teal focus:outline-none"
                                />
                            </div>

                            <label className="flex items-center gap-2 text-sm text-grey/80">
                                <input
                                    type="checkbox"
                                    checked={anonymous}
                                    onChange={(e) => setAnonymous(e.target.checked)}
                                    disabled={isPending}
                                    className="h-4 w-4 accent-teal"
                                />
                                Contribuir de forma anónima
                            </label>

                            <button
                                type="submit"
                                disabled={isPending}
                                className="w-full bg-coral text-white py-3 rounded-xl font-bold shadow-md hover:bg-opacity-90 transition-all mt-4 flex justify-center items-center gap-2"
                            >
                                {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "¡Contribuir!"}
                            </button>
                        </form>
                    </DialogPanel>
                </div>
            </Dialog>
        </Transition>
    );
}
