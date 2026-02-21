"use client";

import { Dialog, DialogPanel, DialogTitle, Transition } from "@headlessui/react";
import { WishlistItemData } from "@/app/app/wishes/item-actions";
import { MailOpen } from "lucide-react";

interface ReadDedicationModalProps {
    isOpen: boolean;
    onClose: () => void;
    item: WishlistItemData | null;
}

export function ReadDedicationModal({ isOpen, onClose, item }: ReadDedicationModalProps) {
    if (!item || !item.dedication) return null;

    const { message, style, from } = item.dedication;

    const styles = {
        classic: { bg: "bg-white", border: "border-grey/20", emoji: "💌" },
        fun: { bg: "bg-yellow-50", border: "border-yellow-200", emoji: "🎉" },
        romantic: { bg: "bg-pink-50", border: "border-pink-200", emoji: "💖" },
    };

    const currentStyle = styles[style as keyof typeof styles] || styles.classic;

    return (
        <Transition appear show={isOpen}>
            <Dialog as="div" className="relative z-50 focus:outline-none" onClose={onClose}>
                <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" aria-hidden="true" />
                <div className="fixed inset-0 flex w-screen items-center justify-center p-4">
                    <DialogPanel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 shadow-xl border-2 border-dashed border-teal/20 text-center">
                        <div className="w-16 h-16 bg-teal/10 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
                            {currentStyle.emoji}
                        </div>

                        <DialogTitle as="h3" className="text-xl font-serif font-bold text-teal mb-1">
                            ¡Tienes un mensaje secreto!
                        </DialogTitle>

                        <p className="text-sm text-grey/60 mb-6">
                            Adjunto a <strong>{item.title}</strong>
                        </p>

                        <div className={`p-6 rounded-2xl border-2 mb-6 text-left relative ${currentStyle.bg} ${currentStyle.border}`}>
                            <p className="text-grey/90 whitespace-pre-wrap font-medium italic text-lg leading-relaxed">
                                "{message}"
                            </p>
                            <p className="text-right text-sm text-grey/70 mt-4 font-bold">
                                — {from}
                            </p>
                        </div>

                        <button
                            type="button"
                            className="w-full bg-teal text-white py-3 rounded-xl font-bold shadow-md hover:bg-opacity-90 transition-all flex items-center justify-center gap-2"
                            onClick={onClose}
                        >
                            <MailOpen className="w-5 h-5" />
                            Cerrar mensaje
                        </button>
                    </DialogPanel>
                </div>
            </Dialog>
        </Transition>
    );
}
