'use client';

import { useState } from 'react';
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from '@headlessui/react';
import { WishlistItem } from '@/lib/mock-data';

interface CrowdfundingModalProps {
    isOpen: boolean;
    onClose: () => void;
    item: WishlistItem;
    onContribute: (amount: number) => void;
}

export function CrowdfundingModal({ isOpen, onClose, item, onContribute }: CrowdfundingModalProps) {
    const [amount, setAmount] = useState<string>('10');

    // Only if item exists
    if (!item || !item.crowdfunding) return null;

    const remaining = item.crowdfunding.target - item.crowdfunding.collected;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onContribute(Number(amount));
        onClose();
    };

    return (
        <Transition appear show={isOpen}>
            <Dialog as="div" className="relative z-50 focus:outline-none" onClose={onClose}>
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

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <label className="block text-sm font-medium text-grey">¿Cuánto quieres aportar?</label>
                            <div className="flex gap-2">
                                {[5, 10, 20, 50].map(val => (
                                    <button
                                        key={val}
                                        type="button"
                                        onClick={() => setAmount(val.toString())}
                                        className={`flex-1 py-2 rounded-lg border text-sm font-bold transition-all ${Number(amount) === val ? 'bg-teal text-white border-teal' : 'bg-white text-grey border-grey/20 hover:border-teal/50'}`}
                                    >
                                        {val}€
                                    </button>
                                ))}
                            </div>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-grey/40">Other:</span>
                                <input
                                    type="number"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    className="w-full pl-16 pr-4 py-2 border border-grey/20 rounded-lg focus:outline-none focus:border-teal"
                                    min="1"
                                    max={remaining}
                                    required
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-grey/40">€</span>
                            </div>

                            <button
                                type="submit"
                                className="w-full bg-coral text-white py-3 rounded-full font-bold shadow-md hover:bg-opacity-90 transition-all mt-4"
                            >
                                ¡Contribuir!
                            </button>
                        </form>
                    </DialogPanel>
                </div>
            </Dialog>
        </Transition>
    );
}
