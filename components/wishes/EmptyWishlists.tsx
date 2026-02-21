"use client";

import { Heart, Plus, Sparkles } from "lucide-react";

interface EmptyWishlistsProps {
    onCreateClick: () => void;
}

export function EmptyWishlists({ onCreateClick }: EmptyWishlistsProps) {
    return (
        <div className="flex flex-col items-center justify-center text-center py-24 gap-6 animate-in fade-in slide-in-from-bottom-2 duration-400">
            {/* Illustration */}
            <div className="relative">
                <div className="w-28 h-28 rounded-full bg-coral/10 flex items-center justify-center">
                    <Heart className="w-14 h-14 text-coral/60" strokeWidth={1.5} />
                </div>
                <div className="absolute -top-1 -right-1 w-8 h-8 rounded-full bg-teal/10 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-teal" />
                </div>
            </div>

            <div className="max-w-sm">
                <h2 className="font-serif text-2xl text-teal mb-2">
                    Tu lista de deseos te está esperando
                </h2>
                <p className="text-grey/60 text-sm leading-relaxed">
                    Crea tu primera lista y compártela con tus seres queridos para que sepan qué libros deseas leer.
                </p>
            </div>

            <button
                onClick={onCreateClick}
                className="inline-flex items-center gap-2 bg-coral text-white px-7 py-3 rounded-full font-medium hover:bg-opacity-90 transition-all shadow-md shadow-coral/20 hover:shadow-lg hover:shadow-coral/30 hover:-translate-y-0.5"
            >
                <Plus className="w-4 h-4" />
                Crear mi primera lista
            </button>

            <p className="text-xs text-grey/40 mt-1">
                Puedes crear listas públicas, privadas o compartidas con personas concretas
            </p>
        </div>
    );
}
