"use client";

import { useState, useTransition } from "react";
import { Dialog, DialogPanel, DialogTitle, Transition } from "@headlessui/react";
import { WishlistItemData } from "@/app/app/wishes/item-actions";
import { Loader2 } from "lucide-react";

interface DedicationModalProps {
    isOpen: boolean;
    onClose: () => void;
    item: WishlistItemData | null;
    onAddDedication: (message: string, style: "classic" | "fun" | "romantic", from: string, isUnlocked: boolean, unlockDate?: string) => Promise<void>;
}

export function DedicationModal({ isOpen, onClose, item, onAddDedication }: DedicationModalProps) {
    const [message, setMessage] = useState("");
    const [fromName, setFromName] = useState("");
    const [style, setStyle] = useState<"classic" | "fun" | "romantic">("classic");
    const [unlockMode, setUnlockMode] = useState<"now" | "manual" | "date">("manual");
    const [unlockDate, setUnlockDate] = useState("");
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState("");

    const styles = {
        classic: { label: "Clásico 💌", bg: "bg-white", border: "border-grey/20" },
        fun: { label: "Divertido 🎉", bg: "bg-yellow-50", border: "border-yellow-200" },
        romantic: { label: "Romántico 💖", bg: "bg-pink-50", border: "border-pink-200" },
    };

    if (!item) return null;

    const handleSubmit = () => {
        setError("");

        if (!fromName.trim()) {
            setError("Por favor, dinos de parte de quién es.");
            return;
        }

        if (!message.trim()) {
            setError("Por favor, escribe un mensaje.");
            return;
        }

        if (unlockMode === "date" && !unlockDate) {
            setError("Por favor, selecciona una fecha de apertura.");
            return;
        }

        const isUnlocked = unlockMode === "now";
        const finalDate = unlockMode === "date" ? unlockDate : undefined;

        startTransition(async () => {
            try {
                await onAddDedication(message.trim(), style, fromName.trim(), isUnlocked, finalDate);
                onClose();
            } catch (err: any) {
                setError(err.message || "Error al guardar dedicatoria. Inténtalo de nuevo.");
            }
        });
    };

    return (
        <Transition appear show={isOpen}>
            <Dialog as="div" className="relative z-50 focus:outline-none" onClose={() => !isPending && onClose()}>
                <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" aria-hidden="true" />
                <div className="fixed inset-0 flex w-screen items-center justify-center p-4">
                    <DialogPanel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 shadow-xl border-2 border-dashed border-teal/20">
                        <DialogTitle
                            as="h3"
                            className="text-lg font-serif font-bold text-teal leading-6 mb-2 flex items-center gap-2"
                        >
                            <span>🕵️‍♂️</span> Dedicatoria Secreta
                        </DialogTitle>

                        <div className="mt-2">
                            <p className="text-sm text-grey/80 mb-4">
                                Escribe un mensaje para <strong>{item.title}</strong>. El dueño no podrá leerlo hasta que reciba el libro. 🤫
                            </p>

                            {error && (
                                <div className="bg-coral/10 text-coral text-sm p-3 rounded-lg border border-coral/20 mb-4">
                                    {error}
                                </div>
                            )}

                            {/* From Name */}
                            <div className="mb-4">
                                <label className="block text-xs font-bold text-grey/80 uppercase mb-1">
                                    De parte de...
                                </label>
                                <input
                                    type="text"
                                    value={fromName}
                                    onChange={(e) => setFromName(e.target.value)}
                                    placeholder="Ej: Laura y Jorge"
                                    className="w-full px-4 py-2 border border-grey/20 rounded-lg focus:outline-none focus:border-teal transition-colors"
                                    disabled={isPending}
                                />
                            </div>

                            {/* Style Selector */}
                            <div className="flex gap-2 mb-4">
                                {(Object.keys(styles) as Array<keyof typeof styles>).map((s) => (
                                    <button
                                        key={s}
                                        type="button"
                                        onClick={() => setStyle(s)}
                                        disabled={isPending}
                                        className={`flex-1 text-xs font-bold py-2 rounded-lg border-2 transition-all disabled:opacity-50 ${style === s ? "border-teal bg-teal/5 text-teal" : "border-grey/10 text-grey/60 hover:border-grey/30"}`}
                                    >
                                        {styles[s].label}
                                    </button>
                                ))}
                            </div>

                            {/* Message Input */}
                            <div className={`p-4 rounded-xl border-2 mb-4 transition-colors ${styles[style].bg} ${styles[style].border}`}>
                                <textarea
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    disabled={isPending}
                                    placeholder={style === "fun" ? "¡Escribe algo loco aquí!" : "Escribe tu mensaje..."}
                                    className="w-full bg-transparent border-none focus:outline-none text-sm p-0 placeholder-grey/40 min-h-[100px] resize-none"
                                />
                            </div>

                            {/* Unlock Options */}
                            <div className="bg-grey/5 p-4 rounded-xl border border-grey/10">
                                <label className="block text-xs font-bold text-grey/80 uppercase mb-3">
                                    ¿Cuándo podrá leer este mensaje?
                                </label>
                                <div className="space-y-2">
                                    <label className="flex items-center gap-2 text-sm text-grey disabled:opacity-50">
                                        <input
                                            type="radio"
                                            checked={unlockMode === "manual"}
                                            onChange={() => setUnlockMode("manual")}
                                            disabled={isPending}
                                            className="w-4 h-4 text-teal focus:ring-teal"
                                        />
                                        Hasta que yo lo bloquee manualmente 🔒
                                    </label>
                                    <label className="flex items-center gap-2 text-sm text-grey disabled:opacity-50">
                                        <input
                                            type="radio"
                                            checked={unlockMode === "date"}
                                            onChange={() => setUnlockMode("date")}
                                            disabled={isPending}
                                            className="w-4 h-4 text-teal focus:ring-teal"
                                        />
                                        El día exacto... 🗓️
                                    </label>
                                    {unlockMode === "date" && (
                                        <div className="pl-6 pt-1 pb-2">
                                            <input
                                                type="date"
                                                value={unlockDate}
                                                onChange={(e) => setUnlockDate(e.target.value)}
                                                disabled={isPending}
                                                className="px-3 py-1.5 border border-grey/20 rounded-md text-sm focus:outline-none focus:border-teal"
                                                min={new Date().toISOString().split("T")[0]}
                                            />
                                        </div>
                                    )}
                                    <label className="flex items-center gap-2 text-sm text-grey disabled:opacity-50">
                                        <input
                                            type="radio"
                                            checked={unlockMode === "now"}
                                            onChange={() => setUnlockMode("now")}
                                            disabled={isPending}
                                            className="w-4 h-4 text-teal focus:ring-teal"
                                        />
                                        Ahora mismo (ya puede leerlo) 🔓
                                    </label>
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 flex flex-col sm:flex-row justify-end gap-3">
                            <button
                                type="button"
                                className="inline-flex justify-center rounded-full border border-transparent px-4 py-2 text-sm font-medium text-grey/60 hover:bg-grey/10 focus:outline-none disabled:opacity-50"
                                onClick={onClose}
                                disabled={isPending}
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                disabled={isPending}
                                className="inline-flex justify-center items-center gap-2 rounded-full border border-transparent bg-teal px-6 py-2 text-sm font-bold text-white hover:bg-opacity-90 transition-all disabled:opacity-50 shadow-md"
                                onClick={handleSubmit}
                            >
                                {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Guardar Secreto 🔒"}
                            </button>
                        </div>
                    </DialogPanel>
                </div>
            </Dialog>
        </Transition>
    );
}
