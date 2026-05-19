"use client";

import { Gift, Heart, Plus } from "lucide-react";

interface EmptyGiftRecipientsProps {
    onAddClick: () => void;
}

export function EmptyGiftRecipients({ onAddClick }: EmptyGiftRecipientsProps) {
    return (
        <div className="flex min-h-[52dvh] flex-col items-center justify-center gap-6 px-4 py-16 text-center animate-in fade-in slide-in-from-bottom-2 duration-400">
            <div className="relative">
                <div className="flex h-28 w-28 items-center justify-center rounded-full bg-teal/10">
                    <Gift className="h-14 w-14 text-teal/60" strokeWidth={1.5} />
                </div>
                <div className="absolute -right-1 -top-1 flex h-9 w-9 items-center justify-center rounded-full bg-coral/10">
                    <Heart className="h-5 w-5 text-coral" />
                </div>
            </div>

            <div className="max-w-md">
                <h2 className="font-serif text-2xl text-teal sm:text-3xl">
                    Empieza tu radar de regalos
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-grey/60 sm:text-base">
                    Añade a una persona, guarda sus gustos lectores y prepara ideas en secreto para próximas fechas.
                </p>
            </div>

            <button
                type="button"
                onClick={onAddClick}
                className="inline-flex h-12 items-center gap-2 rounded-full bg-coral px-7 font-bold text-white shadow-md shadow-coral/20 transition-all hover:bg-[#C25852]"
            >
                <Plus className="h-4 w-4" />
                Añadir primera persona
            </button>

            <p className="text-xs text-grey/40">
                Tus ideas de regalo son privadas y solo las ves tú.
            </p>
        </div>
    );
}
