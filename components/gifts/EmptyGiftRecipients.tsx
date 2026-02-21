"use client";

import { Gift, Plus, Heart } from "lucide-react";

interface EmptyGiftRecipientsProps {
    onAddClick: () => void;
}

export function EmptyGiftRecipients({ onAddClick }: EmptyGiftRecipientsProps) {
    return (
        <div className="flex flex-col items-center justify-center text-center py-24 gap-6 animate-in fade-in slide-in-from-bottom-2 duration-400">
            {/* Illustration */}
            <div className="relative">
                <div className="w-28 h-28 rounded-full bg-teal/10 flex items-center justify-center">
                    <Gift className="w-14 h-14 text-teal/60" strokeWidth={1.5} />
                </div>
                <div className="absolute -top-1 -right-1 w-8 h-8 rounded-full bg-coral/10 flex items-center justify-center">
                    <Heart className="w-4 h-4 text-coral" />
                </div>
            </div>

            <div className="max-w-sm">
                <h2 className="font-serif text-2xl text-teal mb-2">
                    ¿A quién quieres sorprender?
                </h2>
                <p className="text-grey/60 text-sm leading-relaxed">
                    Añade a tus seres queridos, guarda ideas de regalo en secreto y nunca más te quedés sin inspiración.
                </p>
            </div>

            <button
                onClick={onAddClick}
                className="inline-flex items-center gap-2 bg-teal text-white px-7 py-3 rounded-full font-medium hover:bg-opacity-90 transition-all shadow-md shadow-teal/20 hover:shadow-lg hover:shadow-teal/30 hover:-translate-y-0.5"
            >
                <Plus className="w-4 h-4" />
                Añadir primera persona
            </button>

            <p className="text-xs text-grey/40 mt-1">
                Tus ideas de regalo siempre serán secretas — nunca las verán ellos
            </p>
        </div>
    );
}
